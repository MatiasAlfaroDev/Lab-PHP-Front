# Actualización en tiempo real de vistas (cliente y profesional)

## Contexto

CitaPro ya tiene infraestructura de WebSockets (Laravel Reverb + `laravel-echo` + `pusher-js`)
para notificaciones de reservas: `ReservaNotification` se envía vía canal privado `user.{id}`,
y `NotificationContext.tsx` traduce cualquier notificación recibida en un
`CustomEvent("reserva-updated")` global en `window`. Varias vistas ya escuchan ese evento y
refetchean sus datos (`professional/dashboard`, `professional/agenda`, `professional/clients`,
`client/dashboard`, `client/mis-reservas`, `client/professional.$id`, `DateSlotPicker`).

Faltan dos cosas para que **todas** las vistas relevantes de cliente y profesional reflejen
cambios sin recargar:

1. Vistas que ya podrían beneficiarse del evento `reserva-updated` existente pero no lo
   escuchan: pagos y paquetes comprados.
2. Cambios de pago y de catálogo (servicios/paquetes) que hoy **no disparan ningún evento**
   en el backend — no hay `->notify()` en los flujos de pago, ni broadcast alguno en
   alta/edición/baja de servicios o paquetes.

## Alcance

Categorías de cambio cubiertas: reservas/turnos, pagos, servicios y paquetes, notificaciones.
Fuera de alcance: el chat (`messages.tsx` en ambos roles es UI mock sin backend real todavía)
y las vistas de `admin/*` (no mencionadas por el usuario).

## Arquitectura

Dos mecanismos según la audiencia del cambio:

- **Reservas y pagos** — el cambio afecta a 2 personas concretas (cliente + profesional de
  esa reserva). Se reusa el canal privado `user.{id}` ya existente. El frontend ya traduce
  cualquier notificación en `reserva-updated`; no se toca esa plumbing, solo se agregan
  llamadas `->notify()` en backend para pagos y se agregan listeners en las vistas de
  frontend que faltan.
- **Servicios y paquetes** — el cambio puede afectar a cualquier cliente navegando el
  catálogo, no a un usuario puntual. Se crea un canal **público** nuevo `catalogo` (sin auth,
  porque son datos públicos) con un evento Laravel `CatalogoActualizado`. El frontend se
  suscribe solo en las vistas que muestran catálogo de otros profesionales.

No se introduce un sistema de eventos genérico nuevo: se extiende el patrón existente
(notificación privada → evento global) y se agrega un segundo patrón solo donde el primero
no aplica.

## Backend (Lab-PHP-Back)

### Pagos

Agregar `->notify(new ReservaNotification(...))` (mismo patrón que `ReservaController`) en
`PagoController`/`PagoService`, reusando fecha/hora de la reserva relacionada:

- `capturarReserva` / `capturarReservaSDK` (pago PayPal aprobado) → notifica cliente y
  profesional.
- `pagarPresencial` / `confirmarPresencial` (pago presencial registrado) → notifica ambos.
- `cancelar` (pago rechazado/cancelado) → notifica ambos.
- `capturarPaquete` (pago de paquete aprobado) → notifica ambos.

### Catálogo

Nuevo evento `App\Events\CatalogoActualizado implements ShouldBroadcast`:

```php
broadcastOn(): new Channel('catalogo')
broadcastAs(): 'CatalogoActualizado'
payload: {
  tipo: 'servicio' | 'paquete',
  accion: 'creado' | 'actualizado' | 'eliminado',
  profesional_id: int,
  id: int,
}
```

Se dispara con `event(new CatalogoActualizado(...))` al final de
`ServicioService::nuevoServicio/actualizarServicio/eliminarServicio` y los métodos
equivalentes de `PaqueteService`, solo cuando `success === true`. No requiere registrar nada
en `routes/channels.php` (canal público, sin auth).

## Frontend (Lab-PHP-Front)

### Nuevo hook compartido

`app/hooks/useCatalogoUpdates.ts` — se suscribe a
`getEcho()?.channel('catalogo').listen('.CatalogoActualizado', cb)` y limpia la suscripción al
desmontar. No requiere token (canal público).

### Vistas que consumen el hook de catálogo

- `client/discover.tsx` — refetch (debounced ~500ms) del listado ante cualquier evento.
- `client/professional.$id.tsx` — ignora eventos cuyo `profesional_id` no coincide con el de
  la página; si coincide, refetch de servicios/paquetes del detalle.

### Vistas que solo necesitan el listener `reserva-updated` ya existente

Mismo patrón ya usado en 6 archivos (`window.addEventListener("reserva-updated", handler)` →
refetch → cleanup en `removeEventListener`):

- `professional/payments.tsx` → refetch `/profesional/pagos`.
- `client/payments.tsx` → refetch reservas/compras de paquetes.
- `client/packages.tsx` → refetch `/mis-compras-paquetes` (refleja sesiones consumidas al
  marcar asistencia).

### Sin cambios

- `professional/notifications.tsx` y `client/notifications.tsx` ya son reactivas: leen el
  estado compartido de `NotificationContext`, que el WS ya actualiza directamente.
- `professional/services.tsx`, `service-packages.tsx`, `availability.tsx` — el profesional
  edita su propio catálogo y ya actualiza su estado local con la respuesta del API; no
  necesitan consumir su propio broadcast.

## Flujo de datos (ejemplos)

1. Profesional A edita el precio de un servicio → `PUT /servicios/5` →
   `ServicioService::actualizarServicio` guarda y dispara `CatalogoActualizado` → Reverb lo
   emite en `catalogo` → cualquier pestaña con `discover.tsx` o `professional/A` abierta lo
   recibe vía Echo → refetch → precio actualizado sin reload.
2. Cliente B paga con PayPal → `capturarReserva` marca pago aprobado → `notify()` a B y A →
   canales privados `user.{B}` / `user.{A}` → `NotificationContext` dispara `reserva-updated`
   → `client/payments.tsx` (B) y `professional/payments.tsx` (A) refetch en simultáneo.

## Manejo de errores

- Si Echo/Reverb no conecta (red, Reverb caído), las suscripciones fallan silenciosamente —
  no rompe la UI, simplemente no hay refresco en vivo (igual que ya pasa hoy con
  `reserva-updated`); el usuario sigue viendo los datos del fetch inicial.
- `discover.tsx` debe debouncar el refetch ante una ráfaga de eventos (ej. el profesional
  guarda varios cambios seguidos).

## Testing

- Backend: tests con `Event::fake()` / `Notification::fake()` verificando que
  `CatalogoActualizado` y `ReservaNotification` se disparan en los puntos correctos.
- Frontend: verificación manual con dos sesiones de browser (cliente + profesional) abiertas
  a la vez, confirmando que payments/packages/discover/profile se actualizan sin recargar.
