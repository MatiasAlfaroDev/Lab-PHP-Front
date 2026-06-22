# CitaPro - Frontend (React)

## Descripción del sistema

CitaPro es una plataforma web para la gestión integral de reservas de servicios profesionales. Permite la interacción entre clientes, profesionales y administradores mediante una interfaz moderna, responsiva y accesible desde cualquier dispositivo.

El frontend fue desarrollado utilizando React, TypeScript y Vite, consumiendo una API REST desarrollada en Laravel. La aplicación permite gestionar servicios, reservas, pagos, disponibilidad, videollamadas, notificaciones y funcionalidades administrativas.

## Tecnologías utilizadas

- React
- TypeScript
- Vite
- React Router
- Leaflet
- LiveKit
- PayPal SDK
- Laravel Reverb (WebSockets)
- Google OAuth

## Funcionalidades principales

### Gestión de usuarios

- Registro de usuarios.
- Inicio de sesión mediante credenciales.
- Inicio de sesión con Google OAuth.
- Gestión y edición de perfiles.
- Control de acceso según roles:
  - Cliente
  - Profesional
  - Administrador

### Gestión de servicios

Los profesionales pueden:

- Crear servicios.
- Modificar servicios existentes.
- Eliminar servicios.
- Configurar duración, precio y modalidad.
- Configurar ubicación física mediante mapas interactivos.
- Definir políticas de cancelación y reprogramación.

### Gestión de disponibilidad

- Configuración de horarios semanales.
- Definición de excepciones horarias.
- Bloqueo automático de horarios ocupados.
- Visualización de disponibilidad.

### Gestión de reservas

Los clientes pueden:

- Reservar servicios individuales.
- Reservar utilizando sesiones adquiridas en paquetes.
- Consultar sus reservas.
- Cancelar reservas.
- Reprogramar reservas.

Los profesionales pueden:

- Confirmar reservas.
- Gestionar reservas asignadas.
- Registrar asistencia de clientes.

### Gestión de paquetes

- Creación de paquetes de servicios.
- Compra de paquetes por parte de clientes.
- Visualización de sesiones disponibles.
- Control de sesiones restantes.

### Pagos

- Integración con PayPal Sandbox.
- Registro de pagos presenciales.
- Seguimiento del estado de pagos asociados a reservas y paquetes.

### Videollamadas

- Integración con LiveKit.
- Creación de sesiones virtuales.
- Acceso a videollamadas para clientes y profesionales.

### Notificaciones

- Notificaciones en tiempo real mediante WebSockets.
- Avisos automáticos sobre:
  - Nuevas reservas.
  - Confirmaciones.
  - Cancelaciones.
  - Reprogramaciones.
  - Recordatorios de reservas.
  - Cambios de estado de usuarios.

### Administración

Los administradores pueden:

- Visualizar métricas generales.
- Gestionar usuarios.
- Bloquear cuentas.
- Reactivar cuentas.
- Consultar actividad reciente.
- Supervisar reservas y pagos.

## Instalación y ejecución

Instalar dependencias:

```cmd
npm install
```

Iniciar la aplicación:

```cmd
npm run dev
```

La aplicación se ejecuta en: http://localhost:5173

## Integraciones externas

### PayPal Sandbox

Procesamiento de pagos de reservas y paquetes.

### Google OAuth

Autenticación mediante cuentas de Google.

### Laravel Reverb

Comunicación en tiempo real mediante WebSockets.

### LiveKit

Videollamadas para servicios remotos.

### Leaflet + OpenStreetMap

Visualización geográfica de servicios y selección de ubicaciones.

## Despliegue

El frontend se encuentra desplegado en Vercel:
https://lab-php-front.vercel.app

El proceso de despliegue está automatizado mediante GitHub + Vercel, permitiendo actualizar la aplicación con cada cambio en el repositorio.

## Autores

- Juliana Méndez
- Cecilia Méndez
- Matías Alfaro
- Martina Castro

**Curso:** Laboratorio PHP 2026