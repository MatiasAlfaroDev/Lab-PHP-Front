# Actualización en tiempo real (cliente y profesional) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reservas, pagos, servicios y paquetes se reflejan sin recargar en todas las vistas de cliente y profesional que los muestran.

**Architecture:** Dos repos. Backend (`Lab-PHP-Back`, Laravel 12 + Reverb): reutiliza `ReservaNotification` sobre el canal privado `user.{id}` para pagos (mismo mecanismo que reservas), y agrega un evento público nuevo `CatalogoActualizado` en el canal `catalogo` para altas/ediciones/bajas de servicios y paquetes. Frontend (`Lab-PHP-Front`, React Router v7): las vistas de pago ya pueden escuchar el `CustomEvent("reserva-updated")` global que `NotificationContext.tsx` ya dispara ante cualquier notificación — solo falta agregar el listener en 3 vistas. Para catálogo se agrega un hook nuevo (`useCatalogoUpdates`) que se suscribe al canal público y lo consumen 2 vistas.

**Tech Stack:** Laravel 12, Reverb (broadcasting), Sanctum, PHPUnit / React 19, React Router v7, laravel-echo + pusher-js (cliente WS), TypeScript.

## Global Constraints

- Repo backend: `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`. Repo frontend: `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`. Son dos repos git independientes — cada commit de este plan se hace en el repo correspondiente, nunca mezclados.
- No hay framework de tests en el frontend (sin jest/vitest configurado) — la verificación de cada tarea frontend es `npm run typecheck` (script ya existente en `package.json`) más una verificación manual descrita en el paso correspondiente.
- El backend usa PHPUnit con SQLite en memoria (`phpunit.xml`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) y `BROADCAST_CONNECTION=null` en testing — no hay mocks para el cliente de PayPal (`Srmklive\PayPal\Services\PayPal`), así que los métodos que llaman a la API real de PayPal (`capturarReservaPaypal`, `capturarReservaSDK`, `capturarPaquetePaypal`) no se cubren con test automatizado; se verifican manualmente.
- `Servicio.profesional_id`, `Reserva.cliente_id` y `Cliente`/`Profesional.user_id` son todos IDs de `User` directamente (no hay una tabla intermedia con otro ID) — confirmado leyendo los modelos.
- No hacer `git commit` real sin que el usuario lo pida explícitamente fuera de este plan — los pasos de "Commit" de este documento son la convención de la skill `writing-plans`; al ejecutar, preguntar al usuario antes de confirmar cualquier commit real si no se ha autorizado en la sesión.

---

## Backend (Lab-PHP-Back)

### Task 1: Notificaciones de pago en `PagoService`

**Files:**
- Modify: `app/Services/PagoService.php`
- Test: `tests/Feature/PagoNotificacionesTest.php`

**Interfaces:**
- Consumes: `App\Notifications\ReservaNotification` (ya existe, constructor `(string $type, string $message, string $fecha, string $hora)`), modelos `Reserva`, `CompraPaquete`, `User`, `Pago`.
- Produces: dos helpers privados nuevos `notificarPago(Reserva $reserva, string $tipo, string $mensajeCliente, string $mensajeProfesional): void` y `notificarPagoPaquete(CompraPaquete $compra, string $tipo, string $mensajeCliente, ?string $mensajeProfesional = null): void`, usados por los 5 puntos de transición de pago. Estas notificaciones llegan al frontend como el `CustomEvent("reserva-updated")` ya existente — ningún consumidor nuevo se crea en este task.

- [ ] **Step 1: Escribir el test (falla porque los helpers/notify todavía no existen)**

Crear `tests/Feature/PagoNotificacionesTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\CompraPaquete;
use App\Models\Pago;
use App\Models\Paquete;
use App\Models\Profesional;
use App\Models\Reserva;
use App\Models\Servicio;
use App\Models\User;
use App\Notifications\ReservaNotification;
use App\Services\PagoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PagoNotificacionesTest extends TestCase
{
    use RefreshDatabase;

    private function crearReservaConPago(string $pagoEstado = 'pendiente'): array
    {
        $profesionalUser = User::factory()->create(['role' => 'professional']);
        Profesional::create(['user_id' => $profesionalUser->id]);

        $clienteUser = User::factory()->create(['role' => 'client']);
        Cliente::create(['user_id' => $clienteUser->id]);

        $servicio = Servicio::create([
            'profesional_id' => $profesionalUser->id,
            'nombre' => 'Sesión de prueba',
            'descripcion' => 'Descripción',
            'tipo' => 'Test',
            'precio' => 100,
            'duracion' => 60,
            'pausa' => 10,
            'modalidad' => 'virtual',
        ]);

        $reserva = Reserva::create([
            'cliente_id' => $clienteUser->id,
            'servicio_id' => $servicio->servicio_id,
            'fecha' => now()->toDateString(),
            'hora' => '10:00:00',
            'estado' => 'pendiente',
        ]);

        $pago = Pago::create([
            'reserva_id' => $reserva->reserva_id,
            'fecha' => now()->toDateString(),
            'monto' => 100,
            'estado' => $pagoEstado,
            'metodo' => 'presencial',
        ]);

        return [$profesionalUser, $clienteUser, $reserva, $pago];
    }

    public function test_confirmar_pago_presencial_notifica_a_cliente_y_profesional(): void
    {
        Notification::fake();

        [$profesionalUser, $clienteUser, $reserva] = $this->crearReservaConPago();

        $result = app(PagoService::class)->confirmarPagoPresencial($profesionalUser, $reserva->reserva_id);

        $this->assertTrue($result['success']);
        Notification::assertSentTo($clienteUser, ReservaNotification::class);
        Notification::assertSentTo($profesionalUser, ReservaNotification::class);
    }

    public function test_cancelar_paypal_de_reserva_notifica_a_cliente_y_profesional(): void
    {
        Notification::fake();

        [$profesionalUser, $clienteUser, , $pago] = $this->crearReservaConPago('pendiente');
        $pago->update(['paypal_order_id' => 'ORDER-123', 'metodo' => 'paypal']);

        app(PagoService::class)->cancelarPaypal('ORDER-123');

        $this->assertSame('cancelado', $pago->fresh()->estado);
        Notification::assertSentTo($clienteUser, ReservaNotification::class);
        Notification::assertSentTo($profesionalUser, ReservaNotification::class);
    }

    public function test_cancelar_paypal_de_paquete_notifica_al_cliente(): void
    {
        Notification::fake();

        $clienteUser = User::factory()->create(['role' => 'client']);
        Cliente::create(['user_id' => $clienteUser->id]);

        $paquete = Paquete::create([
            'nombre' => 'Paquete de prueba',
            'descripcion' => 'Descripción',
            'precio_total' => 200,
        ]);

        $compra = CompraPaquete::create([
            'cliente_id' => $clienteUser->id,
            'paquete_id' => $paquete->paquete_id,
            'fecha_compra' => now()->toDateString(),
        ]);

        $pago = Pago::create([
            'compra_paquete_id' => $compra->compra_paquete_id,
            'fecha' => now()->toDateString(),
            'monto' => 200,
            'estado' => 'pendiente',
            'metodo' => 'paypal',
            'paypal_order_id' => 'ORDER-PAQ-1',
        ]);

        app(PagoService::class)->cancelarPaypal('ORDER-PAQ-1');

        $this->assertSame('cancelado', $pago->fresh()->estado);
        Notification::assertSentTo($clienteUser, ReservaNotification::class);
    }
}
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`): `php artisan test --filter=PagoNotificacionesTest`
Expected: FAIL — `Notification::assertSentTo` no encuentra ninguna notificación enviada (los métodos de `PagoService` todavía no llaman a `notify()`).

- [ ] **Step 3: Implementar los helpers y conectarlos en los 5 puntos de transición**

En `app/Services/PagoService.php`, agregar el import (junto a los `use` existentes al inicio del archivo):

```php
use App\Models\User;
use App\Notifications\ReservaNotification;
```

Agregar estos dos métodos privados al final de la clase, antes del `}` de cierre:

```php
    private function notificarPago(Reserva $reserva, string $tipo, string $mensajeCliente, string $mensajeProfesional): void
    {
        if (!$reserva->relationLoaded('servicio')) {
            $reserva->load('servicio');
        }

        if (!$reserva->servicio) {
            return;
        }

        $cliente = User::find($reserva->cliente_id);
        $profesional = User::find($reserva->servicio->profesional_id);

        $cliente?->notify(new ReservaNotification($tipo, $mensajeCliente, $reserva->fecha, $reserva->hora));
        $profesional?->notify(new ReservaNotification($tipo, $mensajeProfesional, $reserva->fecha, $reserva->hora));
    }

    private function notificarPagoPaquete(CompraPaquete $compra, string $tipo, string $mensajeCliente, ?string $mensajeProfesional = null): void
    {
        if (!$compra->relationLoaded('paquete')) {
            $compra->load('paquete');
        }

        $cliente = User::find($compra->cliente_id);
        $fecha = now()->toDateString();
        $hora = now()->format('H:i:s');

        $cliente?->notify(new ReservaNotification($tipo, $mensajeCliente, $fecha, $hora));

        if ($mensajeProfesional !== null) {
            $profesional = $compra->paquete?->profesional?->user;
            $profesional?->notify(new ReservaNotification($tipo, $mensajeProfesional, $fecha, $hora));
        }
    }
```

En `capturarReservaPaypal`, justo antes de `return redirect($frontendUrl . '/client/reservas?pago=exito');`:

```php
        $reservaActualizada = Reserva::with('servicio')->find($pago->reserva_id);
        if ($reservaActualizada) {
            $this->notificarPago(
                $reservaActualizada,
                'Pago Aprobado',
                "Tu pago para el servicio: {$reservaActualizada->servicio->nombre} fue aprobado",
                "Se aprobó el pago de la reserva para el servicio: {$reservaActualizada->servicio->nombre}"
            );
        }

        return redirect($frontendUrl . '/client/reservas?pago=exito');
```

En `capturarReservaSDK`, justo antes de `return response()->json(['success' => true]);` (al final del método):

```php
        $reservaActualizada = Reserva::with('servicio')->find($pago->reserva_id);
        if ($reservaActualizada) {
            $this->notificarPago(
                $reservaActualizada,
                'Pago Aprobado',
                "Tu pago para el servicio: {$reservaActualizada->servicio->nombre} fue aprobado",
                "Se aprobó el pago de la reserva para el servicio: {$reservaActualizada->servicio->nombre}"
            );
        }

        return response()->json([
            'success' => true
        ]);
```

En `confirmarPagoPresencial`, cambiar la carga inicial de:
```php
        $reserva = Reserva::with('pago')->findOrFail($reserva_id);
```
a:
```php
        $reserva = Reserva::with('pago', 'servicio')->findOrFail($reserva_id);
```
y, justo después de `$reserva->pago()->update([...]);` y antes del `return [...'success' => true...];`:

```php
        $this->notificarPago(
            $reserva,
            'Pago Registrado',
            "Tu pago para el servicio: {$reserva->servicio->nombre} fue registrado por el profesional",
            "Registraste el pago presencial para el servicio: {$reserva->servicio->nombre}"
        );
```

En `cancelarPaypal`, dentro del `if ($pago) { ... }`, después de `$pago->update(['estado' => 'cancelado']);` y antes de calcular `$redirectPath`:

```php
            if ($pago->reserva_id) {
                $reservaCancelada = Reserva::with('servicio')->find($pago->reserva_id);
                if ($reservaCancelada) {
                    $this->notificarPago(
                        $reservaCancelada,
                        'Pago Cancelado',
                        "Tu pago para el servicio: {$reservaCancelada->servicio->nombre} fue cancelado",
                        "El pago para el servicio: {$reservaCancelada->servicio->nombre} fue cancelado"
                    );
                }
            } elseif ($pago->compra_paquete_id) {
                $compraCancelada = CompraPaquete::with('paquete')->find($pago->compra_paquete_id);
                if ($compraCancelada) {
                    $this->notificarPagoPaquete(
                        $compraCancelada,
                        'Pago Cancelado',
                        "Tu pago para el paquete: {$compraCancelada->paquete->nombre} fue cancelado"
                    );
                }
            }
```

(La línea `$redirectPath = $pago->compra_paquete_id ? '/client/packages' : '/client/reservas';` que ya existe se mantiene tal cual, después de este bloque.)

En `capturarPaquetePaypal`, justo antes de `return redirect($frontendUrl . '/client/packages?pago=exito');`:

```php
        $compraActualizada = CompraPaquete::with('paquete')->find($pago->compra_paquete_id);
        if ($compraActualizada) {
            $this->notificarPagoPaquete(
                $compraActualizada,
                'Pago de Paquete Aprobado',
                "Tu pago para el paquete: {$compraActualizada->paquete->nombre} fue aprobado",
                "Se vendió el paquete: {$compraActualizada->paquete->nombre}"
            );
        }

        return redirect($frontendUrl . '/client/packages?pago=exito');
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`): `php artisan test --filter=PagoNotificacionesTest`
Expected: PASS (3 tests, todos los asserts de `Notification::assertSentTo` satisfechos).

- [ ] **Step 5: Verificación manual de los 3 métodos que llaman a PayPal (no cubiertos por test automatizado)**

Con el entorno de dev levantado (`composer run dev` o equivalente) y el sandbox de PayPal configurado: completar un pago de una reserva por PayPal, completar un pago de un paquete por PayPal, y cancelar un pago desde el flujo de PayPal. En cada caso, confirmar en la campana de notificaciones (`/client/notifications` o `/professional/notifications`) que tanto cliente como profesional reciben una notificación nueva ("Pago Aprobado" / "Pago de Paquete Aprobado" / "Pago Cancelado").

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back"
git add app/Services/PagoService.php tests/Feature/PagoNotificacionesTest.php
git commit -m "feat: notificar a cliente y profesional ante cambios de estado de pago"
```

---

### Task 2: Evento público `CatalogoActualizado` + disparo desde `ServicioService`

**Files:**
- Create: `app/Events/CatalogoActualizado.php`
- Modify: `app/Services/ServicioService.php`
- Test: `tests/Feature/CatalogoEventoServicioTest.php`

**Interfaces:**
- Produces: evento `App\Events\CatalogoActualizado` (`ShouldBroadcast`, canal público `catalogo`, broadcastAs `CatalogoActualizado`), con propiedades públicas `tipo: string`, `accion: string`, `profesionalId: int`, `id: int`, y `broadcastWith()` que emite `{tipo, accion, profesional_id, id}`. Lo consume el frontend en el Task 7 (`useCatalogoUpdates`).
- Consumes: nada nuevo — se dispara con la función global `event()` de Laravel.

- [ ] **Step 1: Escribir el test (falla porque el evento y el disparo no existen)**

Crear `tests/Feature/CatalogoEventoServicioTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Events\CatalogoActualizado;
use App\Models\Profesional;
use App\Models\Servicio;
use App\Models\User;
use App\Services\ServicioService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CatalogoEventoServicioTest extends TestCase
{
    use RefreshDatabase;

    private function crearProfesional(): User
    {
        $user = User::factory()->create(['role' => 'professional']);
        Profesional::create(['user_id' => $user->id]);
        return $user;
    }

    private function crearServicio(User $profesional, string $nombre = 'Original'): Servicio
    {
        return Servicio::create([
            'profesional_id' => $profesional->id,
            'nombre' => $nombre,
            'descripcion' => 'Descripción',
            'tipo' => 'Test',
            'precio' => 100,
            'duracion' => 60,
            'pausa' => 10,
            'modalidad' => 'virtual',
        ]);
    }

    public function test_crear_servicio_dispara_catalogo_actualizado(): void
    {
        Event::fake([CatalogoActualizado::class]);

        $profesional = $this->crearProfesional();

        $result = app(ServicioService::class)->nuevoServicio([
            'nombre' => 'Sesión de prueba',
            'descripcion' => 'Descripción',
            'modalidad' => 'virtual',
            'tipo' => 'Test',
            'precio' => 100,
            'duracion' => 60,
            'pausa' => 10,
        ], $profesional);

        $this->assertTrue($result['success']);

        Event::assertDispatched(CatalogoActualizado::class, function (CatalogoActualizado $event) use ($profesional, $result) {
            return $event->tipo === 'servicio'
                && $event->accion === 'creado'
                && $event->profesionalId === $profesional->id
                && $event->id === $result['data']->servicio_id;
        });
    }

    public function test_actualizar_servicio_dispara_catalogo_actualizado(): void
    {
        Event::fake([CatalogoActualizado::class]);

        $profesional = $this->crearProfesional();
        $servicio = $this->crearServicio($profesional);

        $result = app(ServicioService::class)->actualizarServicio($servicio->servicio_id, ['precio' => 150], $profesional);

        $this->assertTrue($result['success']);

        Event::assertDispatched(CatalogoActualizado::class, function (CatalogoActualizado $event) use ($profesional, $servicio) {
            return $event->tipo === 'servicio'
                && $event->accion === 'actualizado'
                && $event->profesionalId === $profesional->id
                && $event->id === $servicio->servicio_id;
        });
    }

    public function test_eliminar_servicio_dispara_catalogo_actualizado(): void
    {
        Event::fake([CatalogoActualizado::class]);

        $profesional = $this->crearProfesional();
        $servicio = $this->crearServicio($profesional, 'Para borrar');

        $result = app(ServicioService::class)->eliminarServicio($servicio->servicio_id, $profesional);

        $this->assertTrue($result['success']);

        Event::assertDispatched(CatalogoActualizado::class, function (CatalogoActualizado $event) use ($profesional, $servicio) {
            return $event->tipo === 'servicio'
                && $event->accion === 'eliminado'
                && $event->profesionalId === $profesional->id
                && $event->id === $servicio->servicio_id;
        });
    }
}
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`): `php artisan test --filter=CatalogoEventoServicioTest`
Expected: FAIL — error de clase no encontrada `App\Events\CatalogoActualizado` (todavía no existe).

- [ ] **Step 3: Crear el evento**

Crear `app/Events/CatalogoActualizado.php`:

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class CatalogoActualizado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public string $tipo,
        public string $accion,
        public int $profesionalId,
        public int $id,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('catalogo')];
    }

    public function broadcastAs(): string
    {
        return 'CatalogoActualizado';
    }

    public function broadcastWith(): array
    {
        return [
            'tipo' => $this->tipo,
            'accion' => $this->accion,
            'profesional_id' => $this->profesionalId,
            'id' => $this->id,
        ];
    }
}
```

- [ ] **Step 4: Disparar el evento desde `ServicioService`**

En `app/Services/ServicioService.php`, agregar el import junto a los `use` existentes:

```php
use App\Events\CatalogoActualizado;
```

En `nuevoServicio`, justo antes de `return ['success' => true, 'message' => 'Servicio creado correctamente', 'data' => $servicio];`:

```php
        event(new CatalogoActualizado('servicio', 'creado', $profesional->user_id, $servicio->servicio_id));
```

En `actualizarServicio`, justo antes de `return ['success' => true, 'message' => 'Servicio actualizado', 'data' => $servicio->fresh()];`:

```php
        event(new CatalogoActualizado('servicio', 'actualizado', $servicio->profesional_id, $servicio->servicio_id));
```

En `eliminarServicio`, justo antes de `return ['success' => true, 'message' => 'Servicio eliminado correctamente'];` (después del `DB::table('servicios')->where(...)->update(['eliminado' => DB::raw('true')]);`):

```php
        event(new CatalogoActualizado('servicio', 'eliminado', $servicio->profesional_id, $servicio->servicio_id));
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`): `php artisan test --filter=CatalogoEventoServicioTest`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back"
git add app/Events/CatalogoActualizado.php app/Services/ServicioService.php tests/Feature/CatalogoEventoServicioTest.php
git commit -m "feat: emitir CatalogoActualizado al crear, editar o eliminar un servicio"
```

---

### Task 3: Disparar `CatalogoActualizado` desde `PaqueteService`

**Files:**
- Modify: `app/Services/PaqueteService.php`
- Test: `tests/Feature/CatalogoEventoPaqueteTest.php`

**Interfaces:**
- Consumes: `App\Events\CatalogoActualizado` creado en el Task 2.
- Produces: mismos eventos que el Task 2 pero con `tipo: 'paquete'`, disparados desde `crearPaquete`, `actualizarPaquete` y `eliminarPaquete`.

- [ ] **Step 1: Escribir el test (falla porque el disparo no existe en `PaqueteService`)**

Crear `tests/Feature/CatalogoEventoPaqueteTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Events\CatalogoActualizado;
use App\Models\Profesional;
use App\Models\Servicio;
use App\Models\User;
use App\Services\PaqueteService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CatalogoEventoPaqueteTest extends TestCase
{
    use RefreshDatabase;

    private function crearProfesionalConServicio(): array
    {
        $profesional = User::factory()->create(['role' => 'professional']);
        Profesional::create(['user_id' => $profesional->id]);

        $servicio = Servicio::create([
            'profesional_id' => $profesional->id,
            'nombre' => 'Servicio del paquete',
            'descripcion' => 'Descripción',
            'tipo' => 'Test',
            'precio' => 100,
            'duracion' => 60,
            'pausa' => 10,
            'modalidad' => 'virtual',
        ]);

        return [$profesional, $servicio];
    }

    public function test_crear_paquete_dispara_catalogo_actualizado(): void
    {
        Event::fake([CatalogoActualizado::class]);

        [$profesional, $servicio] = $this->crearProfesionalConServicio();

        $result = app(PaqueteService::class)->crearPaquete([
            'nombre' => 'Paquete de prueba',
            'descripcion' => 'Descripción',
            'precio_total' => 250,
            'servicios' => [
                ['servicio_id' => $servicio->servicio_id, 'cantidad_sesiones' => 3],
            ],
        ], $profesional);

        $this->assertTrue($result['success']);

        Event::assertDispatched(CatalogoActualizado::class, function (CatalogoActualizado $event) use ($profesional, $result) {
            return $event->tipo === 'paquete'
                && $event->accion === 'creado'
                && $event->profesionalId === $profesional->id
                && $event->id === $result['paquete_id'];
        });
    }

    public function test_actualizar_paquete_dispara_catalogo_actualizado(): void
    {
        Event::fake([CatalogoActualizado::class]);

        [$profesional, $servicio] = $this->crearProfesionalConServicio();
        $paqueteService = app(PaqueteService::class);

        $creado = $paqueteService->crearPaquete([
            'nombre' => 'Paquete original',
            'descripcion' => 'Descripción',
            'precio_total' => 250,
            'servicios' => [
                ['servicio_id' => $servicio->servicio_id, 'cantidad_sesiones' => 3],
            ],
        ], $profesional);

        Event::fake([CatalogoActualizado::class]);

        $result = $paqueteService->actualizarPaquete($creado['paquete_id'], [
            'nombre' => 'Paquete actualizado',
            'descripcion' => 'Descripción',
            'precio_total' => 300,
            'servicios' => [
                ['servicio_id' => $servicio->servicio_id, 'cantidad_sesiones' => 5],
            ],
        ], $profesional);

        $this->assertTrue($result['success']);

        Event::assertDispatched(CatalogoActualizado::class, function (CatalogoActualizado $event) use ($profesional, $creado) {
            return $event->tipo === 'paquete'
                && $event->accion === 'actualizado'
                && $event->profesionalId === $profesional->id
                && $event->id === $creado['paquete_id'];
        });
    }

    public function test_eliminar_paquete_dispara_catalogo_actualizado(): void
    {
        [$profesional, $servicio] = $this->crearProfesionalConServicio();
        $paqueteService = app(PaqueteService::class);

        $creado = $paqueteService->crearPaquete([
            'nombre' => 'Paquete a borrar',
            'descripcion' => 'Descripción',
            'precio_total' => 250,
            'servicios' => [
                ['servicio_id' => $servicio->servicio_id, 'cantidad_sesiones' => 3],
            ],
        ], $profesional);

        Event::fake([CatalogoActualizado::class]);

        $result = $paqueteService->eliminarPaquete($creado['paquete_id'], $profesional);

        $this->assertTrue($result['success']);

        Event::assertDispatched(CatalogoActualizado::class, function (CatalogoActualizado $event) use ($profesional, $creado) {
            return $event->tipo === 'paquete'
                && $event->accion === 'eliminado'
                && $event->profesionalId === $profesional->id
                && $event->id === $creado['paquete_id'];
        });
    }
}
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`): `php artisan test --filter=CatalogoEventoPaqueteTest`
Expected: FAIL — los 3 asserts de `Event::assertDispatched` no encuentran el evento (todavía no se dispara desde `PaqueteService`).

- [ ] **Step 3: Disparar el evento desde `PaqueteService`**

En `app/Services/PaqueteService.php`, agregar el import junto a los `use` existentes:

```php
use App\Events\CatalogoActualizado;
```

En `crearPaquete`, dentro del `try`, justo antes de `DB::commit();`:

```php
            DB::commit();

            event(new CatalogoActualizado('paquete', 'creado', $user->id, $paquete->paquete_id));

            return [
                'success' => true,
                'message' => 'Paquete creado correctamente',
                'paquete_id' => $paquete->paquete_id
            ];
```

(Nota: el `DB::commit();` original queda antes del `event()`, no después — el evento se dispara una vez que la transacción ya confirmó los datos.)

En `actualizarPaquete`, dentro del `try`, en el mismo lugar (justo después de `DB::commit();` y antes del `return ['success' => true, 'message' => 'Paquete actualizado'];`):

```php
            DB::commit();

            event(new CatalogoActualizado('paquete', 'actualizado', $user->id, (int) $id));

            return [
                'success' => true,
                'message' => 'Paquete actualizado'
            ];
```

En `eliminarPaquete`, después del bloque `DB::table('paquetes')->where('paquete_id', $id)->update(['eliminado' => DB::raw('true')]);` y antes de `return ['success' => true, 'message' => 'Paquete eliminado correctamente'];`:

```php
        event(new CatalogoActualizado('paquete', 'eliminado', $user->id, (int) $id));
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back`): `php artisan test --filter=CatalogoEventoPaqueteTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\Usuario\Documents\UTEC\Lab-PHP-Back"
git add app/Services/PaqueteService.php tests/Feature/CatalogoEventoPaqueteTest.php
git commit -m "feat: emitir CatalogoActualizado al crear, editar o eliminar un paquete"
```

---

## Frontend (Lab-PHP-Front)

### Task 4: Listener `reserva-updated` en `professional/payments.tsx`

**Files:**
- Modify: `app/routes/professional/payments.tsx`

**Interfaces:**
- Consumes: `CustomEvent("reserva-updated")` ya disparado globalmente por `app/context/NotificationContext.tsx` ante cualquier notificación WS (incluye las de pago agregadas en el Task 1 del backend).

- [ ] **Step 1: Extraer el fetch a una función nombrada y agregar el listener**

En `app/routes/professional/payments.tsx`, reemplazar:

```tsx
  useEffect(() => {
    if (!token || !user) return;

    api
      .get("/profesional/pagos", token)
      .then((res: any) => setTransactions(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, user]);
```

por:

```tsx
  const loadPagos = () => {
    if (!token || !user) return;

    api
      .get("/profesional/pagos", token)
      .then((res: any) => setTransactions(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPagos();
  }, [token, user]);

  useEffect(() => {
    const handler = () => loadPagos();
    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [token, user]);
```

- [ ] **Step 2: Typecheck**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`): `npm run typecheck`
Expected: sin errores nuevos.

- [ ] **Step 3: Verificación manual**

Con el dev server corriendo (`npm run dev`), abrir `/professional/payments` en una pestaña logueado como profesional. En otra pestaña (o con `php artisan tinker` / la API directamente) confirmar un pago presencial de una de sus reservas. Confirmar que la tabla de pagos en `/professional/payments` se actualiza sola, sin recargar la página.

- [ ] **Step 4: Commit**

```bash
git add app/routes/professional/payments.tsx
git commit -m "feat: refrescar pagos del profesional en tiempo real"
```

---

### Task 5: Listener `reserva-updated` en `client/payments.tsx`

**Files:**
- Modify: `app/routes/client/payments.tsx`

**Interfaces:**
- Consumes: `CustomEvent("reserva-updated")` (igual que Task 4).

- [ ] **Step 1: Extraer el fetch a una función nombrada y agregar el listener**

En `app/routes/client/payments.tsx`, reemplazar:

```tsx
  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get<{ success: boolean; data: Reserva[] }>("/mis-reservas", token),
      api.get<any[]>("/mis-compras-paquetes", token),
    ])
      .then(([reservasRes, paquetesRes]) => {
        if (reservasRes.success) {
          setReservas(reservasRes.data);
        }

        setComprasPaquetes(paquetesRes);
      })
      .finally(() => setLoading(false));
  }, [token]);
```

por:

```tsx
  const loadPagos = () => {
    if (!token) return;
    Promise.all([
      api.get<{ success: boolean; data: Reserva[] }>("/mis-reservas", token),
      api.get<any[]>("/mis-compras-paquetes", token),
    ])
      .then(([reservasRes, paquetesRes]) => {
        if (reservasRes.success) {
          setReservas(reservasRes.data);
        }

        setComprasPaquetes(paquetesRes);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPagos();
  }, [token]);

  useEffect(() => {
    const handler = () => loadPagos();
    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [token]);
```

- [ ] **Step 2: Typecheck**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`): `npm run typecheck`
Expected: sin errores nuevos.

- [ ] **Step 3: Verificación manual**

Logueado como cliente, abrir `/client/payments`. Desde otra sesión (profesional) o la API, confirmar el pago presencial de una de las reservas de ese cliente. Confirmar que `/client/payments` muestra el estado actualizado sin recargar.

- [ ] **Step 4: Commit**

```bash
git add app/routes/client/payments.tsx
git commit -m "feat: refrescar pagos del cliente en tiempo real"
```

---

### Task 6: Listener `reserva-updated` en `client/packages.tsx`

**Files:**
- Modify: `app/routes/client/packages.tsx`

**Interfaces:**
- Consumes: `CustomEvent("reserva-updated")` (igual que Task 4) — en particular, lo dispara `professional/clients.tsx` cuando el profesional marca asistencia (consumiendo una sesión del paquete).

- [ ] **Step 1: Sacar `loadPackages` del `useEffect` y agregar el listener**

En `app/routes/client/packages.tsx`, reemplazar:

```tsx
  useEffect(() => {
    if (!token) return;

    const loadPackages = async () => {
      try {
        const misCompras = await api.get<any[]>(
          "/mis-compras-paquetes",
          token
        );

        setPackages(misCompras);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, [token]);
```

por:

```tsx
  const loadPackages = async () => {
    if (!token) return;

    try {
      const misCompras = await api.get<any[]>(
        "/mis-compras-paquetes",
        token
      );

      setPackages(misCompras);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [token]);

  useEffect(() => {
    const handler = () => loadPackages();
    window.addEventListener("reserva-updated", handler);
    return () => window.removeEventListener("reserva-updated", handler);
  }, [token]);
```

- [ ] **Step 2: Typecheck**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`): `npm run typecheck`
Expected: sin errores nuevos.

- [ ] **Step 3: Verificación manual**

Logueado como cliente con un paquete activo, abrir `/client/packages`. Desde la sesión del profesional, en `/professional/clients`, marcar asistencia de una reserva que consume una sesión de ese paquete. Confirmar que `/client/packages` actualiza las sesiones restantes sin recargar.

- [ ] **Step 4: Commit**

```bash
git add app/routes/client/packages.tsx
git commit -m "feat: refrescar paquetes del cliente en tiempo real"
```

---

### Task 7: Hook `useCatalogoUpdates` + integración en `client/discover.tsx`

**Files:**
- Create: `app/hooks/useCatalogoUpdates.ts`
- Modify: `app/routes/client/discover.tsx`

**Interfaces:**
- Consumes: `getEcho(token?: string)` de `app/lib/echo.ts` (ya existe), `useAuth()` de `app/context/AuthContext.tsx` (ya existe), evento `CatalogoActualizado` del backend (Task 2/3) con payload `{tipo: 'servicio'|'paquete', accion: 'creado'|'actualizado'|'eliminado', profesional_id: number, id: number}`.
- Produces: `useCatalogoUpdates(onUpdate: (evento: CatalogoEvento) => void): void` — hook que no devuelve estado, solo invoca `onUpdate` (debounced 500ms) cada vez que llega un evento por el canal público `catalogo`. Lo consume también el Task 8.

- [ ] **Step 1: Crear el hook**

Crear `app/hooks/useCatalogoUpdates.ts`:

```ts
import { useEffect, useRef } from "react";
import { useAuth } from "~/context/AuthContext";
import { getEcho } from "~/lib/echo";

export type CatalogoEvento = {
  tipo: "servicio" | "paquete";
  accion: "creado" | "actualizado" | "eliminado";
  profesional_id: number;
  id: number;
};

const DEBOUNCE_MS = 500;

export function useCatalogoUpdates(onUpdate: (evento: CatalogoEvento) => void) {
  const { token } = useAuth();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const echo = getEcho(token ?? undefined);
    if (!echo) return;

    const channel = echo.channel("catalogo");
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = (evento: CatalogoEvento) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(evento), DEBOUNCE_MS);
    };

    channel.listen(".CatalogoActualizado", handler);

    return () => {
      if (timer) clearTimeout(timer);
      channel.stopListening(".CatalogoActualizado", handler);
    };
  }, [token]);
}
```

- [ ] **Step 2: Typecheck del hook (sin consumidores todavía)**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`): `npm run typecheck`
Expected: sin errores nuevos.

- [ ] **Step 3: Consumirlo en `discover.tsx`**

En `app/routes/client/discover.tsx`, agregar el import junto a los existentes (después de `import "leaflet/dist/leaflet.css";`):

```tsx
import { useCatalogoUpdates } from "~/hooks/useCatalogoUpdates";
```

Agregar el estado nuevo junto a los demás `useState` del componente (después de `const [markerIcon, setMarkerIcon] = useState<any>(null);`):

```tsx
  const [catalogVersion, setCatalogVersion] = useState(0);
  useCatalogoUpdates(() => setCatalogVersion((v) => v + 1));
```

Modificar el efecto de paquetes:

```tsx
  // Paquetes (sin filtros de back — Tarea 2 solo cubre /servicios)
  useEffect(() => {
    api
      .get<Paquete[] | { success: boolean; data: Paquete[] }>("/paquetes", token)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any).data ?? [];
        setPaquetes(list);
      })
      .catch((e) => setErrorPkg(e.message ?? "Error al cargar paquetes"))
      .finally(() => setLoadingPkg(false));
  }, [token, catalogVersion]);
```

(el único cambio es agregar `catalogVersion` al array de dependencias).

Modificar el efecto de servicios filtrados, cuyo array de dependencias hoy es:

```tsx
  }, [search, selectedType, selectedModality, priceRange, maxPrice, orden]);
```

por:

```tsx
  }, [search, selectedType, selectedModality, priceRange, maxPrice, orden, catalogVersion]);
```

- [ ] **Step 4: Typecheck**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`): `npm run typecheck`
Expected: sin errores nuevos.

- [ ] **Step 5: Verificación manual**

Abrir `/client/discover` en una pestaña. Desde la sesión de un profesional, editar el precio de uno de sus servicios en `/professional/services`. Confirmar que la lista en `/client/discover` muestra el precio nuevo sin recargar (puede tardar hasta ~500ms por el debounce).

- [ ] **Step 6: Commit**

```bash
git add app/hooks/useCatalogoUpdates.ts app/routes/client/discover.tsx
git commit -m "feat: refrescar el listado de discover ante cambios de catálogo en vivo"
```

---

### Task 8: Integrar `useCatalogoUpdates` en `client/professional.$id.tsx`

**Files:**
- Modify: `app/routes/client/professional.$id.tsx`

**Interfaces:**
- Consumes: `useCatalogoUpdates` del Task 7.

- [ ] **Step 1: Consumir el hook filtrando por `profesional_id`**

En `app/routes/client/professional.$id.tsx`, agregar el import junto a los existentes (después de `import { DateSlotPicker, normalizeModality, type Slot } from "~/components/DateSlotPicker";`):

```tsx
import { useCatalogoUpdates } from "~/hooks/useCatalogoUpdates";
```

Agregar el estado nuevo junto a los demás `useState` del componente principal (después de `const [loadingCalificaciones, setLoadingCalificaciones] = useState(false);`):

```tsx
  const [catalogVersion, setCatalogVersion] = useState(0);
  useCatalogoUpdates((evento) => {
    if (Number(evento.profesional_id) === Number(id)) {
      setCatalogVersion((v) => v + 1);
    }
  });
```

Modificar el array de dependencias del efecto "Load profile", que hoy es:

```tsx
  }, [id, servicioIdPreseleccionado, servicioPaqueteId, reprogramarId]);
```

por:

```tsx
  }, [id, servicioIdPreseleccionado, servicioPaqueteId, reprogramarId, catalogVersion]);
```

- [ ] **Step 2: Typecheck**

Run (desde `C:\Users\Usuario\Documents\UTEC\Lab-PHP-Front`): `npm run typecheck`
Expected: sin errores nuevos.

- [ ] **Step 3: Verificación manual**

Abrir `/client/professional/{id}` de un profesional en una pestaña. Desde la sesión de ese profesional, agregar un servicio nuevo en `/professional/services`. Confirmar que la pestaña del cliente muestra el servicio nuevo en la lista de "Servicios" sin recargar. Repetir editando un servicio de OTRO profesional y confirmar que esta página NO se refresca (el filtro por `profesional_id` funciona).

- [ ] **Step 4: Commit**

```bash
git add app/routes/client/professional.\$id.tsx
git commit -m "feat: refrescar el perfil de profesional ante cambios de catálogo en vivo"
```
