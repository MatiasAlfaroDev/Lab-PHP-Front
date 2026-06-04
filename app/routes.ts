import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
  route("client", "routes/client/_layout.tsx", [
    index("routes/client/dashboard.tsx"),
    route("discover", "routes/client/discover.tsx"),
    route("professional/:id", "routes/client/professional.$id.tsx"),
    route("booking/:id/pay", "routes/client/booking.$id.pay.tsx"),
    route("package/:id/pay", "routes/client/package.$id.pay.tsx"),
    route("compra-paquete/:id/pay", "routes/client/compra-package.$id.pay.tsx"),
    route("packages", "routes/client/packages.tsx"),
    route("messages", "routes/client/messages.tsx"),
    route("payments", "routes/client/payments.tsx"),
    route("notifications", "routes/client/notifications.tsx"),
    route("reservas", "routes/client/mis-reservas.tsx"),
    route("profile", "routes/client/profile.tsx"),
  ]),

  route("professional", "routes/professional/_layout.tsx", [
    index("routes/professional/clients.tsx"),
    route("dashboard", "routes/professional/dashboard.tsx"),
    route("services", "routes/professional/services.tsx"),
    route("service-packages", "routes/professional/service-packages.tsx"),
    route("availability", "routes/professional/availability.tsx"),
    route("payments", "routes/professional/payments.tsx"),
    route("messages", "routes/professional/messages.tsx"),
    route("profile", "routes/professional/profile.tsx"),
  ]),

  route("admin", "routes/admin/_layout.tsx", [
    index("routes/admin/dashboard.tsx"),
    route("users", "routes/admin/users.tsx"),
    route("payments", "routes/admin/payments.tsx"),
  ]),
  route("videollamada/:id", "routes/videollamada.tsx"),

  route("session/:id", "routes/session.$id.tsx"),
  route("session/:id/rating", "routes/session.$id.rating.tsx"),
] satisfies RouteConfig;
