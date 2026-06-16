import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { Link, Links, Meta, NavLink, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, useNavigate, useParams, useSearchParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { ToastContainer, toast } from "react-toastify";
import { Bell } from "lucide-react";
import { Room, Track } from "livekit-client";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region node_modules/@react-router/dev/dist/config/defaults/entry.server.node.tsx
var entry_server_node_exports = /* @__PURE__ */ __exportAll({
	default: () => handleRequest,
	streamTimeout: () => streamTimeout
});
var streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
	if (request.method.toUpperCase() === "HEAD") return new Response(null, {
		status: responseStatusCode,
		headers: responseHeaders
	});
	return new Promise((resolve, reject) => {
		let shellRendered = false;
		let userAgent = request.headers.get("user-agent");
		let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
		let timeoutId = setTimeout(() => abort(), streamTimeout + 1e3);
		const { pipe, abort } = renderToPipeableStream(/* @__PURE__ */ jsx(ServerRouter, {
			context: routerContext,
			url: request.url
		}), {
			[readyOption]() {
				shellRendered = true;
				const body = new PassThrough({ final(callback) {
					clearTimeout(timeoutId);
					timeoutId = void 0;
					callback();
				} });
				const stream = createReadableStreamFromReadable(body);
				responseHeaders.set("Content-Type", "text/html");
				pipe(body);
				resolve(new Response(stream, {
					headers: responseHeaders,
					status: responseStatusCode
				}));
			},
			onShellError(error) {
				reject(error);
			},
			onError(error) {
				responseStatusCode = 500;
				if (shellRendered) console.error(error);
			}
		});
	});
}
//#endregion
//#region app/lib/api.ts
var BASE_URL = "http://localhost:8000/api";
var APP_BASE_URL = BASE_URL.replace(/\/api\/?$/, "");
var cache = /* @__PURE__ */ new Map();
var TTL = 6e4;
function getCached(key) {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expires) {
		cache.delete(key);
		return null;
	}
	return entry.data;
}
function setCached(key, data) {
	cache.set(key, {
		data,
		expires: Date.now() + TTL
	});
}
function invalidateCache(pathPrefix) {
	for (const key of cache.keys()) if (key.startsWith(pathPrefix)) cache.delete(key);
}
async function request(path, options = {}, token) {
	const method = (options.method ?? "GET").toUpperCase();
	const cacheKey = `${path}::${token ?? ""}`;
	if (method === "GET") {
		const hit = getCached(cacheKey);
		if (hit !== null) return hit;
	}
	const headers = {
		"Content-Type": "application/json",
		Accept: "application/json",
		...options.headers
	};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const res = await fetch(`${BASE_URL}${path}`, {
		...options,
		headers
	});
	if (!res.ok) {
		const err = await res.json().catch(() => null);
		if (err?.errors) {
			const first = Object.values(err.errors)[0];
			throw new Error(Array.isArray(first) ? first[0] : err.message ?? `Error ${res.status}`);
		}
		throw new Error(err?.message ?? err?.error ?? `Error ${res.status}: ${res.statusText || "Request failed"}`);
	}
	const data = await res.json();
	if (method === "GET") setCached(cacheKey, data);
	if (method !== "GET") invalidateCache("/" + path.split("/").slice(1, 3).join("/"));
	return data;
}
var api = {
	get: (path, token) => request(path, { method: "GET" }, token),
	post: (path, body, token) => request(path, {
		method: "POST",
		body: JSON.stringify(body)
	}, token),
	put: (path, body, token) => request(path, {
		method: "PUT",
		body: JSON.stringify(body)
	}, token),
	delete: (path, token) => request(path, { method: "DELETE" }, token)
};
//#endregion
//#region app/context/AuthContext.tsx
var AuthContext = createContext({
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: true,
	login: () => {},
	logout: () => {},
	updateUser: () => {}
});
function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedToken = localStorage.getItem("citapro_token");
			const storedUser = localStorage.getItem("citapro_user");
			if (storedToken && storedUser) {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
			}
		}
		setIsLoading(false);
	}, []);
	const login = (newToken, newUser) => {
		localStorage.setItem("citapro_token", newToken);
		localStorage.setItem("citapro_user", JSON.stringify(newUser));
		setToken(newToken);
		setUser(newUser);
	};
	const updateUser = (updates) => {
		if (!user) return;
		const updated = {
			...user,
			...updates
		};
		localStorage.setItem("citapro_user", JSON.stringify(updated));
		setUser(updated);
	};
	const logout = async () => {
		try {
			if (token) await api.post("/logout", {}, token);
		} catch (error) {
			console.error("Error al cerrar sesión", error);
		}
		localStorage.removeItem("citapro_token");
		localStorage.removeItem("citapro_user");
		setToken(null);
		setUser(null);
	};
	return /* @__PURE__ */ jsx(AuthContext.Provider, {
		value: {
			user,
			token,
			isAuthenticated: !!token,
			isLoading,
			login,
			logout,
			updateUser
		},
		children
	});
}
function useAuth() {
	return useContext(AuthContext);
}
//#endregion
//#region app/root.tsx
var root_exports = /* @__PURE__ */ __exportAll({
	ErrorBoundary: () => ErrorBoundary,
	Layout: () => Layout,
	default: () => root_default,
	links: () => links
});
var links = () => [
	{
		rel: "preconnect",
		href: "https://fonts.googleapis.com"
	},
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous"
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Geist:wght@300;400;500;600;700&display=swap"
	},
	{
		rel: "manifest",
		href: "/manifest.webmanifest"
	},
	{
		rel: "apple-touch-icon",
		href: "/icon.svg"
	}
];
function ServiceWorkerRegistration() {
	useEffect(() => {
		if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
	}, []);
	return null;
}
function Layout({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "es",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
			/* @__PURE__ */ jsx("meta", {
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "theme-color",
				content: "#1c1c1c"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "description",
				content: "Gestiona tus citas, paquetes y pagos en una sola plataforma"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "mobile-web-app-capable",
				content: "yes"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "apple-mobile-web-app-capable",
				content: "yes"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "apple-mobile-web-app-title",
				content: "CitaPro"
			}),
			/* @__PURE__ */ jsx(Meta, {}),
			/* @__PURE__ */ jsx(Links, {}),
			/* @__PURE__ */ jsx("script", {
				type: "module",
				src: "https://unpkg.com/ionicons@7.4.0/dist/ionicons/ionicons.esm.js"
			}),
			/* @__PURE__ */ jsx("script", {
				noModule: true,
				src: "https://unpkg.com/ionicons@7.4.0/dist/ionicons/ionicons.js"
			})
		] }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsx(AuthProvider, { children }),
			/* @__PURE__ */ jsx(ServiceWorkerRegistration, {}),
			/* @__PURE__ */ jsx(ScrollRestoration, {}),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	});
}
var root_default = UNSAFE_withComponentProps(function App() {
	return /* @__PURE__ */ jsx(Outlet, {});
});
var ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary({ error }) {
	let message = "Oops!";
	let details = "Ocurrió un error inesperado.";
	let stack;
	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details = error.status === 404 ? "La página solicitada no existe." : error.statusText || details;
	}
	return /* @__PURE__ */ jsx("main", {
		className: "min-h-screen flex items-center justify-center bg-bg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "text-center p-8",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-5xl text-ink mb-4",
					children: message
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mb-6",
					children: details
				}),
				stack
			]
		})
	});
});
//#endregion
//#region app/routes/home.tsx
var home_exports = /* @__PURE__ */ __exportAll({
	default: () => home_default,
	meta: () => meta
});
function meta() {
	return [{ title: "CitaPro" }];
}
var home_default = UNSAFE_withComponentProps(function Home() {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
	useEffect(() => {
		if (isLoading) return;
		if (!user) navigate("/login", { replace: true });
		else if (user.role === "client") navigate("/client", { replace: true });
		else if (user.role === "professional") navigate("/professional", { replace: true });
		else if (user.role === "admin") navigate("/admin", { replace: true });
	}, [
		user,
		isLoading,
		navigate
	]);
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-bg",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col items-center gap-3",
			children: [/* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" }), /* @__PURE__ */ jsx("span", {
				className: "text-ink-muted text-sm",
				children: "Cargando..."
			})]
		})
	});
});
//#endregion
//#region app/routes/login.tsx
var login_exports = /* @__PURE__ */ __exportAll({ default: () => login_default });
var login_default = UNSAFE_withComponentProps(function Login() {
	const [role, setRole] = useState("professional");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const data = await api.post("/login", {
				email,
				password,
				role
			});
			login(data.token, data.user);
			if (data.user.role === "professional") navigate("/professional");
			else if (data.user.role === "admin") navigate("/admin");
			else navigate("/client");
		} catch (err) {
			setError(err.message ?? "Credenciales incorrectas");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen flex",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hidden lg:flex lg:w-1/2 bg-ink flex-col justify-between p-12 relative overflow-hidden",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "absolute top-12 right-12 w-48 h-48 bg-accent opacity-90 rotate-12",
					style: { borderRadius: "2px" }
				}),
				/* @__PURE__ */ jsx("div", {
					className: "relative z-10",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 bg-surface flex items-center justify-center",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-ink font-bold text-xs",
								children: "+"
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "font-display text-white text-xl",
							children: "Cita.Pro"
						})]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative z-10",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold text-accent tracking-widest uppercase mb-4 block",
							children: "Para profesionales independientes"
						}),
						/* @__PURE__ */ jsxs("h1", {
							className: "font-display text-white text-5xl leading-tight mb-4",
							children: [
								"Sesiones,",
								/* @__PURE__ */ jsx("br", {}),
								"paquetes,",
								/* @__PURE__ */ jsx("br", {}),
								"cobros.",
								" ",
								/* @__PURE__ */ jsx("span", {
									className: "text-accent",
									children: "Listo."
								})
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-white/60 text-base leading-relaxed max-w-sm",
							children: "Una plataforma para servicios profesionales — agenda, modalidades híbridas y pagos en una sola interfaz."
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative z-10 flex items-center gap-4 text-white/40 text-sm",
					children: [
						/* @__PURE__ */ jsx("span", { children: "+ 12.000 profesionales" }),
						/* @__PURE__ */ jsx("span", { children: "·" }),
						/* @__PURE__ */ jsx("span", { children: "4.9 ★ en App Store" })
					]
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "flex-1 flex items-center justify-center bg-bg px-6 py-12",
			children: /* @__PURE__ */ jsxs("div", {
				className: "w-full max-w-md",
				children: [
					/* @__PURE__ */ jsxs("p", {
						className: "text-sm text-ink-muted mb-1",
						children: [
							"¿Es tu primera vez?",
							" ",
							/* @__PURE__ */ jsx(Link, {
								to: "/register",
								className: "text-ink underline font-semibold",
								children: "Crear cuenta"
							})
						]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "font-display text-4xl text-ink mb-1",
						children: "Iniciar sesión"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-ink-muted mb-8",
						children: "Accedé a tu agenda y tus clientes."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex rounded border border-border bg-surface mb-6",
						children: ["professional", "client"].map((r) => /* @__PURE__ */ jsx("button", {
							onClick: () => setRole(r),
							className: `flex-1 py-2.5 text-sm font-semibold transition-all ${role === r ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`,
							children: r === "professional" ? "Soy profesional" : "Soy cliente"
						}, r))
					}),
					/* @__PURE__ */ jsxs("form", {
						onSubmit: handleSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-semibold text-ink mb-1",
								children: "Email"
							}), /* @__PURE__ */ jsx("input", {
								type: "email",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								placeholder: "maria.ortiz@cita.pro",
								className: "w-full px-4 py-3 border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink rounded"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between mb-1",
								children: [/* @__PURE__ */ jsx("label", {
									className: "text-sm font-semibold text-ink",
									children: "Contraseña"
								}), /* @__PURE__ */ jsx("a", {
									href: "#",
									className: "text-sm text-ink-muted underline",
									children: "¿Olvidaste tu contraseña?"
								})]
							}), /* @__PURE__ */ jsx("input", {
								type: "password",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: "••••••••••",
								className: "w-full px-4 py-3 border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-ink rounded"
							})] }),
							/* @__PURE__ */ jsxs("label", {
								className: "flex items-center gap-2 cursor-pointer",
								children: [/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									checked: remember,
									onChange: (e) => setRemember(e.target.checked),
									className: "w-4 h-4 accent-ink"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-sm text-ink",
									children: "Mantener sesión iniciada"
								})]
							}),
							error && /* @__PURE__ */ jsx("p", {
								className: "text-sm text-red-600 bg-red-50 px-3 py-2 rounded",
								children: error
							}),
							/* @__PURE__ */ jsx("button", {
								type: "submit",
								disabled: loading,
								className: "w-full bg-ink hover:bg-primary text-white font-semibold py-3 rounded transition-colors disabled:opacity-60",
								children: loading ? "Iniciando..." : "Iniciar sesión →"
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "my-6 flex items-center gap-3",
						children: [
							/* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-border" }),
							/* @__PURE__ */ jsx("span", {
								className: "text-xs text-ink-muted uppercase tracking-widest",
								children: "O CONTINUÁ CON"
							}),
							/* @__PURE__ */ jsx("div", { className: "flex-1 border-t border-border" })
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex gap-3 mb-6",
						children: /* @__PURE__ */ jsxs("button", {
							onClick: () => {
								window.location.href = `${APP_BASE_URL}/auth/google/redirect?role=${role}`;
							},
							className: "flex-1 flex items-center justify-center gap-2 border border-border rounded py-3 bg-surface hover:bg-bg transition-colors text-sm font-semibold text-ink",
							children: [/* @__PURE__ */ jsx(GoogleIcon, {}), " Google"]
						})
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-ink-muted text-center mt-6",
						children: [
							"Al continuar aceptás los",
							" ",
							/* @__PURE__ */ jsx("a", {
								href: "#",
								className: "underline",
								children: "Términos"
							}),
							" y la",
							" ",
							/* @__PURE__ */ jsx("a", {
								href: "#",
								className: "underline",
								children: "Política de privacidad"
							}),
							"."
						]
					})
				]
			})
		})]
	});
});
function GoogleIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		children: [
			/* @__PURE__ */ jsx("path", {
				fill: "#4285F4",
				d: "M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#34A853",
				d: "M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#FBBC05",
				d: "M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
			}),
			/* @__PURE__ */ jsx("path", {
				fill: "#EA4335",
				d: "M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
			})
		]
	});
}
//#endregion
//#region app/routes/register.tsx
var register_exports = /* @__PURE__ */ __exportAll({ default: () => register_default });
var register_default = UNSAFE_withComponentProps(function Register() {
	const [role, setRole] = useState("client");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [password_confirmation, setPasswordConfirmation] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (password !== password_confirmation) {
			setError("Las contraseñas no coinciden.");
			return;
		}
		setLoading(true);
		try {
			const data = await api.post("/register", {
				name,
				email,
				password,
				password_confirmation,
				role
			});
			login(data.token, data.user);
			if (data.user.role === "professional") navigate("/professional");
			else navigate("/client");
		} catch (err) {
			setError(err.message ?? "Error al registrarse");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen flex",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "absolute inset-0 opacity-20",
					style: { background: "radial-gradient(ellipse at 70% 30%, #e07055 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #c8ddd2 0%, transparent 50%)" }
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative z-10 flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "w-5 h-5 rounded-full bg-accent flex items-center justify-center",
						children: /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-white" })
					}), /* @__PURE__ */ jsx("span", {
						className: "font-display italic text-white text-xl",
						children: "CitaPro"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative z-10",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "font-display italic text-white text-5xl leading-tight mb-4",
						children: "Comenzá hoy."
					}), /* @__PURE__ */ jsx("p", {
						className: "text-primary-soft text-base leading-relaxed max-w-sm",
						children: "Crea tu cuenta y empezá a gestionar tus reservas, clientes y pagos desde un solo lugar."
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "relative z-10 text-primary-soft text-sm",
					children: "+ 12.000 profesionales · 4.9 ★"
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "flex-1 flex items-center justify-center bg-bg px-6 py-12",
			children: /* @__PURE__ */ jsxs("div", {
				className: "w-full max-w-md",
				children: [
					/* @__PURE__ */ jsxs("p", {
						className: "text-sm text-ink-muted mb-1",
						children: [
							"¿Ya tenés cuenta?",
							" ",
							/* @__PURE__ */ jsx(Link, {
								to: "/login",
								className: "text-primary underline font-medium",
								children: "Iniciar sesión"
							})
						]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "font-display italic text-4xl text-ink mb-1",
						children: "Crear cuenta"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-ink-muted mb-8",
						children: "Completá tus datos para empezar."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex rounded-full border border-border bg-surface p-1 mb-6",
						children: ["professional", "client"].map((r) => /* @__PURE__ */ jsx("button", {
							onClick: () => setRole(r),
							className: `flex-1 py-2 rounded-full text-sm font-medium transition-all ${role === r ? "bg-ink text-white shadow" : "text-ink-muted hover:text-ink"}`,
							children: r === "professional" ? "Soy profesional" : "Soy cliente"
						}, r))
					}),
					/* @__PURE__ */ jsxs("form", {
						onSubmit: handleSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium text-ink mb-1",
								children: "Nombre completo"
							}), /* @__PURE__ */ jsx("input", {
								type: "text",
								value: name,
								onChange: (e) => setName(e.target.value),
								required: true,
								placeholder: "Tu nombre",
								className: "w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium text-ink mb-1",
								children: "Email"
							}), /* @__PURE__ */ jsx("input", {
								type: "email",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								required: true,
								placeholder: "tu@email.com",
								className: "w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium text-ink mb-1",
								children: "Contraseña"
							}), /* @__PURE__ */ jsx("input", {
								type: "password",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								required: true,
								placeholder: "••••••••••",
								className: "w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium text-ink mb-1",
								children: "Confirmar contraseña"
							}), /* @__PURE__ */ jsx("input", {
								type: "password",
								value: password_confirmation,
								onChange: (e) => setPasswordConfirmation(e.target.value),
								required: true,
								placeholder: "••••••••••",
								className: "w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary"
							})] }),
							error && /* @__PURE__ */ jsx("p", {
								className: "text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2",
								children: error
							}),
							/* @__PURE__ */ jsx("button", {
								type: "submit",
								disabled: loading,
								className: "w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60",
								children: loading ? "Creando cuenta..." : "Crear cuenta →"
							})
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-ink-muted text-center mt-6",
						children: [
							"Al continuar aceptás los",
							" ",
							/* @__PURE__ */ jsx("a", {
								href: "#",
								className: "underline",
								children: "Términos"
							}),
							" y la",
							" ",
							/* @__PURE__ */ jsx("a", {
								href: "#",
								className: "underline",
								children: "Política de privacidad"
							}),
							"."
						]
					})
				]
			})
		})]
	});
});
//#endregion
//#region app/routes/auth.google.callback.tsx
var auth_google_callback_exports = /* @__PURE__ */ __exportAll({ default: () => auth_google_callback_default });
var auth_google_callback_default = UNSAFE_withComponentProps(function GoogleCallback() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [modal, setModal] = useState({
		open: false,
		message: ""
	});
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const error = params.get("error");
		if (error) {
			setModal({
				open: true,
				message: error
			});
			return;
		}
		const token = params.get("token");
		const user = {
			id: Number(params.get("id")),
			name: params.get("name") || "",
			email: params.get("email") || "",
			role: params.get("role"),
			initials: (params.get("name") || "").split(" ").map((n) => n[0]).join("").toUpperCase()
		};
		if (token) {
			login(token, user);
			if (user.role === "professional") navigate("/professional");
			else if (user.role === "admin") navigate("/admin");
			else navigate("/client");
		}
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center justify-center min-h-screen",
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-ink-muted",
			children: "Iniciando sesión..."
		}), modal.open && /* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
			children: /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-lg shadow-lg p-6 w-[320px] text-center",
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-bold mb-2 text-red-600",
						children: "Acceso denegado"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm text-ink mb-4",
						children: modal.message
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: () => navigate("/login"),
						className: "bg-ink text-white px-4 py-2 rounded",
						children: "Volver al login"
					})
				]
			})
		})]
	});
});
//#endregion
//#region app/lib/echo.ts
var echo = null;
function getEcho(token) {
	if (typeof window === "undefined") return null;
	if (!echo) {
		window.Pusher = Pusher;
		echo = new Echo({
			broadcaster: "reverb",
			key: "cgux9icc65a7v6i6ia0v",
			wsHost: "127.0.0.1",
			wsPort: 8080,
			wssPort: 8080,
			forceTLS: false,
			enabledTransports: ["ws", "wss"],
			authEndpoint: `${APP_BASE_URL}/broadcasting/auth`,
			auth: { headers: {
				Authorization: token ? `Bearer ${token}` : "",
				Accept: "application/json"
			} },
			withCredentials: true
		});
	}
	return echo;
}
//#endregion
//#region app/context/NotificationContext.tsx
var NotificationContext = createContext(null);
function NotificationProvider({ children, userId }) {
	const { token } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const loadNotifications = async () => {
		try {
			const res = await api.get("/notificaciones", token);
			if (res?.data) setNotifications(res.data);
		} catch (err) {
			console.error("Error cargando notificaciones", err);
		}
	};
	const unreadCount = notifications.filter((n) => n.read_at === null).length;
	const markAsRead = async (id) => {
		await api.post(`/notificaciones/${id}/leer`, {}, token);
		setNotifications((prev) => prev.map((n) => n.id === id ? {
			...n,
			read_at: (/* @__PURE__ */ new Date()).toISOString()
		} : n));
	};
	const markAllAsRead = async () => {
		await api.post("/notificaciones/leer-todas", {}, token);
		setNotifications((prev) => prev.map((n) => ({
			...n,
			read_at: (/* @__PURE__ */ new Date()).toISOString()
		})));
	};
	useEffect(() => {
		if (!userId || !token) return;
		const echo = getEcho(token);
		if (!echo) return;
		const channelName = `user.${userId}`;
		echo.private(channelName).notification((notification) => {
			console.log("WS NOTIFICATION:", notification);
			setNotifications((prev) => {
				if (prev.some((n) => n.id === notification.id)) return prev;
				return [{
					id: notification.id,
					read_at: null,
					data: notification.data ?? notification
				}, ...prev];
			});
		});
		return () => {
			echo.leave(channelName);
		};
	}, [userId, token]);
	return /* @__PURE__ */ jsx(NotificationContext.Provider, {
		value: {
			notifications,
			unreadCount,
			loadNotifications,
			markAsRead,
			markAllAsRead
		},
		children
	});
}
function useGlobalNotifications() {
	const ctx = useContext(NotificationContext);
	if (!ctx) throw new Error("useGlobalNotifications debe usarse dentro del Provider");
	return ctx;
}
//#endregion
//#region app/components/ClientSidebar.tsx
var navItems$2 = [
	{
		to: "/client",
		label: "Resumen",
		icon: HomeIcon$1,
		end: true
	},
	{
		to: "/client/discover",
		label: "Descubrir",
		icon: SearchIcon
	},
	{
		to: "/client/packages",
		label: "Paquetes",
		icon: PackageIcon$2
	},
	{
		to: "/client/reservas",
		label: "Reservas",
		icon: CalendarIcon$1,
		end: true
	},
	{
		to: "/client/payments",
		label: "Pagos",
		icon: CardIcon$1
	},
	{
		to: "/client/notifications",
		label: "Notificaciones",
		icon: BellIcon$1
	}
];
function ClientSidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }) {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { unreadCount } = useGlobalNotifications();
	function getInitials(name) {
		if (!name) return "U";
		return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
	}
	const effectiveCollapsed = collapsed && !isMobileOpen;
	return /* @__PURE__ */ jsxs(Fragment, { children: [isMobileOpen && /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 bg-black/50 z-40 md:hidden",
		onClick: onMobileClose
	}), /* @__PURE__ */ jsxs("aside", {
		className: [
			"flex flex-col bg-sidebar shrink-0 transition-all duration-200 ease-in-out overflow-y-auto",
			"fixed inset-y-0 left-0 z-50",
			"w-72",
			isMobileOpen ? "translate-x-0" : "-translate-x-full",
			"md:relative md:inset-y-auto md:left-auto md:z-auto",
			"md:translate-x-0",
			collapsed ? "md:w-14" : "md:w-56",
			"md:min-h-screen"
		].join(" "),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "p-4 border-b border-white/10",
				children: [/* @__PURE__ */ jsxs("div", {
					className: `flex items-center ${effectiveCollapsed ? "justify-center" : "justify-between"}`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-ink font-bold text-xs",
								children: "+"
							})
						}), !effectiveCollapsed && /* @__PURE__ */ jsx("span", {
							className: "font-display text-sidebar-text text-lg tracking-tight",
							children: "Cita.Pro"
						})]
					}), !effectiveCollapsed && /* @__PURE__ */ jsx("button", {
						onClick: isMobileOpen ? onMobileClose : onToggle,
						title: isMobileOpen ? "Cerrar menú" : "Contraer menú",
						className: "text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors",
						children: /* @__PURE__ */ jsx(ChevronLeftIcon$2, { className: "w-4 h-4" })
					})]
				}), effectiveCollapsed && /* @__PURE__ */ jsx("div", {
					className: "flex justify-center mt-3",
					children: /* @__PURE__ */ jsx("button", {
						onClick: onToggle,
						title: "Expandir menú",
						className: "text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors",
						children: /* @__PURE__ */ jsx(ChevronRightIcon$2, { className: "w-4 h-4" })
					})
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "flex-1 p-2 space-y-0.5",
				children: navItems$2.map(({ to, label, icon: Icon, end }) => /* @__PURE__ */ jsxs(NavLink, {
					to,
					end,
					title: effectiveCollapsed ? label : void 0,
					onClick: isMobileOpen ? onMobileClose : void 0,
					className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${effectiveCollapsed ? "justify-center px-0" : ""} ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`,
					children: [
						/* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 shrink-0" }),
						!effectiveCollapsed && /* @__PURE__ */ jsx("span", {
							className: "flex-1",
							children: label
						}),
						to === "/client/notifications" && unreadCount > 0 && !effectiveCollapsed && /* @__PURE__ */ jsx("span", {
							className: "ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full",
							children: unreadCount
						})
					]
				}, to))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "p-3 border-t border-white/10",
				children: effectiveCollapsed ? /* @__PURE__ */ jsx("div", {
					className: "flex justify-center py-1",
					children: /* @__PURE__ */ jsx("button", {
						onClick: () => navigate("/client/profile"),
						title: user?.name ?? "Usuario",
						className: "w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold hover:ring-2 hover:ring-white/40 transition-all",
						children: getInitials(user?.name)
					})
				}) : /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 px-3 py-2",
					children: [
						/* @__PURE__ */ jsx("button", {
							onClick: () => {
								navigate("/client/profile");
								if (isMobileOpen) onMobileClose();
							},
							title: "Editar perfil",
							className: "w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold shrink-0 hover:ring-2 hover:ring-white/40 transition-all",
							children: getInitials(user?.name)
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-sidebar-text truncate",
								children: user?.name ?? "Usuario"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-sidebar-muted",
								children: "Cliente"
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: async () => {
								await logout();
								navigate("/login");
							},
							title: "Cerrar sesión",
							className: "text-sidebar-muted hover:text-sidebar-text transition-colors",
							children: /* @__PURE__ */ jsx(LogoutIcon$1, { className: "w-4 h-4" })
						})
					]
				})
			})
		]
	})] });
}
function HomeIcon$1({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), /* @__PURE__ */ jsx("polyline", { points: "9 22 9 12 15 12 15 22" })]
	});
}
function SearchIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("circle", {
			cx: "11",
			cy: "11",
			r: "8"
		}), /* @__PURE__ */ jsx("path", { d: "m21 21-4.35-4.35" })]
	});
}
function PackageIcon$2({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
			/* @__PURE__ */ jsx("polyline", { points: "3.29 7 12 12 20.71 7" }),
			/* @__PURE__ */ jsx("line", {
				x1: "12",
				y1: "22",
				x2: "12",
				y2: "12"
			})
		]
	});
}
function CalendarIcon$1({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "3",
				y: "4",
				width: "18",
				height: "18",
				rx: "2"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "16",
				y1: "2",
				x2: "16",
				y2: "6"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "8",
				y1: "2",
				x2: "8",
				y2: "6"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "10",
				x2: "21",
				y2: "10"
			})
		]
	});
}
function CardIcon$1({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("rect", {
			x: "1",
			y: "4",
			width: "22",
			height: "16",
			rx: "2"
		}), /* @__PURE__ */ jsx("line", {
			x1: "1",
			y1: "10",
			x2: "23",
			y2: "10"
		})]
	});
}
function BellIcon$1({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("path", { d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 1-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" })
	});
}
function LogoutIcon$1({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
			/* @__PURE__ */ jsx("polyline", { points: "16 17 21 12 16 7" }),
			/* @__PURE__ */ jsx("line", {
				x1: "21",
				y1: "12",
				x2: "9",
				y2: "12"
			})
		]
	});
}
function ChevronLeftIcon$2({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("polyline", { points: "15 18 9 12 15 6" })
	});
}
function ChevronRightIcon$2({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("polyline", { points: "9 18 15 12 9 6" })
	});
}
//#endregion
//#region app/routes/client/_layout.tsx
var _layout_exports$2 = /* @__PURE__ */ __exportAll({ default: () => _layout_default$2 });
var _layout_default$2 = UNSAFE_withComponentProps(function ClientLayout() {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	useEffect(() => {
		if (!isLoading && !user) navigate("/login", { replace: true });
		if (!isLoading && user && user.role === "professional") navigate("/professional", { replace: true });
	}, [
		user,
		isLoading,
		navigate
	]);
	if (isLoading) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-bg",
		children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" })
	});
	return /* @__PURE__ */ jsx(NotificationProvider, {
		userId: user?.id,
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex min-h-screen bg-bg",
			children: [/* @__PURE__ */ jsx(ClientSidebar, {
				collapsed: sidebarCollapsed,
				onToggle: () => setSidebarCollapsed((v) => !v),
				isMobileOpen: mobileOpen,
				onMobileClose: () => setMobileOpen(false)
			}), /* @__PURE__ */ jsxs("main", {
				className: "flex-1 overflow-auto min-w-0",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "sticky top-0 z-30 flex md:hidden items-center justify-between bg-sidebar px-4 py-3 border-b border-white/10",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-ink font-bold text-xs",
								children: "+"
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "font-display text-sidebar-text text-lg tracking-tight",
							children: "Cita.Pro"
						})]
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setMobileOpen(true),
						className: "text-sidebar-text p-1.5 rounded-lg hover:bg-white/10 transition-colors",
						"aria-label": "Abrir menú",
						children: /* @__PURE__ */ jsx(MenuIcon$1, { className: "w-5 h-5" })
					})]
				}), /* @__PURE__ */ jsx(Outlet, {})]
			})]
		})
	});
});
function MenuIcon$1({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "6",
				x2: "21",
				y2: "6"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "12",
				x2: "21",
				y2: "12"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "18",
				x2: "21",
				y2: "18"
			})
		]
	});
}
//#endregion
//#region app/routes/client/dashboard.tsx
var dashboard_exports$2 = /* @__PURE__ */ __exportAll({ default: () => dashboard_default$2 });
var dashboard_default$2 = UNSAFE_withComponentProps(function ClientDashboard() {
	const { token, user } = useAuth();
	const [bookings, setBookings] = useState([]);
	const [packages, setPackages] = useState([]);
	const now = /* @__PURE__ */ new Date();
	const load = async () => {
		if (!token) return;
		const [reservasRes, paquetesRes] = await Promise.all([api.get("/mis-reservas", token), api.get("/mis-compras-paquetes", token)]);
		setBookings(reservasRes.data);
		setPackages(paquetesRes);
	};
	useEffect(() => {
		load();
	}, [token]);
	useEffect(() => {
		const handler = () => {
			console.log("CLIENT DASHBOARD REFRESH");
			load();
		};
		window.addEventListener("reserva-updated", handler);
		return () => window.removeEventListener("reserva-updated", handler);
	}, [token]);
	const upcomingBookings = bookings.filter((b) => {
		const date = /* @__PURE__ */ new Date(`${b.fecha}T${b.hora}`);
		const cancelled = b.estado === "cancelada" || b.estado === "no_asistida";
		return date >= now && !cancelled;
	}).sort((a, b) => {
		const dateA = /* @__PURE__ */ new Date(`${a.fecha}T${a.hora}`);
		const dateB = /* @__PURE__ */ new Date(`${b.fecha}T${b.hora}`);
		return dateA.getTime() - dateB.getTime();
	});
	const upcomingCount = upcomingBookings.length;
	const todaySession = useMemo(() => {
		const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		return bookings.filter((b) => {
			return b.fecha === todayStr && b.modalidad === "virtual" && b.estado !== "cancelada";
		}).sort((a, b) => a.hora.localeCompare(b.hora))[0];
	}, [bookings]);
	const paqueteDestacado = packages.find((p) => p.pago?.estado === "aprobado") ?? packages.find((p) => p.pago?.estado === "pendiente") ?? null;
	const totalSesiones = paqueteDestacado ? paqueteDestacado.items.reduce((sum, item) => sum + item.item_paquete.cantidad_sesiones, 0) : 0;
	const sesionesRestantes = paqueteDestacado ? paqueteDestacado.items.reduce((sum, item) => sum + item.sesiones_restantes, 0) : 0;
	const porcentaje = totalSesiones > 0 ? sesionesRestantes / totalSesiones * 100 : 0;
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h1", {
					className: "font-display italic text-3xl text-ink",
					children: ["Hola, ", user?.name]
				}), /* @__PURE__ */ jsxs("p", {
					className: "text-ink-muted mt-1",
					children: [
						"Tenés ",
						upcomingCount,
						" reserva",
						upcomingCount !== 1 ? "s" : "",
						" próximas"
					]
				})] }), /* @__PURE__ */ jsx(Link, {
					to: "/client/discover",
					className: "self-start sm:self-auto flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors",
					children: "+ Nueva reserva"
				})]
			}),
			todaySession && /* @__PURE__ */ jsx("div", {
				className: "bg-primary-soft rounded-2xl p-6 mb-8 flex items-start justify-between",
				children: /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2",
						children: [
							/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-accent inline-block" }),
							"Hoy · ",
							todaySession.hora.slice(0, 5)
						]
					}),
					/* @__PURE__ */ jsxs("h2", {
						className: "font-display italic text-2xl text-ink mb-2",
						children: ["Sesión con ", todaySession.servicio.profesional_nombre]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-4 text-sm text-ink-muted",
						children: [/* @__PURE__ */ jsx("span", { children: todaySession.hora.slice(0, 5) }), /* @__PURE__ */ jsx("span", { children: "Virtual" })]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex gap-3 mt-4",
						children: todaySession.estado_videollamada === "en_curso" && /* @__PURE__ */ jsx(Link, {
							to: `/videollamada/${todaySession.reserva_id}`,
							className: "flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors",
							children: "Entrar a la sesión"
						})
					})
				] })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between mb-4",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-display italic text-xl text-ink",
							children: "Próximas reservas"
						}), /* @__PURE__ */ jsx("div", { className: "flex gap-1" })]
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-3",
						children: upcomingBookings.map((b) => /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl p-4 flex items-center gap-4",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "text-center min-w-10",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted uppercase font-medium",
										children: b.fecha
									}), /* @__PURE__ */ jsx("p", {
										className: "font-display italic text-lg text-ink",
										children: b.hora.slice(0, 5)
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "w-9 h-9 rounded-full flex items-center justify-center bg-primary text-white text-xs font-semibold shrink-0",
									children: b.servicio.profesional_nombre[0]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-0.5",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-sm font-medium text-ink",
											children: b.servicio.profesional_nombre
										}), /* @__PURE__ */ jsx("span", {
											className: "badge",
											children: b.estado
										})]
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted truncate",
										children: b.modalidad
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [b.modalidad === "virtual" && b.estado_videollamada === "en_curso" && /* @__PURE__ */ jsx(Link, {
										to: `/videollamada/${b.reserva_id}`,
										className: "text-sm bg-accent text-white px-3 py-1.5 rounded-lg",
										children: "Entrar"
									}), /* @__PURE__ */ jsx("button", {
										className: "text-ink-muted hover:text-ink",
										children: /* @__PURE__ */ jsx(DotsIcon, {})
									})]
								})
							]
						}, b.reserva_id))
					})]
				}), /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between mb-4",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-display italic text-xl text-ink",
							children: "Paquetes"
						}), /* @__PURE__ */ jsx(Link, {
							to: "/client/packages",
							className: "text-sm text-primary underline",
							children: "Ver todos"
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded-2xl p-4",
						children: paqueteDestacado ? /* @__PURE__ */ jsxs(Fragment, { children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-1.5 text-xs text-primary font-medium mb-2",
								children: [/* @__PURE__ */ jsx(PackageIcon$1, {}), paqueteDestacado.pago?.estado === "aprobado" ? "Activo" : "Pendiente"]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "font-display italic text-lg text-ink mb-3",
								children: paqueteDestacado.paquete.nombre
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-ink-muted text-sm mb-2",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-3xl font-bold text-ink",
										children: sesionesRestantes
									}),
									" ",
									"de ",
									totalSesiones,
									" sesiones restantes"
								]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "h-1.5 bg-border rounded-full mb-3",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full bg-primary rounded-full",
									style: { width: `${porcentaje}%` }
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between text-xs text-ink-muted",
								children: [/* @__PURE__ */ jsxs("span", { children: ["Compra #", paqueteDestacado.compra_paquete_id] }), /* @__PURE__ */ jsxs("span", { children: ["$", paqueteDestacado.paquete.precio_total] })]
							})
						] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5 text-xs text-ink-muted font-medium mb-2",
							children: [/* @__PURE__ */ jsx(PackageIcon$1, {}), "Sin paquetes"]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Todavía no tienes paquetes comprados."
						})] })
					}),
					/* @__PURE__ */ jsxs(Link, {
						to: "/client/discover?tab=packages",
						className: "flex items-center gap-3 bg-surface border border-dashed border-border rounded-2xl p-4 hover:bg-bg transition-colors",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-7 h-7 rounded-full border border-border flex items-center justify-center text-ink-muted text-lg",
							children: "+"
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-medium text-ink",
							children: "Comprar paquete"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted",
							children: "Hasta 20% off en sesiones múltiples"
						})] })]
					})
				] })]
			})
		]
	});
});
function DotsIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		children: [
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "5",
				r: "1"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "19",
				r: "1"
			})
		]
	});
}
function PackageIcon$1() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "12",
		height: "12",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
			/* @__PURE__ */ jsx("polyline", { points: "3.29 7 12 12 20.71 7" }),
			/* @__PURE__ */ jsx("line", {
				x1: "12",
				y1: "22",
				x2: "12",
				y2: "12"
			})
		]
	});
}
//#endregion
//#region app/routes/client/discover.tsx
var discover_exports = /* @__PURE__ */ __exportAll({ default: () => discover_default });
var CARD_COLORS = [
	{
		bg: "from-orange-200 to-rose-200",
		avatar: "bg-violet-400"
	},
	{
		bg: "from-orange-100 to-amber-100",
		avatar: "bg-orange-400"
	},
	{
		bg: "from-teal-100 to-green-100",
		avatar: "bg-teal-500"
	},
	{
		bg: "from-purple-100 to-violet-100",
		avatar: "bg-purple-500"
	},
	{
		bg: "from-pink-100 to-rose-100",
		avatar: "bg-pink-500"
	},
	{
		bg: "from-sky-100 to-blue-100",
		avatar: "bg-blue-500"
	}
];
var MODALITIES = [
	"Todas",
	"Presencial",
	"Virtual",
	"Híbrida"
];
function getCardColors(id) {
	return CARD_COLORS[id % CARD_COLORS.length];
}
function getInitials$5(text) {
	return text.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function normalizeModality$1(m) {
	return {
		presencial: "Presencial",
		virtual: "Virtual",
		hibrido: "Híbrida",
		híbrido: "Híbrida"
	}[m.toLowerCase()] ?? m;
}
var discover_default = UNSAFE_withComponentProps(function Discover() {
	const navigate = useNavigate();
	const { token } = useAuth();
	const [servicios, setServicios] = useState([]);
	const [paquetes, setPaquetes] = useState([]);
	const [loadingSvc, setLoadingSvc] = useState(true);
	const [loadingPkg, setLoadingPkg] = useState(true);
	const [error, setError] = useState(null);
	const [errorPkg, setErrorPkg] = useState(null);
	const [selectedTypes, setSelectedTypes] = useState([]);
	const [selectedModality, setSelectedModality] = useState("Todas");
	const [maxPrice, setMaxPrice] = useState(1e3);
	const [priceRange, setPriceRange] = useState(1e3);
	const [buyingPackageId, setBuyingPackageId] = useState(null);
	const [searchParams] = useSearchParams();
	useEffect(() => {
		api.get("/servicios").then((res) => {
			if (res.success) {
				setServicios(res.data);
				setSelectedTypes([...new Set(res.data.map((s) => s.tipo))]);
				const max = Math.max(...res.data.map((s) => Number(s.precio)), 100);
				const rounded = Math.ceil(max / 100) * 100;
				setMaxPrice(rounded);
				setPriceRange(rounded);
			}
		}).catch((e) => setError(e.message)).finally(() => setLoadingSvc(false));
		api.get("/paquetes", token).then((res) => {
			setPaquetes(Array.isArray(res) ? res : res.data ?? []);
		}).catch((e) => setErrorPkg(e.message ?? "Error al cargar paquetes")).finally(() => setLoadingPkg(false));
		return () => {};
	}, [token]);
	const activeTab = searchParams.get("tab") === "packages" ? "paquetes" : "servicios";
	searchParams.get("servicio");
	searchParams.get("compraItem");
	const serviceTypes = [...new Set(servicios.map((s) => s.tipo))].map((tipo) => ({
		label: tipo,
		count: servicios.filter((s) => s.tipo === tipo).length,
		key: tipo
	}));
	const toggleType = (key) => setSelectedTypes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
	const filteredSvc = servicios.filter((s) => {
		const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(s.tipo);
		const modalityMatch = selectedModality === "Todas" || normalizeModality$1(s.modalidad) === selectedModality;
		const priceMatch = Number(s.precio) <= priceRange;
		return typeMatch && modalityMatch && priceMatch;
	});
	const filteredPkg = paquetes.filter((p) => Number(p.precio_total) <= priceRange);
	const resetFilters = () => {
		setSelectedTypes([]);
		setSelectedModality("Todas");
		setPriceRange(maxPrice);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen overflow-hidden",
		children: [/* @__PURE__ */ jsxs("aside", {
			className: "w-64 bg-surface border-r border-border shrink-0 flex flex-col overflow-y-auto",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between p-5 pb-4",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "text-sm font-semibold text-ink uppercase tracking-wide",
					children: "Filtros"
				}), /* @__PURE__ */ jsx("button", {
					className: "text-xs text-primary underline cursor-pointer",
					onClick: resetFilters,
					children: "Limpiar"
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "px-5 pb-5 space-y-5 flex-1",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Tipo de servicio"
					}), loadingSvc ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-ink-muted",
						children: "Cargando..."
					}) : serviceTypes.length === 0 ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-ink-muted",
						children: "Sin tipos disponibles"
					}) : /* @__PURE__ */ jsx("div", {
						className: "space-y-2",
						children: serviceTypes.map(({ label, count, key }) => /* @__PURE__ */ jsxs("label", {
							className: "flex items-center gap-2 cursor-pointer",
							children: [
								/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									checked: selectedTypes.includes(key),
									onChange: () => toggleType(key),
									className: "w-4 h-4 rounded accent-primary"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-sm text-ink flex-1",
									children: label
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-xs text-ink-muted",
									children: count
								})
							]
						}, key))
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Modalidad"
					}), /* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap gap-1.5",
						children: MODALITIES.map((m) => /* @__PURE__ */ jsx("button", {
							onClick: () => setSelectedModality(m),
							className: `text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${selectedModality === m ? "bg-ink text-white border-ink" : "border-border text-ink-muted hover:border-ink hover:text-ink"}`,
							children: m
						}, m))
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
							children: activeTab === "paquetes" ? "Precio del paquete" : "Precio por sesión"
						}),
						/* @__PURE__ */ jsx("input", {
							type: "range",
							min: 0,
							max: maxPrice,
							value: priceRange,
							onChange: (e) => setPriceRange(Number(e.target.value)),
							className: "w-full accent-primary"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between text-xs text-ink-muted mt-1",
							children: [/* @__PURE__ */ jsx("span", { children: "$ 0" }), /* @__PURE__ */ jsxs("span", { children: ["$ ", priceRange] })]
						})
					] }),
					activeTab === "servicios" && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Ubicación"
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-bg",
						children: [/* @__PURE__ */ jsx("ion-icon", {
							name: "location-outline",
							style: {
								fontSize: "16px",
								color: "var(--color-ink-muted)"
							}
						}), /* @__PURE__ */ jsx("input", {
							className: "flex-1 bg-transparent text-sm text-ink placeholder-ink-muted outline-none",
							placeholder: "Ciudad o zona..."
						})]
					})] })
				]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 overflow-y-auto p-6",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "flex items-start justify-between mb-5",
					children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
						className: "font-display italic text-3xl text-ink mb-1",
						children: activeTab === "servicios" ? "Encontrá a tu profesional" : "Paquetes"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-ink-muted text-sm",
						children: activeTab === "servicios" ? loadingSvc ? "Cargando servicios..." : `${filteredSvc.length} servicio${filteredSvc.length !== 1 ? "s" : ""} disponible${filteredSvc.length !== 1 ? "s" : ""}` : loadingPkg ? "Cargando paquetes..." : `${filteredPkg.length} paquete${filteredPkg.length !== 1 ? "s" : ""} disponible${filteredPkg.length !== 1 ? "s" : ""}`
					})] })
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex gap-1 border-b border-border mb-6",
					children: ["servicios", "paquetes"].map((tab) => /* @__PURE__ */ jsx("button", {
						onClick: () => navigate(`/client/discover?tab=${tab === "paquetes" ? "packages" : "services"}`),
						className: `px-5 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`,
						children: tab.charAt(0).toUpperCase() + tab.slice(1)
					}, tab))
				}),
				activeTab === "servicios" && /* @__PURE__ */ jsxs(Fragment, { children: [
					selectedTypes.length > 0 && /* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-3 mb-6 flex-wrap",
						children: selectedTypes.map((t) => /* @__PURE__ */ jsxs("span", {
							className: "flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium",
							children: [/* @__PURE__ */ jsx("ion-icon", {
								name: "checkmark-outline",
								style: { fontSize: "12px" }
							}), t]
						}, t))
					}),
					error && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center justify-center py-16 text-center gap-2",
						children: [
							/* @__PURE__ */ jsx("ion-icon", {
								name: "cloud-offline-outline",
								style: {
									fontSize: "40px",
									color: "var(--color-ink-muted)"
								}
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-ink font-medium",
								children: "No se pudieron cargar los servicios"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-sm text-ink-muted",
								children: "Problema de conexión con el servidor. Intentá de nuevo."
							}),
							/* @__PURE__ */ jsx("button", {
								onClick: () => window.location.reload(),
								className: "text-sm text-primary hover:underline cursor-pointer",
								children: "Reintentar"
							})
						]
					}),
					loadingSvc && /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
						children: [
							1,
							2,
							3,
							4,
							5,
							6
						].map((i) => /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl overflow-hidden animate-pulse",
							children: [/* @__PURE__ */ jsx("div", { className: "h-28 bg-border/50" }), /* @__PURE__ */ jsxs("div", {
								className: "p-4 space-y-3",
								children: [/* @__PURE__ */ jsx("div", { className: "h-4 bg-border/50 rounded w-2/3" }), /* @__PURE__ */ jsx("div", { className: "h-3 bg-border/50 rounded w-1/2" })]
							})]
						}, i))
					}),
					!loadingSvc && !error && filteredSvc.length === 0 && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center justify-center py-16 text-center",
						children: [/* @__PURE__ */ jsx("ion-icon", {
							name: "search-outline",
							style: {
								fontSize: "40px",
								color: "var(--color-ink-muted)",
								marginBottom: "8px"
							}
						}), /* @__PURE__ */ jsx("p", {
							className: "text-ink-muted",
							children: "No hay servicios que coincidan con los filtros."
						})]
					}),
					!loadingSvc && !error && filteredSvc.length > 0 && /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
						children: filteredSvc.map((servicio) => {
							const colors = getCardColors(servicio.servicio_id);
							const initials = getInitials$5(servicio.nombre);
							const modalityLabel = normalizeModality$1(servicio.modalidad);
							return /* @__PURE__ */ jsxs("div", {
								onClick: () => navigate(`/client/professional/${servicio.profesional_id}`),
								className: "bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
								children: [/* @__PURE__ */ jsx("div", {
									className: `h-28 bg-gradient-to-br ${colors.bg} relative`,
									children: /* @__PURE__ */ jsx("button", {
										onClick: (e) => e.stopPropagation(),
										className: "absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink-muted hover:text-accent transition-colors cursor-pointer",
										children: /* @__PURE__ */ jsx("ion-icon", {
											name: "heart-outline",
											style: { fontSize: "16px" }
										})
									})
								}), /* @__PURE__ */ jsxs("div", {
									className: "p-4",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-start gap-3 mb-3 relative",
											children: [/* @__PURE__ */ jsx("div", {
												className: `w-9 h-9 rounded-full ${colors.avatar} flex items-center justify-center text-white text-xs font-semibold border-2 border-white`,
												children: initials
											}), /* @__PURE__ */ jsxs("div", {
												className: "min-w-0",
												children: [
													/* @__PURE__ */ jsx("p", {
														className: "text-sm font-semibold text-ink",
														children: servicio.nombre
													}),
													/* @__PURE__ */ jsx("p", {
														className: "text-xs text-ink-muted",
														children: servicio.tipo
													}),
													servicio.cantidad_calificaciones ? /* @__PURE__ */ jsxs("p", {
														className: "text-xs text-ink-muted mt-1",
														children: [
															"⭐ ",
															servicio.promedio?.toFixed(1),
															" (",
															servicio.cantidad_calificaciones,
															")"
														]
													}) : /* @__PURE__ */ jsx("p", {
														className: "text-xs text-ink-muted mt-1",
														children: "Sin reseñas"
													})
												]
											})]
										}),
										servicio.descripcion && /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted mb-3 line-clamp-2",
											children: servicio.descripcion
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex flex-wrap gap-1.5 mb-3",
											children: [/* @__PURE__ */ jsxs("span", {
												className: `flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${modalityLabel === "Virtual" ? "border-primary/30 text-primary bg-primary-soft/40" : "border-border text-ink-muted bg-bg"}`,
												children: [/* @__PURE__ */ jsx("ion-icon", {
													name: modalityLabel === "Virtual" ? "desktop-outline" : "location-outline",
													style: { fontSize: "12px" }
												}), modalityLabel]
											}), /* @__PURE__ */ jsxs("span", {
												className: "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-ink-muted bg-bg",
												children: [
													/* @__PURE__ */ jsx("ion-icon", {
														name: "time-outline",
														style: { fontSize: "12px" }
													}),
													servicio.duracion,
													" min"
												]
											})]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-end justify-between",
											children: [servicio.profesional?.ubicacion ? /* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ jsx("ion-icon", {
													name: "location-outline",
													style: {
														fontSize: "13px",
														color: "var(--color-ink-muted)"
													}
												}), /* @__PURE__ */ jsx("p", {
													className: "text-sm font-medium text-ink",
													children: servicio.profesional.ubicacion
												})]
											}) : /* @__PURE__ */ jsx("div", {}), /* @__PURE__ */ jsxs("div", {
												className: "text-right",
												children: [/* @__PURE__ */ jsx("p", {
													className: "text-xs text-ink-muted",
													children: "desde"
												}), /* @__PURE__ */ jsxs("p", {
													className: "text-lg font-bold text-ink",
													children: ["$ ", Number(servicio.precio).toFixed(0)]
												})]
											})]
										})
									]
								})]
							}, servicio.servicio_id);
						})
					})
				] }),
				activeTab === "paquetes" && /* @__PURE__ */ jsxs(Fragment, { children: [
					errorPkg && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center justify-center py-16 text-center gap-2",
						children: [
							/* @__PURE__ */ jsx("ion-icon", {
								name: "cloud-offline-outline",
								style: {
									fontSize: "40px",
									color: "var(--color-ink-muted)"
								}
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-ink font-medium",
								children: "No se pudieron cargar los paquetes"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-sm text-ink-muted",
								children: "Problema de conexión con el servidor. Intentá de nuevo."
							}),
							/* @__PURE__ */ jsx("button", {
								onClick: () => window.location.reload(),
								className: "text-sm text-primary hover:underline cursor-pointer",
								children: "Reintentar"
							})
						]
					}),
					loadingPkg && /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
						children: [
							1,
							2,
							3
						].map((i) => /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl overflow-hidden animate-pulse",
							children: [/* @__PURE__ */ jsx("div", { className: "h-6 bg-border/50 rounded m-5 w-1/2" }), /* @__PURE__ */ jsxs("div", {
								className: "px-5 pb-5 space-y-3",
								children: [
									/* @__PURE__ */ jsx("div", { className: "h-3 bg-border/50 rounded w-3/4" }),
									/* @__PURE__ */ jsx("div", { className: "h-8 bg-border/50 rounded w-1/3" }),
									/* @__PURE__ */ jsx("div", { className: "h-10 bg-border/50 rounded" })
								]
							})]
						}, i))
					}),
					!loadingPkg && !errorPkg && filteredPkg.length === 0 && /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center justify-center py-16 text-center",
						children: [/* @__PURE__ */ jsx("ion-icon", {
							name: "cube-outline",
							style: {
								fontSize: "40px",
								color: "var(--color-ink-muted)",
								marginBottom: "8px"
							}
						}), /* @__PURE__ */ jsx("p", {
							className: "text-ink-muted",
							children: "No hay paquetes disponibles."
						})]
					}),
					!loadingPkg && !errorPkg && filteredPkg.length > 0 && /* @__PURE__ */ jsx("div", {
						className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6",
						children: filteredPkg.map((paquete) => /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-xl overflow-hidden shadow-sm",
							children: [/* @__PURE__ */ jsx("div", { className: "h-32 bg-gradient-to-r from-orange-200 to-pink-200" }), /* @__PURE__ */ jsxs("div", {
								className: "p-5",
								children: [
									/* @__PURE__ */ jsx("h3", {
										className: "font-display text-xl text-ink mb-2",
										children: paquete.nombre
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-sm text-ink-muted line-clamp-3",
										children: paquete.descripcion
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "mt-4 flex items-center justify-between",
										children: [/* @__PURE__ */ jsxs("span", {
											className: "font-bold text-2xl",
											children: ["$", paquete.precio_total]
										}), /* @__PURE__ */ jsx("button", {
											disabled: buyingPackageId === paquete.paquete_id,
											className: "\r\n                            bg-ink text-white px-4 py-2 rounded-lg\r\n                            hover:bg-primary\r\n                            transition-colors\r\n                            disabled:opacity-70\r\n                            disabled:cursor-not-allowed\r\n                          ",
											onClick: async () => {
												try {
													setBuyingPackageId(paquete.paquete_id);
													navigate(`/client/package/${paquete.paquete_id}/pay`);
												} catch (error) {
													console.error(error);
												} finally {
													setBuyingPackageId(null);
												}
											},
											children: buyingPackageId === paquete.paquete_id ? "Procesando..." : "Comprar"
										})]
									})
								]
							})]
						}, paquete.paquete_id))
					})
				] })
			]
		})]
	});
});
//#endregion
//#region app/routes/client/professional.$id.tsx
var professional_$id_exports = /* @__PURE__ */ __exportAll({ default: () => professional_$id_default });
function getInitials$4(name) {
	return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function normalizeModality(m) {
	return {
		presencial: "Presencial",
		virtual: "Virtual",
		hibrida: "Híbrida",
		híbrida: "Híbrida"
	}[m.toLowerCase()] ?? m;
}
var DOW_MAP = [
	"domingo",
	"lunes",
	"martes",
	"miercoles",
	"jueves",
	"viernes",
	"sabado"
];
function toDateStr$1(year, month, day) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
var MONTH_NAMES$2 = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre"
];
var DAY_NAMES = [
	"Lun",
	"Mar",
	"Mié",
	"Jue",
	"Vie",
	"Sáb",
	"Dom"
];
var TABS = [
	"Acerca de",
	"Servicios",
	"Reseñas"
];
function MiniCalendar({ year, month, availableDays, selectedDate, onSelect, onPrev, onNext }) {
	const today = useMemo(() => {
		const d = /* @__PURE__ */ new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);
	const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
	while (cells.length % 7 !== 0) cells.push(null);
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between mb-3",
			children: [
				/* @__PURE__ */ jsx("button", {
					onClick: onPrev,
					className: "w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm",
					children: "‹"
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "text-sm font-semibold text-ink",
					children: [
						MONTH_NAMES$2[month],
						" ",
						year
					]
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: onNext,
					className: "w-7 h-7 rounded-lg border border-border flex items-center justify-center text-ink-muted hover:bg-bg text-sm",
					children: "›"
				})
			]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "grid grid-cols-7 gap-0.5 mb-1",
			children: DAY_NAMES.map((d) => /* @__PURE__ */ jsx("div", {
				className: "text-center text-xs text-ink-muted py-1 font-medium",
				children: d
			}, d))
		}),
		/* @__PURE__ */ jsx("div", {
			className: "grid grid-cols-7 gap-0.5",
			children: cells.map((day, i) => {
				if (!day) return /* @__PURE__ */ jsx("div", {}, i);
				const date = new Date(year, month, day);
				const dateStr = toDateStr$1(year, month, day);
				const isPast = date < today;
				const dow = DOW_MAP[date.getDay()];
				const isAvailable = availableDays.has(dow) && !isPast;
				const isSelected = selectedDate === dateStr;
				return /* @__PURE__ */ jsxs("button", {
					disabled: !isAvailable,
					onClick: () => isAvailable && onSelect(dateStr),
					className: `relative text-xs py-1.5 rounded-lg transition-colors font-medium
                ${isSelected ? "bg-primary text-white" : isAvailable ? "hover:bg-primary-soft text-ink" : "text-ink-muted/40 cursor-default"}`,
					children: [day, isAvailable && !isSelected && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" })]
				}, i);
			})
		})
	] });
}
var MONTH_NAMES_SHORT = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic"
];
var DOW_FULL = [
	"domingo",
	"lunes",
	"martes",
	"miércoles",
	"jueves",
	"viernes",
	"sábado"
];
function formatDateHuman(dateStr) {
	const [y, m, d] = dateStr.split("-").map(Number);
	const dow = DOW_FULL[new Date(y, m - 1, d).getDay()];
	return `${dow.charAt(0).toUpperCase() + dow.slice(1)} ${d} ${MONTH_NAMES_SHORT[m - 1]}`;
}
function BookingModal({ service, date, slot, onClose, token, compraItemId }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const confirmSitio = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.post("/reservas", {
				servicio_id: service.servicio_id,
				fecha: date,
				hora: slot.hora,
				modalidad: slot.modalidad,
				compra_item_paquete_id: compraItemId ? Number(compraItemId) : null
			}, token);
			if (!res.success) throw new Error(res.message ?? "Error al crear la reserva");
			window.dispatchEvent(new CustomEvent("reserva-updated"));
			setSuccess(true);
		} catch (e) {
			setError(e.message ?? "Error al reservar");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-4",
		style: { background: "rgba(0,0,0,0.4)" },
		onClick: (e) => {
			if (e.target === e.currentTarget) onClose(success);
		},
		children: /* @__PURE__ */ jsx("div", {
			className: "bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl",
			children: success ? /* @__PURE__ */ jsxs("div", {
				className: "p-8 flex flex-col items-center text-center gap-3",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-1",
						children: /* @__PURE__ */ jsx("ion-icon", {
							name: "checkmark-outline",
							style: {
								fontSize: "28px",
								color: "#22c55e"
							}
						})
					}),
					/* @__PURE__ */ jsx("h3", {
						className: "font-display text-xl text-ink",
						children: "¡Reserva confirmada!"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-sm text-ink-muted",
						children: [
							service.nombre,
							" · ",
							formatDateHuman(date),
							" · ",
							slot.hora,
							" · ",
							normalizeModality(slot.modalidad)
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-2 mt-2 w-full",
						children: [/* @__PURE__ */ jsx("button", {
							onClick: () => onClose(true),
							className: "flex-1 py-2.5 rounded-xl border border-border text-sm text-ink hover:bg-bg transition-colors",
							children: "Seguir explorando"
						}), /* @__PURE__ */ jsx(Link, {
							to: "/client",
							className: "flex-1 py-2.5 rounded-xl bg-ink text-white text-sm text-center font-medium hover:bg-primary transition-colors",
							children: "Mis reservas"
						})]
					})
				]
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between px-5 pt-5 pb-4 border-b border-border",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "font-display text-lg text-ink",
					children: "Confirmar reserva"
				}), /* @__PURE__ */ jsx("button", {
					onClick: () => onClose(false),
					className: "w-7 h-7 rounded-full hover:bg-bg flex items-center justify-center text-ink-muted transition-colors",
					children: /* @__PURE__ */ jsx("ion-icon", {
						name: "close-outline",
						style: { fontSize: "16px" }
					})
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "p-5 space-y-4",
				children: [
					compraItemId && /* @__PURE__ */ jsx("div", {
						className: "rounded-xl border border-green-200 bg-green-50 p-3",
						children: /* @__PURE__ */ jsx("p", {
							className: "text-sm font-medium text-green-700",
							children: "Esta reserva utilizará una sesión de tu paquete."
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "bg-bg rounded-xl p-4 space-y-1.5",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-ink",
								children: service.nombre
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-1.5 text-xs text-ink-muted",
								children: [/* @__PURE__ */ jsx("ion-icon", {
									name: "calendar-outline",
									style: { fontSize: "13px" }
								}), formatDateHuman(date)]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-1.5 text-xs text-ink-muted",
								children: [
									/* @__PURE__ */ jsx("ion-icon", {
										name: "time-outline",
										style: { fontSize: "13px" }
									}),
									slot.hora,
									" · ",
									service.duracion,
									" min"
								]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-base font-bold text-ink pt-1",
								children: ["$ ", Number(service.precio).toFixed(0)]
							})
						]
					}),
					error && /* @__PURE__ */ jsx("div", {
						className: "rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600",
						children: error
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: confirmSitio,
						disabled: loading,
						className: "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-primary disabled:opacity-60 transition-colors",
						children: [loading && /* @__PURE__ */ jsx("span", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), loading ? "Procesando..." : "Confirmar reserva"]
					})
				]
			})] })
		})
	});
}
var professional_$id_default = UNSAFE_withComponentProps(function ProfessionalDetail() {
	const { id } = useParams();
	const { token } = useAuth();
	const [searchParams] = useSearchParams();
	const compraItemId = searchParams.get("compraItem");
	const reprogramarId = searchParams.get("reprogramar");
	const isReprogramando = !!reprogramarId;
	const [reprogramado, setReprogramado] = useState(false);
	const [reservaOriginal, setReservaOriginal] = useState(null);
	const [loadingReserva, setLoadingReserva] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [profile, setProfile] = useState(null);
	const [loadingProfile, setLoadingProfile] = useState(true);
	const [profileError, setProfileError] = useState(null);
	const [activeTab, setActiveTab] = useState("Servicios");
	const [selectedService, setSelectedService] = useState(null);
	const [calMonth, setCalMonth] = useState(() => {
		const now = /* @__PURE__ */ new Date();
		return {
			year: now.getFullYear(),
			month: now.getMonth()
		};
	});
	const [availableDays, setAvailableDays] = useState(/* @__PURE__ */ new Set());
	const [loadingDays, setLoadingDays] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [slots, setSlots] = useState([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState(null);
	const [slotsError, setSlotsError] = useState(null);
	const [calificaciones, setCalificaciones] = useState([]);
	const [promedio, setPromedio] = useState(0);
	const [cantidadCalificaciones, setCantidadCalificaciones] = useState(0);
	const [loadingCalificaciones, setLoadingCalificaciones] = useState(false);
	useEffect(() => {
		if (!id || !token) return;
		setLoadingCalificaciones(true);
		api.get(`/profesionales/${id}/calificaciones`, token).then((res) => {
			setCalificaciones(res.data ?? []);
			setPromedio(res.promedio ?? 0);
			setCantidadCalificaciones(res.cantidad ?? 0);
		}).catch(console.error).finally(() => setLoadingCalificaciones(false));
	}, [id, token]);
	useEffect(() => {
		if (!id) return;
		api.get(`/profesionales/${id}`).then((res) => {
			if (res.success) {
				setProfile(res.data);
				const first = res.data.profesional?.servicios?.[0] ?? null;
				if (!reprogramarId) setSelectedService(first);
			} else setProfileError("Profesional no encontrado");
		}).catch((e) => setProfileError(e.message)).finally(() => setLoadingProfile(false));
	}, [id]);
	useEffect(() => {
		if (!selectedService) {
			setAvailableDays(/* @__PURE__ */ new Set());
			return;
		}
		setLoadingDays(true);
		setSelectedDate(null);
		setSlots([]);
		setSelectedSlot(null);
		api.get(`/servicios/${selectedService.servicio_id}/dias-disponibles`).then((res) => {
			if (res.success) setAvailableDays(new Set(res.data));
		}).catch(() => setAvailableDays(/* @__PURE__ */ new Set())).finally(() => setLoadingDays(false));
	}, [selectedService]);
	useEffect(() => {
		if (!selectedDate || !selectedService) return;
		setLoadingSlots(true);
		setSlots([]);
		setSelectedSlot(null);
		setSlotsError(null);
		api.get(`/servicios/${selectedService.servicio_id}/slots?fecha=${selectedDate}`).then((res) => {
			if (res.success) setSlots(res.data);
		}).catch((e) => setSlotsError(e.message ?? "Error al cargar horarios")).finally(() => setLoadingSlots(false));
	}, [selectedDate, selectedService]);
	useEffect(() => {
		if (!selectedDate || !selectedService) return;
		const handler = async () => {
			console.log("SLOTS REFRESH");
			try {
				const res = await api.get(`/servicios/${selectedService.servicio_id}/slots?fecha=${selectedDate}`);
				if (res.success) setSlots(res.data);
			} catch (e) {
				console.error(e);
			}
		};
		window.addEventListener("reserva-updated", handler);
		return () => window.removeEventListener("reserva-updated", handler);
	}, [selectedDate, selectedService]);
	useEffect(() => {
		if (!reprogramarId) return;
		setLoadingReserva(true);
		api.get(`/reservas/${reprogramarId}`, token).then((res) => {
			if (!res.success) return;
			setReservaOriginal(res.data);
		}).catch(console.error).finally(() => setLoadingReserva(false));
	}, [reprogramarId]);
	useEffect(() => {
		if (!profile || !reservaOriginal) return;
		const servicioId = reservaOriginal.servicio_id;
		const servicio = profile.profesional.servicios.find((s) => Number(s.servicio_id) === Number(servicioId));
		if (!servicio) return;
		setSelectedService(servicio);
		setActiveTab("Servicios");
	}, [profile, reservaOriginal]);
	const handleReprogramar = async () => {
		if (!reprogramarId || !selectedService || !selectedDate || !selectedSlot) return;
		try {
			await api.put(`/reservas/${reprogramarId}/reprogramar`, {
				servicio_id: selectedService.servicio_id,
				fecha: selectedDate,
				hora: selectedSlot.hora,
				modalidad: selectedSlot.modalidad
			}, token);
			setReprogramado(true);
		} catch (e) {
			console.error(e);
		}
	};
	if (loadingProfile) return /* @__PURE__ */ jsxs("div", {
		className: "p-6 max-w-6xl mx-auto animate-pulse space-y-4",
		children: [
			/* @__PURE__ */ jsx("div", { className: "h-4 bg-border/50 rounded w-48" }),
			/* @__PURE__ */ jsx("div", { className: "h-8 bg-border/50 rounded w-72" }),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4",
				children: [/* @__PURE__ */ jsx("div", { className: "lg:col-span-2 h-64 bg-surface border border-border rounded-2xl" }), /* @__PURE__ */ jsx("div", { className: "h-64 bg-surface border border-border rounded-2xl" })]
			})
		]
	});
	if (loadingReserva) return /* @__PURE__ */ jsx("div", {
		className: "p-6 max-w-6xl mx-auto flex items-center justify-center py-24 text-sm text-ink-muted",
		children: "Cargando reserva..."
	});
	if (profileError || !profile) return /* @__PURE__ */ jsxs("div", {
		className: "p-6 flex flex-col items-center justify-center py-24 text-center",
		children: [
			/* @__PURE__ */ jsx("ion-icon", {
				name: "person-outline",
				style: {
					fontSize: "48px",
					color: "var(--color-ink-muted)",
					marginBottom: "12px"
				}
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-ink font-medium mb-1",
				children: "Profesional no encontrado"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-ink-muted text-sm mb-4",
				children: profileError
			}),
			/* @__PURE__ */ jsx(Link, {
				to: "/client/discover",
				className: "text-primary text-sm underline",
				children: "Volver a Descubrir"
			})
		]
	});
	const { name, profesional } = profile;
	const servicios = profesional?.servicios ?? [];
	return /* @__PURE__ */ jsxs("div", {
		className: "p-6 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("nav", {
				className: "text-sm text-ink-muted mb-4 flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/client/discover",
						className: "hover:text-ink",
						children: "Descubrir"
					}),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx("span", { children: name })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display italic text-3xl text-ink",
					children: name
				}), profesional?.ubicacion && /* @__PURE__ */ jsxs("p", {
					className: "text-ink-muted flex items-center gap-1 mt-1 text-sm",
					children: [/* @__PURE__ */ jsx("ion-icon", {
						name: "location-outline",
						style: { fontSize: "14px" }
					}), profesional.ubicacion]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 space-y-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl overflow-hidden",
						children: [/* @__PURE__ */ jsx("div", { className: "h-40 w-full bg-gradient-to-br from-violet-100 to-purple-200" }), /* @__PURE__ */ jsx("div", {
							className: "px-6 pb-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-4 -mt-6 mb-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-16 h-16 rounded-full bg-violet-400 flex items-center justify-center text-white text-xl font-semibold border-4 border-white shrink-0",
									children: getInitials$4(name)
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex-1 mt-7 flex items-center justify-between flex-wrap gap-2",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
										className: "font-display italic text-xl text-ink",
										children: name
									}), servicios.length > 0 && /* @__PURE__ */ jsx("p", {
										className: "text-sm text-ink-muted",
										children: servicios[0].tipo
									})] }), /* @__PURE__ */ jsx("button", {
										className: "w-9 h-9 border border-border rounded-xl flex items-center justify-center text-ink-muted hover:text-accent transition-colors",
										children: /* @__PURE__ */ jsx("ion-icon", {
											name: "heart-outline",
											style: { fontSize: "16px" }
										})
									})]
								})]
							})
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl overflow-hidden",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex border-b border-border px-2 pt-2",
							children: TABS.map((tab) => {
								const label = tab === "Servicios" ? `Servicios · ${servicios.length}` : tab;
								return /* @__PURE__ */ jsx("button", {
									onClick: () => setActiveTab(tab),
									className: `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? "border border-border border-b-surface -mb-px bg-surface text-ink" : "text-ink-muted hover:text-ink"}`,
									children: label
								}, tab);
							})
						}), /* @__PURE__ */ jsxs("div", {
							className: "p-6",
							children: [
								activeTab === "Acerca de" && /* @__PURE__ */ jsxs("p", {
									className: "text-sm text-ink leading-relaxed",
									children: [
										"Descripción:",
										" ",
										profesional?.descripcion ?? "Este profesional aún no ha completado su descripción."
									]
								}),
								activeTab === "Servicios" && /* @__PURE__ */ jsx("div", {
									className: "space-y-3",
									children: servicios.length === 0 ? /* @__PURE__ */ jsx("p", {
										className: "text-sm text-ink-muted",
										children: "Sin servicios publicados."
									}) : servicios.map((s) => {
										const modality = normalizeModality(s.modalidad);
										return /* @__PURE__ */ jsxs("div", {
											onClick: () => setSelectedService(s),
											className: `flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedService?.servicio_id === s.servicio_id ? "border-primary bg-primary-soft/20" : "border-border bg-bg hover:border-primary/40"}`,
											children: [/* @__PURE__ */ jsxs("div", {
												className: "flex-1 min-w-0",
												children: [
													/* @__PURE__ */ jsx("p", {
														className: "text-sm font-medium text-ink mb-0.5",
														children: s.nombre
													}),
													s.descripcion && /* @__PURE__ */ jsx("p", {
														className: "text-xs text-ink-muted line-clamp-1 mb-1",
														children: s.descripcion
													}),
													/* @__PURE__ */ jsxs("div", {
														className: "flex items-center gap-2 flex-wrap",
														children: [/* @__PURE__ */ jsxs("span", {
															className: "flex items-center gap-1 text-xs text-ink-muted",
															children: [
																/* @__PURE__ */ jsx("ion-icon", {
																	name: "time-outline",
																	style: { fontSize: "12px" }
																}),
																s.duracion,
																" min"
															]
														}), /* @__PURE__ */ jsxs("span", {
															className: `flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${modality === "Virtual" ? "border-primary/30 text-primary bg-primary-soft/40" : "border-border text-ink-muted bg-surface"}`,
															children: [/* @__PURE__ */ jsx("ion-icon", {
																name: modality === "Virtual" ? "desktop-outline" : "location-outline",
																style: { fontSize: "11px" }
															}), modality]
														})]
													})
												]
											}), /* @__PURE__ */ jsxs("span", {
												className: "text-lg font-bold text-ink shrink-0",
												children: ["$ ", Number(s.precio).toFixed(0)]
											})]
										}, s.servicio_id);
									})
								}),
								activeTab === "Reseñas" && /* @__PURE__ */ jsxs("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ jsx("h3", {
												className: "font-display text-lg text-ink",
												children: "Reseñas"
											}), /* @__PURE__ */ jsxs("div", {
												className: "text-sm text-ink-muted",
												children: [
													"⭐ ",
													promedio.toFixed(1),
													" · ",
													cantidadCalificaciones,
													" opiniones"
												]
											})]
										}),
										loadingCalificaciones && /* @__PURE__ */ jsx("div", {
											className: "text-sm text-ink-muted py-6",
											children: "Cargando reseñas..."
										}),
										!loadingCalificaciones && calificaciones.length === 0 && /* @__PURE__ */ jsxs("div", {
											className: "flex flex-col items-center py-8 text-center",
											children: [/* @__PURE__ */ jsx("ion-icon", {
												name: "star-outline",
												style: {
													fontSize: "36px",
													color: "var(--color-ink-muted)"
												}
											}), /* @__PURE__ */ jsx("p", {
												className: "text-sm text-ink-muted mt-2",
												children: "Este profesional aún no tiene reseñas"
											})]
										}),
										/* @__PURE__ */ jsx("div", {
											className: "space-y-2",
											children: calificaciones.map((c) => /* @__PURE__ */ jsxs("div", {
												className: "p-4 border border-border rounded-xl bg-bg",
												children: [
													/* @__PURE__ */ jsxs("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ jsx("p", {
															className: "text-sm font-semibold text-ink",
															children: c.cliente_nombre ?? "Cliente"
														}), /* @__PURE__ */ jsxs("span", {
															className: "text-amber-500 text-sm font-bold",
															children: [
																"⭐ ",
																c.puntuacion,
																"/5"
															]
														})]
													}),
													c.comentario && /* @__PURE__ */ jsx("p", {
														className: "text-sm text-ink-muted mt-2",
														children: c.comentario
													}),
													/* @__PURE__ */ jsx("p", {
														className: "text-[11px] text-ink-muted mt-2",
														children: c.reserva?.servicio?.nombre
													})
												]
											}, c.calificacion_id))
										})
									]
								})
							]
						})]
					})]
				}), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", {
					className: "bg-surface border border-border rounded-2xl p-5 sticky top-6 space-y-5",
					children: selectedService ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1",
								children: "Servicio seleccionado"
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "font-display italic text-xl text-ink",
								children: selectedService.nombre
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 mt-2 flex-wrap",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1 text-xs text-ink-muted",
									children: [
										/* @__PURE__ */ jsx("ion-icon", {
											name: "time-outline",
											style: { fontSize: "12px" }
										}),
										selectedService.duracion,
										" min"
									]
								}), /* @__PURE__ */ jsxs("span", {
									className: `flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${normalizeModality(selectedService.modalidad) === "Virtual" ? "border-primary/30 text-primary bg-primary-soft/40" : "border-border text-ink-muted bg-bg"}`,
									children: [/* @__PURE__ */ jsx("ion-icon", {
										name: normalizeModality(selectedService.modalidad) === "Virtual" ? "desktop-outline" : "location-outline",
										style: { fontSize: "11px" }
									}), normalizeModality(selectedService.modalidad)]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-baseline gap-2 mt-3",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-xs text-ink-muted",
									children: "desde"
								}), /* @__PURE__ */ jsxs("span", {
									className: "font-display italic text-2xl text-ink",
									children: ["$ ", Number(selectedService.precio).toFixed(0)]
								})]
							})
						] }),
						/* @__PURE__ */ jsx("hr", { className: "border-border" }),
						isReprogramando && !reprogramado && /* @__PURE__ */ jsx("div", {
							className: "mb-3 bg-blue-100 text-blue-700 px-3 py-2 rounded-xl text-sm",
							children: "Estás reprogramando una reserva. Elegí nueva fecha y horario."
						}),
						reprogramado && /* @__PURE__ */ jsx("div", {
							className: "mb-3 bg-green-100 text-green-700 px-3 py-2 rounded-xl text-sm",
							children: "Reserva reprogramada correctamente ✔"
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3",
							children: "Seleccioná una fecha"
						}), loadingDays ? /* @__PURE__ */ jsx("div", {
							className: "flex justify-center py-6",
							children: /* @__PURE__ */ jsx("span", { className: "w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" })
						}) : availableDays.size === 0 ? /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 py-4 text-sm text-ink-muted",
							children: [/* @__PURE__ */ jsx("ion-icon", {
								name: "calendar-outline",
								style: { fontSize: "16px" }
							}), "Este servicio no tiene horarios configurados aún."]
						}) : /* @__PURE__ */ jsx(MiniCalendar, {
							year: calMonth.year,
							month: calMonth.month,
							availableDays,
							selectedDate,
							onSelect: setSelectedDate,
							onPrev: () => setCalMonth(({ year, month }) => month === 0 ? {
								year: year - 1,
								month: 11
							} : {
								year,
								month: month - 1
							}),
							onNext: () => setCalMonth(({ year, month }) => month === 11 ? {
								year: year + 1,
								month: 0
							} : {
								year,
								month: month + 1
							})
						})] }),
						selectedDate && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("hr", { className: "border-border" }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3",
							children: "Horarios disponibles"
						}), loadingSlots ? /* @__PURE__ */ jsx("div", {
							className: "flex justify-center py-4",
							children: /* @__PURE__ */ jsx("span", { className: "w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" })
						}) : slotsError ? /* @__PURE__ */ jsx("p", {
							className: "text-sm text-red-500",
							children: slotsError
						}) : slots.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "No hay turnos disponibles para este día."
						}) : /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-3 gap-1.5",
							children: slots.map((slot) => /* @__PURE__ */ jsxs("button", {
								onClick: () => setSelectedSlot(selectedSlot?.hora === slot.hora ? null : slot),
								className: `text-sm py-2 rounded-xl border transition-colors flex flex-col items-center ${selectedSlot?.hora === slot.hora ? "bg-primary text-white border-primary" : "border-border text-ink hover:bg-bg"}`,
								children: [/* @__PURE__ */ jsx("span", { children: slot.hora }), selectedService.modalidad === "hibrido" && /* @__PURE__ */ jsx("span", {
									className: "text-[10px] opacity-70",
									children: normalizeModality(slot.modalidad)
								})]
							}, slot.hora))
						})] })] }),
						/* @__PURE__ */ jsx("button", {
							disabled: !selectedSlot,
							onClick: () => {
								if (!selectedSlot) return;
								if (isReprogramando) handleReprogramar();
								else setShowModal(true);
							},
							className: `w-full font-medium py-3 rounded-xl transition-colors ${selectedSlot ? "bg-primary hover:bg-primary-hover text-white" : "bg-primary/30 text-white cursor-not-allowed"}`,
							children: selectedSlot ? "Reservar" : "Seleccioná fecha y horario"
						})
					] }) : /* @__PURE__ */ jsx("p", {
						className: "text-sm text-ink-muted py-4 text-center",
						children: "Seleccioná un servicio para ver disponibilidad."
					})
				}) })]
			}),
			showModal && !isReprogramando && selectedService && selectedDate && selectedSlot && /* @__PURE__ */ jsx(BookingModal, {
				service: selectedService,
				date: selectedDate,
				slot: selectedSlot,
				token,
				compraItemId,
				onClose: (success) => {
					setShowModal(false);
					if (success) {
						setSelectedSlot(null);
						setSelectedDate(null);
					}
				}
			})
		]
	});
});
//#endregion
//#region app/routes/client/booking.$id.pay.tsx
var booking_$id_pay_exports = /* @__PURE__ */ __exportAll({ default: () => booking_$id_pay_default });
var STEPS$2 = [
	"Servicio",
	"Fecha y hora",
	"Modalidad",
	"Pago",
	"Confirmación"
];
var booking_$id_pay_default = UNSAFE_withComponentProps(function BookingPay() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [method, setMethod] = useState("card");
	const [loading, setLoading] = useState(false);
	const handleConfirm = async () => {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 1200));
		setLoading(false);
		navigate(`/session/1/rating`);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("nav", {
				className: "text-sm text-ink-muted mb-6 flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/client/discover",
						className: "hover:text-ink",
						children: "Descubrir"
					}),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx(Link, {
						to: `/client/professional/${id}`,
						className: "hover:text-ink",
						children: "María Ortiz"
					}),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx("span", { children: "Reserva" })
				]
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "font-display italic text-3xl text-ink mb-6",
				children: "Confirmá tu reserva"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-3 mb-8 overflow-x-auto pb-2",
				children: STEPS$2.map((step, i) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 shrink-0",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("div", {
							className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${i < 3 ? "bg-primary border-primary text-white" : i === 3 ? "border-primary text-primary bg-surface" : "border-border text-ink-muted bg-surface"}`,
							children: i < 3 ? "✓" : i + 1
						}), /* @__PURE__ */ jsx("span", {
							className: `text-sm font-medium ${i === 3 ? "text-ink" : i < 3 ? "text-primary" : "text-ink-muted"}`,
							children: step
						})]
					}), i < STEPS$2.length - 1 && /* @__PURE__ */ jsx("div", { className: `h-px w-8 ${i < 3 ? "bg-primary" : "bg-border"}` })]
				}, step))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-5 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-3 space-y-4",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-ink",
							children: "Método de pago"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Elegí cómo abonar tu sesión. El cobro se realiza al confirmar."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "card" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "card",
											checked: method === "card",
											onChange: () => setMethod("card"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "💳"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: "Tarjeta de crédito o débito"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Visa, Mastercard, Amex"
										})] })
									]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "mercadopago" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "mercadopago",
											checked: method === "mercadopago",
											onChange: () => setMethod("mercadopago"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "$"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: "Mercado Pago"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Saldo, tarjetas y transferencia"
										})] })
									]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "package" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "package",
											checked: method === "package",
											onChange: () => setMethod("package"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "📦"
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ jsx("p", {
													className: "text-sm font-medium text-ink",
													children: "Usar paquete activo"
												}), /* @__PURE__ */ jsx("span", {
													className: "text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full",
													children: "Recomendado"
												})]
											}), /* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted",
												children: "3 sesiones restantes · vence 12 ago"
											})]
										})
									]
								})
							]
						}),
						method === "card" && /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl p-5 space-y-4",
							children: [
								/* @__PURE__ */ jsx("h3", {
									className: "text-sm font-semibold text-ink",
									children: "Datos de la tarjeta"
								}),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
									className: "block text-xs text-ink-muted mb-1",
									children: "Número"
								}), /* @__PURE__ */ jsx("input", {
									defaultValue: "4242 4242 4242 4242",
									className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
								})] }),
								/* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-3 gap-3",
									children: [
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											className: "block text-xs text-ink-muted mb-1",
											children: "Vencimiento"
										}), /* @__PURE__ */ jsx("input", {
											defaultValue: "08/27",
											className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											className: "block text-xs text-ink-muted mb-1",
											children: "CVV"
										}), /* @__PURE__ */ jsx("input", {
											defaultValue: "•••",
											className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											className: "block text-xs text-ink-muted mb-1",
											children: "Titular"
										}), /* @__PURE__ */ jsx("input", {
											defaultValue: "Lucía Pérez",
											className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
										})] })
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-4 pt-2",
							children: [/* @__PURE__ */ jsx(Link, {
								to: `/client/professional/${id}`,
								className: "flex items-center gap-2 border border-border px-5 py-3 rounded-xl text-sm font-medium text-ink hover:bg-bg transition-colors",
								children: "← Volver"
							}), /* @__PURE__ */ jsx("button", {
								onClick: handleConfirm,
								disabled: loading,
								className: "flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60",
								children: loading ? "Procesando..." : "Confirmar y pagar €48 →"
							})]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl p-5",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4",
								children: "Resumen"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 mb-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-10 h-10 rounded-full bg-violet-400 flex items-center justify-center text-white text-sm font-semibold",
									children: "MO"
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink",
									children: "María Ortiz"
								}), /* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted",
									children: "Psicología clínica"
								})] })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-2 text-sm border-t border-border pt-4",
								children: [
									["Servicio", "Sesión individual"],
									["Duración", "50 min"],
									["Fecha", "Vie 22 may · 15:00"],
									["Modalidad", "Virtual"]
								].map(([label, value]) => /* @__PURE__ */ jsxs("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-ink-muted",
										children: label
									}), /* @__PURE__ */ jsx("span", {
										className: "text-ink font-medium",
										children: value
									})]
								}, label))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "border-t border-border mt-4 pt-4 space-y-1 text-sm",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted",
											children: "Subtotal"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "€48.00"
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted",
											children: "Comisión plataforma"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "incluida"
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between text-base font-semibold mt-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "Total"
										}), /* @__PURE__ */ jsx("span", {
											className: "font-display italic text-2xl text-ink",
											children: "€48.00"
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 mt-4 text-xs text-ink-muted",
								children: [/* @__PURE__ */ jsx("span", { children: "○" }), /* @__PURE__ */ jsx("span", { children: "Pago seguro · cifrado SSL" })]
							})
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded-2xl p-4",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-base mt-0.5",
								children: "🔔"
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-ink",
								children: "Recordatorios automáticos"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted leading-relaxed",
								children: "Te enviaremos un mail 24h y 1h antes con el enlace."
							})] })]
						})
					})]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/client/package.$id.pay.tsx
var package_$id_pay_exports = /* @__PURE__ */ __exportAll({ default: () => package_$id_pay_default });
var STEPS$1 = [
	"Paquete",
	"Pago",
	"Confirmación"
];
var package_$id_pay_default = UNSAFE_withComponentProps(function PackagePay() {
	const { id } = useParams();
	const { token } = useAuth();
	const [paquete, setPaquete] = useState(null);
	const [loadingPaquete, setLoadingPaquete] = useState(true);
	useNavigate();
	const [method, setMethod] = useState("card");
	const [loading, setLoading] = useState(false);
	const handleConfirm = async () => {
		try {
			setLoading(true);
			const compra = await api.post("/compra-paquetes", { paquete_id: Number(id) }, token);
			const pago = await api.post(`/pagos/paquete/${compra.compra_paquete_id}/paypal`, {}, token);
			if (pago.approval_url) {
				window.location.href = pago.approval_url;
				return;
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (!token || !id) return;
		api.get(`/paquetes/${id}`, token).then((res) => {
			console.log("PAQUETE:", res);
			setPaquete(res);
		}).catch((err) => {
			console.error("ERROR PAQUETE:", err);
		}).finally(() => {
			setLoadingPaquete(false);
		});
	}, [id, token]);
	if (loadingPaquete) return /* @__PURE__ */ jsx("p", {
		className: "p-4 md:p-8",
		children: "Cargando..."
	});
	if (!paquete) return /* @__PURE__ */ jsx("p", {
		className: "p-4 md:p-8",
		children: "Paquete no encontrado"
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("nav", {
				className: "text-sm text-ink-muted mb-6 flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/client/discover",
						className: "hover:text-ink",
						children: "Descubrir"
					}),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx("span", { children: "Paquetes" }),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx("span", { children: "Compra" })
				]
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "font-display italic text-3xl text-ink mb-6",
				children: "Confirmá tu compra"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-3 mb-8 overflow-x-auto pb-2",
				children: STEPS$1.map((step, i) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 shrink-0",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("div", {
							className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${i < 3 ? "bg-primary border-primary text-white" : i === 3 ? "border-primary text-primary bg-surface" : "border-border text-ink-muted bg-surface"}`,
							children: i < 3 ? "✓" : i + 1
						}), /* @__PURE__ */ jsx("span", {
							className: `text-sm font-medium ${i === 3 ? "text-ink" : i < 3 ? "text-primary" : "text-ink-muted"}`,
							children: step
						})]
					}), i < STEPS$1.length - 1 && /* @__PURE__ */ jsx("div", { className: `h-px w-8 ${i < 3 ? "bg-primary" : "bg-border"}` })]
				}, step))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-5 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-3 space-y-4",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-ink",
							children: "Método de pago"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Elegí cómo abonar tu paquete. El cobro se realiza al confirmar."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "card" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "card",
											checked: method === "card",
											onChange: () => setMethod("card"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "💳"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: "Tarjeta de crédito o débito"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Visa, Mastercard, Amex"
										})] })
									]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "mercadopago" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "mercadopago",
											checked: method === "mercadopago",
											onChange: () => setMethod("mercadopago"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "$"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: "Mercado Pago"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Saldo, tarjetas y transferencia"
										})] })
									]
								}),
								method === "card" && /* @__PURE__ */ jsxs("div", {
									className: "bg-surface border border-border rounded-2xl p-5 space-y-4",
									children: [
										/* @__PURE__ */ jsx("h3", {
											className: "text-sm font-semibold text-ink",
											children: "Datos de la tarjeta"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											className: "block text-xs text-ink-muted mb-1",
											children: "Número"
										}), /* @__PURE__ */ jsx("input", {
											defaultValue: "4242 4242 4242 4242",
											className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
										})] }),
										/* @__PURE__ */ jsxs("div", {
											className: "grid grid-cols-3 gap-3",
											children: [
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
													className: "block text-xs text-ink-muted mb-1",
													children: "Vencimiento"
												}), /* @__PURE__ */ jsx("input", {
													defaultValue: "08/27",
													className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
													className: "block text-xs text-ink-muted mb-1",
													children: "CVV"
												}), /* @__PURE__ */ jsx("input", {
													defaultValue: "•••",
													className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
													className: "block text-xs text-ink-muted mb-1",
													children: "Titular"
												}), /* @__PURE__ */ jsx("input", {
													defaultValue: "Lucía Pérez",
													className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
												})] })
											]
										})
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-4 pt-2",
							children: [/* @__PURE__ */ jsx(Link, {
								to: "/client/discover",
								className: "flex items-center gap-2 border border-border px-5 py-3 rounded-xl text-sm font-medium text-ink hover:bg-bg transition-colors",
								children: "← Volver"
							}), /* @__PURE__ */ jsx("button", {
								onClick: handleConfirm,
								disabled: loading,
								className: "flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60",
								children: loading ? "Procesando..." : "Confirmar compra →"
							})]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl p-5",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4",
								children: "Resumen"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 mb-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-10 h-10 rounded-full bg-violet-400 flex items-center justify-center text-white text-sm font-semibold",
									children: "MO"
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink",
									children: paquete?.nombre
								}), /* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted",
									children: paquete?.descripcion
								})] })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-2 text-sm border-t border-border pt-4",
								children: [["Paquete", paquete?.nombre]].map(([label, value]) => /* @__PURE__ */ jsxs("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-ink-muted",
										children: label
									}), /* @__PURE__ */ jsx("span", {
										className: "text-ink font-medium",
										children: value
									})]
								}, label))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "border-t border-border mt-4 pt-4 space-y-1 text-sm",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted",
											children: "Subtotal"
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-ink",
											children: ["$", Number(paquete?.subtotal).toFixed(2)]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted",
											children: "Comisión plataforma"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "incluida"
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between text-base font-semibold mt-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "Total"
										}), /* @__PURE__ */ jsx("span", {
											className: "font-display italic text-2xl text-ink",
											children: Number(paquete?.precio_total).toFixed(2)
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 mt-4 text-xs text-ink-muted",
								children: [/* @__PURE__ */ jsx("span", { children: "○" }), /* @__PURE__ */ jsx("span", { children: "Pago seguro · cifrado SSL" })]
							})
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded-2xl p-4",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-base mt-0.5",
								children: "🔔"
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-ink",
								children: "Recordatorios automáticos"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted leading-relaxed",
								children: "Te enviaremos un mail 24h y 1h antes con el enlace."
							})] })]
						})
					})]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/client/compra-package.$id.pay.tsx
var compra_package_$id_pay_exports = /* @__PURE__ */ __exportAll({ default: () => compra_package_$id_pay_default });
var STEPS = [
	"Paquete",
	"Pago",
	"Confirmación"
];
var compra_package_$id_pay_default = UNSAFE_withComponentProps(function CompraPackagePay() {
	const { id } = useParams();
	const { token } = useAuth();
	const [compra, setCompra] = useState(null);
	const [loadingPaquete, setLoadingPaquete] = useState(true);
	useNavigate();
	const [method, setMethod] = useState("card");
	const [loading, setLoading] = useState(false);
	const handleConfirm = async () => {
		try {
			setLoading(true);
			const pago = await api.post(`/pagos/paquete/${id}/paypal`, {}, token);
			if (pago.approval_url) {
				window.location.href = pago.approval_url;
				return;
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (!token || !id) return;
		api.get(`/compra-paquetes/${id}`, token).then((res) => {
			console.log("COMPRA:", res);
			setCompra(res);
		}).catch((err) => {
			console.error("ERROR COMPRA:", err);
		}).finally(() => {
			setLoadingPaquete(false);
		});
	}, [id, token]);
	if (loadingPaquete) return /* @__PURE__ */ jsx("p", {
		className: "p-4 md:p-8",
		children: "Cargando..."
	});
	if (!compra) return /* @__PURE__ */ jsx("p", {
		className: "p-4 md:p-8",
		children: "Compra no encontrada"
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("nav", {
				className: "text-sm text-ink-muted mb-6 flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/client/discover",
						className: "hover:text-ink",
						children: "Descubrir"
					}),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx("span", { children: "Paquetes" }),
					/* @__PURE__ */ jsx("span", { children: "·" }),
					/* @__PURE__ */ jsx("span", { children: "Compra" })
				]
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "font-display italic text-3xl text-ink mb-6",
				children: "Confirmá tu compra"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-3 mb-8 overflow-x-auto pb-2",
				children: STEPS.map((step, i) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 shrink-0",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("div", {
							className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${i < 3 ? "bg-primary border-primary text-white" : i === 3 ? "border-primary text-primary bg-surface" : "border-border text-ink-muted bg-surface"}`,
							children: i < 3 ? "✓" : i + 1
						}), /* @__PURE__ */ jsx("span", {
							className: `text-sm font-medium ${i === 3 ? "text-ink" : i < 3 ? "text-primary" : "text-ink-muted"}`,
							children: step
						})]
					}), i < STEPS.length - 1 && /* @__PURE__ */ jsx("div", { className: `h-px w-8 ${i < 3 ? "bg-primary" : "bg-border"}` })]
				}, step))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-5 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-3 space-y-4",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-ink",
							children: "Método de pago"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Elegí cómo abonar tu paquete. El cobro se realiza al confirmar."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "card" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "card",
											checked: method === "card",
											onChange: () => setMethod("card"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "💳"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: "Tarjeta de crédito o débito"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Visa, Mastercard, Amex"
										})] })
									]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "mercadopago" ? "border-primary bg-primary-soft/20" : "border-border bg-surface hover:bg-bg"}`,
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "radio",
											name: "method",
											value: "mercadopago",
											checked: method === "mercadopago",
											onChange: () => setMethod("mercadopago"),
											className: "accent-primary"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-lg",
											children: "$"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: "Mercado Pago"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Saldo, tarjetas y transferencia"
										})] })
									]
								}),
								method === "card" && /* @__PURE__ */ jsxs("div", {
									className: "bg-surface border border-border rounded-2xl p-5 space-y-4",
									children: [
										/* @__PURE__ */ jsx("h3", {
											className: "text-sm font-semibold text-ink",
											children: "Datos de la tarjeta"
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											className: "block text-xs text-ink-muted mb-1",
											children: "Número"
										}), /* @__PURE__ */ jsx("input", {
											defaultValue: "4242 4242 4242 4242",
											className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
										})] }),
										/* @__PURE__ */ jsxs("div", {
											className: "grid grid-cols-3 gap-3",
											children: [
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
													className: "block text-xs text-ink-muted mb-1",
													children: "Vencimiento"
												}), /* @__PURE__ */ jsx("input", {
													defaultValue: "08/27",
													className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
													className: "block text-xs text-ink-muted mb-1",
													children: "CVV"
												}), /* @__PURE__ */ jsx("input", {
													defaultValue: "•••",
													className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
												})] }),
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
													className: "block text-xs text-ink-muted mb-1",
													children: "Titular"
												}), /* @__PURE__ */ jsx("input", {
													defaultValue: "Lucía Pérez",
													className: "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
												})] })
											]
										})
									]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-4 pt-2",
							children: [/* @__PURE__ */ jsx(Link, {
								to: "/client/discover",
								className: "flex items-center gap-2 border border-border px-5 py-3 rounded-xl text-sm font-medium text-ink hover:bg-bg transition-colors",
								children: "← Volver"
							}), /* @__PURE__ */ jsx("button", {
								onClick: handleConfirm,
								disabled: loading,
								className: "flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60",
								children: loading ? "Procesando..." : "Confirmar compra →"
							})]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl p-5",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-4",
								children: "Resumen"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 mb-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-10 h-10 rounded-full bg-violet-400 flex items-center justify-center text-white text-sm font-semibold",
									children: "MO"
								}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink",
									children: compra?.paquete?.nombre
								}), /* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted",
									children: compra?.paquete?.descripcion
								})] })]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-2 text-sm border-t border-border pt-4",
								children: [["Paquete", compra?.paquete?.nombre]].map(([label, value]) => /* @__PURE__ */ jsxs("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-ink-muted",
										children: label
									}), /* @__PURE__ */ jsx("span", {
										className: "text-ink font-medium",
										children: value
									})]
								}, label))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "border-t border-border mt-4 pt-4 space-y-1 text-sm",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted",
											children: "Subtotal"
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-ink",
											children: ["$", Number(compra?.paquete?.subtotal).toFixed(2)]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted",
											children: "Comisión plataforma"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "incluida"
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex justify-between text-base font-semibold mt-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-ink",
											children: "Total"
										}), /* @__PURE__ */ jsx("span", {
											className: "font-display italic text-2xl text-ink",
											children: Number(compra?.paquete?.precio_total).toFixed(2)
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 mt-4 text-xs text-ink-muted",
								children: [/* @__PURE__ */ jsx("span", { children: "○" }), /* @__PURE__ */ jsx("span", { children: "Pago seguro · cifrado SSL" })]
							})
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded-2xl p-4",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-base mt-0.5",
								children: "🔔"
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-ink",
								children: "Recordatorios automáticos"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted leading-relaxed",
								children: "Te enviaremos un mail 24h y 1h antes con el enlace."
							})] })]
						})
					})]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/client/packages.tsx
var packages_exports = /* @__PURE__ */ __exportAll({ default: () => packages_default });
var packages_default = UNSAFE_withComponentProps(function Packages() {
	const { token } = useAuth();
	const navigate = useNavigate();
	const [packages, setPackages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [cancelling, setCancelling] = useState(null);
	useEffect(() => {
		if (!token) return;
		const loadPackages = async () => {
			try {
				setPackages(await api.get("/mis-compras-paquetes", token));
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		loadPackages();
	}, [token]);
	const cancelarCompra = async (id) => {
		try {
			setCancelling(id);
			await api.delete(`/compra-paquetes/${id}`, token);
			setPackages((prev) => prev.filter((p) => p.compra_paquete_id !== id));
		} catch (error) {
			console.error(error);
		} finally {
			setCancelling(null);
		}
	};
	if (loading) return /* @__PURE__ */ jsx("div", {
		className: "p-4 md:p-8",
		children: "Cargando paquetes..."
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-4xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink mb-6",
				children: "Paquetes"
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-4",
				children: "MIS PAQUETES"
			}),
			packages.length === 0 ? /* @__PURE__ */ jsx("p", { children: "No tienes paquetes comprados." }) : packages.map((compra) => {
				const total = compra.items.reduce((sum, item) => sum + item.item_paquete.cantidad_sesiones, 0);
				const restantes = compra.items.reduce((sum, item) => sum + item.sesiones_restantes, 0);
				const estadoPago = compra.pago?.estado;
				const badge = !estadoPago ? {
					label: "Sin pago",
					cls: "bg-slate-50 text-slate-700 border-slate-200"
				} : estadoPago === "aprobado" ? {
					label: "Activo",
					cls: "bg-green-50 text-green-700 border-green-200"
				} : estadoPago === "pendiente" ? {
					label: "Pendiente de pago",
					cls: "bg-amber-50 text-amber-700 border-amber-200"
				} : {
					label: "Pago rechazado",
					cls: "bg-red-50 text-red-700 border-red-200"
				};
				return /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded-2xl p-4 flex items-start gap-4 mb-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "shrink-0 w-14 h-14 flex items-center justify-center bg-bg border border-border rounded-xl",
						children: /* @__PURE__ */ jsx("ion-icon", {
							name: "cube-outline",
							style: { fontSize: "26px" }
						})
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex-1 min-w-0",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-start justify-between gap-2 mb-1",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink",
									children: compra.paquete.nombre
								}), /* @__PURE__ */ jsx("span", {
									className: `shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`,
									children: badge.label
								})]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-xs text-ink-muted",
								children: ["Compra #", compra.compra_paquete_id]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-xs text-ink-muted mb-2",
								children: ["Comprado el ", compra.fecha_compra]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap items-center gap-4 text-xs text-ink-muted",
								children: [
									/* @__PURE__ */ jsxs("span", { children: [
										restantes,
										" de ",
										total,
										" sesiones restantes"
									] }),
									/* @__PURE__ */ jsx("div", {
										className: "mt-4 space-y-2",
										children: compra.items.map((item) => /* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between border rounded-lg p-3",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
												className: "font-medium",
												children: item.item_paquete.servicio.nombre
											}), /* @__PURE__ */ jsxs("p", {
												className: "text-sm text-ink-muted",
												children: [item.sesiones_restantes, " sesiones restantes"]
											})] }), estadoPago === "aprobado" && item.sesiones_restantes > 0 && /* @__PURE__ */ jsx("button", {
												onClick: () => navigate(`/client/professional/${item.item_paquete.servicio.profesional_id}?compraItem=${item.compra_item_paquete_id}`),
												className: "bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-hover",
												children: "Reservar sesión"
											})]
										}, item.compra_item_paquete_id))
									}),
									/* @__PURE__ */ jsxs("span", {
										className: "font-semibold text-ink",
										children: ["$", Number(compra.paquete.precio_total).toFixed(0)]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-3 flex gap-2 flex-wrap",
								children: [
									estadoPago === "pendiente" && /* @__PURE__ */ jsx("button", {
										onClick: () => navigate(`/client/compra-package/${compra.compra_paquete_id}/pay`),
										className: "px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors",
										children: "Completar pago"
									}),
									(estadoPago === "rechazado" || estadoPago === "fallido") && /* @__PURE__ */ jsx("button", {
										onClick: () => navigate(`/client/compra-package/${compra.compra_paquete_id}/pay`),
										className: "px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors",
										children: "Reintentar pago"
									}),
									estadoPago === "pendiente" && /* @__PURE__ */ jsx("button", {
										onClick: () => cancelarCompra(compra.compra_paquete_id),
										disabled: cancelling === compra.compra_paquete_id,
										className: "px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50",
										children: cancelling === compra.compra_paquete_id ? "Cancelando..." : "Cancelar compra"
									})
								]
							})
						]
					})]
				}, compra.compra_paquete_id);
			})
		]
	});
});
//#endregion
//#region app/routes/client/messages.tsx
var messages_exports$1 = /* @__PURE__ */ __exportAll({ default: () => messages_default$1 });
var conversations$1 = [
	{
		initials: "MO",
		name: "María Ortiz",
		preview: "Antes de la sesión, completá el formulario...",
		time: "1h",
		unread: 2,
		color: "bg-violet-500"
	},
	{
		initials: "AC",
		name: "Andrés Calleja",
		preview: "¡Recordá traer ropa cómoda el lunes!",
		time: "ayer",
		unread: 0,
		color: "bg-orange-400"
	},
	{
		initials: "LS",
		name: "Liana Souza",
		preview: "¿Podés enviarme el registro de la semana?",
		time: "lun",
		unread: 0,
		color: "bg-teal-500"
	}
];
var messages$1 = [
	{
		from: "pro",
		text: "Hola Lucía! ¿Cómo te sentiste después de la última sesión?",
		time: "lun 10:30"
	},
	{
		from: "client",
		text: "Mucho mejor, gracias! Seguí con los ejercicios de respiración.",
		time: "lun 11:00"
	},
	{
		from: "pro",
		text: "Antes de la sesión, completá el formulario que te envié por mail. ¡Nos vemos!",
		time: "hoy 10:40"
	}
];
var messages_default$1 = UNSAFE_withComponentProps(function ClientMessages() {
	const [selected, setSelected] = useState(0);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen overflow-hidden",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "w-72 border-r border-border bg-surface flex flex-col",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "p-4 border-b border-border",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-display text-xl text-ink mb-3",
					children: "Mensajes"
				}), /* @__PURE__ */ jsx("input", {
					className: "w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink",
					placeholder: "Buscar..."
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "flex-1 overflow-y-auto",
				children: conversations$1.map((c, i) => /* @__PURE__ */ jsxs("button", {
					onClick: () => setSelected(i),
					className: `w-full flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-bg text-left transition-colors ${selected === i ? "bg-accent/20" : ""}`,
					children: [
						/* @__PURE__ */ jsx("div", {
							className: `w-9 h-9 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`,
							children: c.initials
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between mb-0.5",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-sm font-semibold text-ink",
									children: c.name
								}), /* @__PURE__ */ jsx("span", {
									className: "text-xs text-ink-muted",
									children: c.time
								})]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted truncate",
								children: c.preview
							})]
						}),
						c.unread > 0 && /* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold shrink-0",
							children: c.unread
						})
					]
				}, i))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 flex flex-col bg-bg",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "bg-surface border-b border-border px-6 py-4 flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: `w-9 h-9 rounded-lg ${conversations$1[selected].color} flex items-center justify-center text-white text-xs font-bold`,
						children: conversations$1[selected].initials
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-ink",
						children: conversations$1[selected].name
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex-1 overflow-y-auto p-6 space-y-3",
					children: messages$1.map((m, i) => /* @__PURE__ */ jsx("div", {
						className: `flex ${m.from === "client" ? "justify-end" : "justify-start"}`,
						children: /* @__PURE__ */ jsxs("div", {
							className: `max-w-sm px-4 py-3 rounded text-sm ${m.from === "client" ? "bg-ink text-white" : "bg-surface border border-border text-ink"}`,
							children: [/* @__PURE__ */ jsx("p", { children: m.text }), /* @__PURE__ */ jsx("p", {
								className: `text-xs mt-1 ${m.from === "client" ? "text-white/60" : "text-ink-muted"}`,
								children: m.time
							})]
						})
					}, i))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "bg-surface border-t border-border p-4 flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("input", {
						className: "flex-1 border border-border rounded px-4 py-2.5 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink",
						placeholder: "Escribir mensaje..."
					}), /* @__PURE__ */ jsx("button", {
						className: "bg-ink text-white px-4 py-2.5 rounded hover:bg-primary text-sm font-semibold transition-colors",
						children: "Enviar"
					})]
				})
			]
		})]
	});
});
//#endregion
//#region app/routes/client/payments.tsx
var payments_exports$2 = /* @__PURE__ */ __exportAll({ default: () => payments_default$2 });
var badgeCls$2 = {
	pendiente: "badge badge-pendiente",
	aprobado: "badge badge-pagada",
	rechazado: "badge badge-cancelada",
	fallido: "badge badge-cancelada"
};
function PayPalLogo() {
	return /* @__PURE__ */ jsxs("span", {
		className: "flex items-center gap-0 leading-none select-none",
		style: {
			fontFamily: "Arial, Helvetica, sans-serif",
			fontWeight: 800,
			fontStyle: "italic",
			fontSize: "15px"
		},
		children: [/* @__PURE__ */ jsx("span", {
			style: { color: "#003087" },
			children: "Pay"
		}), /* @__PURE__ */ jsx("span", {
			style: { color: "#009cde" },
			children: "Pal"
		})]
	});
}
function CashIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.5,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: "w-6 h-6 text-ink",
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "2",
				y: "6",
				width: "20",
				height: "12",
				rx: "2"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "3"
			}),
			/* @__PURE__ */ jsx("path", { d: "M6 12h.01M18 12h.01" })
		]
	});
}
var payments_default$2 = UNSAFE_withComponentProps(function ClientPayments() {
	const { token } = useAuth();
	const navigate = useNavigate();
	const [reservas, setReservas] = useState([]);
	const [comprasPaquetes, setComprasPaquetes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [method, setMethod] = useState("presencial");
	const [loadingPay, setLoadingPay] = useState(false);
	useEffect(() => {
		if (!token) return;
		Promise.all([api.get("/mis-reservas", token), api.get("/mis-compras-paquetes", token)]).then(([reservasRes, paquetesRes]) => {
			if (reservasRes.success) setReservas(reservasRes.data);
			setComprasPaquetes(paquetesRes);
		}).finally(() => setLoading(false));
	}, [token]);
	const conPago = reservas.filter((r) => r.pago);
	const pendientes = conPago.filter((r) => r.pago?.estado === "pendiente");
	const pagadas = conPago.filter((r) => r.pago?.estado === "aprobado");
	const paquetesPendientes = comprasPaquetes.filter((p) => p.pago?.estado === "pendiente");
	const paquetesPagados = comprasPaquetes.filter((p) => p.pago?.estado === "aprobado");
	const iniciarPago = async () => {
		if (!selected) return;
		setLoadingPay(true);
		try {
			const endpoint = method === "paypal" ? `/pagos/reserva/${selected.reserva_id}/paypal` : `/pagos/reserva/${selected.reserva_id}/presencial`;
			const res = await api.post(endpoint, {}, token);
			if (method === "paypal" && res.approval_url) {
				window.location.href = res.approval_url;
				return;
			}
			setReservas((prev) => prev.map((r) => r.reserva_id === selected.reserva_id ? {
				...r,
				pago: {
					...r.pago,
					estado: "aprobado"
				}
			} : r));
			setSelected(null);
			toast.success("Pago registrado correctamente");
		} catch (e) {
			toast.error(e.message ?? "Error al procesar el pago");
		} finally {
			setLoadingPay(false);
		}
	};
	const openModal = (r) => {
		setSelected(r);
		setMethod("presencial");
	};
	const totalPendienteReservas = pendientes.reduce((acc, r) => acc + Number(r.servicio.precio), 0);
	const totalPendientePaquetes = paquetesPendientes.reduce((acc, p) => acc + Number(p.paquete.precio_total), 0);
	if (loading) return /* @__PURE__ */ jsx("p", {
		className: "p-8 text-ink-muted",
		children: "Cargando..."
	});
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(ToastContainer, {
			position: "top-right",
			autoClose: 3500,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "p-4 md:p-8 max-w-4xl mx-auto",
			children: [
				/* @__PURE__ */ jsx("nav", {
					className: "text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold",
					children: "Cliente"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink mb-6",
					children: "Pagos"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-4 mb-8",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl p-5",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Pendiente"
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-3xl font-bold text-ink",
							children: ["$", totalPendienteReservas + totalPendientePaquetes]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl p-5",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Pagadas"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-3xl font-bold text-ink",
							children: pagadas.length + paquetesPagados.length
						})]
					})]
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold text-ink mb-3",
					children: "Reservas pendientes de pago"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-3 mb-10",
					children: [
						pendientes.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "No hay pagos pendientes"
						}) : pendientes.map((r) => /* @__PURE__ */ jsxs("div", {
							className: "flex justify-between items-center border border-border rounded-2xl p-4 bg-surface",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("p", {
									className: "font-semibold text-ink",
									children: r.servicio.nombre
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted",
									children: [
										r.servicio.profesional_nombre,
										" · ",
										r.fecha,
										" ",
										r.hora.slice(0, 5)
									]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-sm font-bold text-ink mt-1",
									children: ["$", r.servicio.precio]
								})
							] }), /* @__PURE__ */ jsx("button", {
								onClick: () => openModal(r),
								className: "bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer text-sm font-medium",
								children: "Pagar"
							})]
						}, r.reserva_id)),
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-ink mb-3 mt-8",
							children: "Paquetes pendientes de pago"
						}),
						paquetesPendientes.map((compra) => /* @__PURE__ */ jsxs("div", {
							className: "flex justify-between items-center border border-border rounded-2xl p-4 bg-surface",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("p", {
									className: "font-semibold text-ink",
									children: compra.paquete.nombre
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted",
									children: ["Compra #", compra.compra_paquete_id]
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-sm font-bold text-ink mt-1",
									children: ["$", compra.paquete.precio_total]
								})
							] }), /* @__PURE__ */ jsx("button", {
								onClick: () => navigate(`/client/compra-package/${compra.compra_paquete_id}/pay`),
								className: "bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors",
								children: "Completar pago"
							})]
						}, compra.compra_paquete_id))
					]
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold text-ink mb-3",
					children: "Historial de reservas"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "border border-border rounded-2xl overflow-x-auto",
					children: /* @__PURE__ */ jsxs("div", {
						style: { minWidth: "520px" },
						children: [/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-12 px-5 py-3 border-b border-border text-xs font-bold text-ink-muted uppercase bg-bg",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: "Fecha"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-4",
									children: "Servicio"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-3",
									children: "Profesional"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: "Monto"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-1",
									children: "Estado"
								})
							]
						}), conPago.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "px-5 py-6 text-sm text-ink-muted bg-surface",
							children: "Sin registros"
						}) : conPago.map((r) => /* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-12 px-5 py-4 border-b border-border items-center last:border-0 bg-surface",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2 text-sm text-ink-muted",
									children: r.fecha
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-4 text-sm text-ink",
									children: r.servicio.nombre
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-3 text-sm text-ink-muted",
									children: r.servicio.profesional_nombre
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "col-span-2 font-bold text-ink",
									children: ["$", r.servicio.precio]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-1",
									children: /* @__PURE__ */ jsx("span", {
										className: badgeCls$2[r.pago?.estado ?? "pendiente"],
										children: (r.pago?.estado ?? "pendiente").toUpperCase()
									})
								})
							]
						}, r.reserva_id))]
					})
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold text-ink mb-3 mt-8",
					children: "Historial de paquetes"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "border border-border rounded-2xl overflow-x-auto",
					children: /* @__PURE__ */ jsxs("div", {
						style: { minWidth: "400px" },
						children: [/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-12 px-5 py-3 border-b border-border text-xs font-bold text-ink-muted uppercase bg-bg",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "col-span-3",
									children: "Fecha"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-5",
									children: "Paquete"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: "Monto"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: "Estado"
								})
							]
						}), comprasPaquetes.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "px-5 py-6 text-sm text-ink-muted bg-surface",
							children: "Sin registros"
						}) : comprasPaquetes.map((compra) => /* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-12 px-5 py-4 border-b border-border items-center last:border-0 bg-surface",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "col-span-3 text-sm text-ink-muted",
									children: compra.fecha_compra
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-5 text-sm text-ink",
									children: compra.paquete.nombre
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "col-span-2 font-bold text-ink",
									children: ["$", compra.paquete.precio_total]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: /* @__PURE__ */ jsx("span", {
										className: badgeCls$2[compra.pago?.estado ?? "pendiente"],
										children: (compra.pago?.estado ?? "pendiente").toUpperCase()
									})
								})
							]
						}, compra.compra_paquete_id))]
					})
				})
			]
		}),
		selected && /* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
			onClick: () => setSelected(null),
			children: /* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded-2xl p-6 w-full max-w-[480px] mx-4 space-y-4",
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-ink",
						children: "Método de pago"
					}),
					/* @__PURE__ */ jsxs("label", {
						className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "paypal" ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-bg"}`,
						children: [
							/* @__PURE__ */ jsx("input", {
								type: "radio",
								checked: method === "paypal",
								onChange: () => setMethod("paypal"),
								className: "cursor-pointer"
							}),
							/* @__PURE__ */ jsx(PayPalLogo, {}),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-ink",
								children: "Pago online seguro"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted",
								children: "Redirección automática a PayPal"
							})] })
						]
					}),
					/* @__PURE__ */ jsxs("label", {
						className: `flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${method === "presencial" ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-bg"}`,
						children: [
							/* @__PURE__ */ jsx("input", {
								type: "radio",
								checked: method === "presencial",
								onChange: () => setMethod("presencial"),
								className: "cursor-pointer"
							}),
							/* @__PURE__ */ jsx(CashIcon, {}),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-ink",
								children: "Pago presencial"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted",
								children: "El profesional confirma el pago"
							})] })
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "border-t border-border pt-4 flex items-end justify-between",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Total a pagar"
						}), /* @__PURE__ */ jsxs("p", {
							className: "text-2xl font-display text-ink",
							children: ["$", selected.servicio.precio]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-3 pt-1",
						children: [/* @__PURE__ */ jsx("button", {
							onClick: () => setSelected(null),
							className: "flex-1 border border-border rounded-xl py-2 text-sm font-medium text-ink hover:bg-bg transition-colors cursor-pointer",
							children: "Cancelar"
						}), /* @__PURE__ */ jsx("button", {
							onClick: iniciarPago,
							disabled: loadingPay,
							className: "flex-1 bg-primary text-white rounded-xl py-2 text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer",
							children: loadingPay ? "Procesando..." : "Confirmar pago"
						})]
					})
				]
			})
		})
	] });
});
//#endregion
//#region app/routes/client/notifications.tsx
var notifications_exports$1 = /* @__PURE__ */ __exportAll({ default: () => notifications_default$1 });
var notifications_default$1 = UNSAFE_withComponentProps(function NotificationsPage() {
	const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead } = useGlobalNotifications();
	useEffect(() => {
		const init = async () => {
			try {
				await loadNotifications();
			} catch (err) {
				console.error("Error cargando notificaciones", err);
			}
		};
		init();
	}, [loadNotifications]);
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink",
				children: "Notificaciones"
			}), /* @__PURE__ */ jsxs("p", {
				className: "text-ink-muted mt-1",
				children: [
					notifications.length,
					" notificaciones · ",
					unreadCount,
					" sin leer"
				]
			})] }), /* @__PURE__ */ jsx("button", {
				onClick: markAllAsRead,
				className: "self-start sm:self-auto text-sm font-semibold border px-4 py-2 rounded bg-surface hover:bg-bg transition",
				children: "✓ Marcar todas como leídas"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8",
			children: [/* @__PURE__ */ jsx("div", {
				className: "lg:col-span-2 space-y-3",
				children: notifications.length === 0 ? /* @__PURE__ */ jsx("div", {
					className: "border rounded p-6 text-center",
					children: /* @__PURE__ */ jsx("p", {
						className: "text-ink-muted",
						children: "No hay notificaciones todavía"
					})
				}) : notifications.map((n) => /* @__PURE__ */ jsx("div", {
					className: `border rounded p-4 transition ${n.read_at ? "opacity-60" : "bg-surface"}`,
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-10 h-10 rounded bg-accent/20 flex items-center justify-center",
							children: /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-ink" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ jsx("p", {
										className: "font-semibold text-sm",
										children: n.data?.type ?? "Notificación"
									}), !n.read_at && /* @__PURE__ */ jsx("button", {
										onClick: () => markAsRead(n.id),
										className: "text-xs text-blue-500",
										children: "Marcar leída"
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink-muted mt-1",
									children: n.data?.message ?? ""
								}),
								n.data?.reserva_id && /* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted mt-2",
									children: ["Reserva #", n.data.reserva_id]
								}),
								n.read_at && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-green-600 mt-2",
									children: "Leída"
								})
							]
						})]
					})
				}, n.id))
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "border rounded p-5",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-semibold mb-2",
							children: "Resumen"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ jsx("span", { children: "Total" }), /* @__PURE__ */ jsx("span", { children: notifications.length })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between text-red-500",
							children: [/* @__PURE__ */ jsx("span", { children: "Sin leer" }), /* @__PURE__ */ jsx("span", { children: unreadCount })]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "border rounded p-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase mb-3",
						children: "Últimas"
					}), notifications.slice(0, 5).map((n) => /* @__PURE__ */ jsx("div", {
						className: "py-2 border-b last:border-0",
						children: /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold truncate",
							children: n.data?.message ?? ""
						})
					}, n.id))]
				})]
			})]
		})]
	});
});
//#endregion
//#region app/routes/client/mis-reservas.tsx
var mis_reservas_exports = /* @__PURE__ */ __exportAll({ default: () => mis_reservas_default });
var ESTADO_STYLE = {
	pendiente: {
		label: "Pendiente",
		cls: "bg-amber-50 text-amber-700 border-amber-200"
	},
	confirmada: {
		label: "Confirmada",
		cls: "bg-blue-50 text-blue-700 border-blue-200"
	},
	pagada: {
		label: "Pagada",
		cls: "bg-green-50 text-green-700 border-green-200"
	},
	en_curso: {
		label: "En curso",
		cls: "bg-violet-50 text-violet-700 border-violet-200"
	},
	cancelada: {
		label: "Cancelada",
		cls: "bg-red-50 text-red-400 border-red-200"
	},
	finalizada: {
		label: "Finalizada",
		cls: "bg-surface text-ink-muted border-border"
	},
	no_asistida: {
		label: "No asistida",
		cls: "bg-red-50 text-red-400 border-red-200"
	},
	realizada: {
		label: "No aceptada",
		cls: "bg-green-50 text-green-600 border-green-200"
	}
};
var TERMINAL = new Set([
	"cancelada",
	"finalizada",
	"no_asistida",
	"no aceptada"
]);
var MONTH_NAMES$1 = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic"
];
function formatTime(timeStr) {
	return timeStr.slice(0, 5);
}
var FILTERS = [
	"Todas",
	"Próximas",
	"Pasadas",
	"Canceladas"
];
var mis_reservas_default = UNSAFE_withComponentProps(function MisReservas() {
	const { token } = useAuth();
	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [filter, setFilter] = useState("Próximas");
	const [cancelling, setCancelling] = useState(null);
	const [confirmingCancel, setConfirmingCancel] = useState(null);
	const [showCalificacion, setShowCalificacion] = useState(false);
	const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
	const [puntuacion, setPuntuacion] = useState(5);
	const [comentario, setComentario] = useState("");
	const [cancelSuccess, setCancelSuccess] = useState(false);
	const today = /* @__PURE__ */ new Date();
	today.setHours(0, 0, 0, 0);
	useEffect(() => {
		if (!token) return;
		setLoading(true);
		api.get("/mis-reservas", token).then((res) => {
			if (res.success) setReservas(res.data);
		}).catch((e) => setError(e.message ?? "Error al cargar reservas")).finally(() => setLoading(false));
	}, [token]);
	const filtered = reservas.filter((r) => {
		const [y, m, d] = r.fecha.split("-").map(Number);
		const past = new Date(y, m - 1, d) < today;
		const cancelled = r.estado === "cancelada" || r.estado === "no_asistida";
		if (filter === "Próximas") return !past && !cancelled;
		if (filter === "Pasadas") return past && !cancelled;
		if (filter === "Canceladas") return cancelled;
		return true;
	});
	const handleCancel = async () => {
		if (confirmingCancel === null) return;
		const id = confirmingCancel;
		setCancelling(id);
		try {
			await api.put(`/reservas/${id}/cancelar`, {}, token);
			setReservas((prev) => prev.map((r) => r.reserva_id === id ? {
				...r,
				estado: "cancelada"
			} : r));
			setCancelling(null);
			setCancelSuccess(true);
			setTimeout(() => {
				setConfirmingCancel(null);
				setCancelSuccess(false);
			}, 6e3);
		} catch (e) {
			setCancelling(null);
			setConfirmingCancel(null);
		}
	};
	const abrirModalCalificacion = (reserva) => {
		setReservaSeleccionada(reserva);
		setPuntuacion(5);
		setComentario("");
		setShowCalificacion(true);
	};
	const guardarCalificacion = async () => {
		if (!reservaSeleccionada) return;
		try {
			const response = await api.post(`/reservas/${reservaSeleccionada.reserva_id}/calificar`, {
				puntuacion,
				comentario
			}, token);
			if (!response.success) {
				toast.error(response.message);
				return;
			}
			const nuevaCalificacion = response.data;
			setReservas((prev) => prev.map((r) => r.reserva_id === reservaSeleccionada.reserva_id ? {
				...r,
				calificacion: nuevaCalificacion
			} : r));
			console.log("RESPUESTA:", response);
			toast.success("Calificación enviada");
			setShowCalificacion(false);
		} catch (e) {
			toast.error(e.message ?? "Error al enviar la calificación");
		}
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(ToastContainer, {
			position: "top-right",
			autoClose: 3500,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true
		}),
		confirmingCancel !== null && /* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
			onClick: () => {
				setConfirmingCancel(null);
				setCancelSuccess(false);
			},
			children: /* @__PURE__ */ jsx("div", {
				className: "bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border",
				onClick: (e) => e.stopPropagation(),
				children: cancelSuccess ? /* @__PURE__ */ jsxs("div", {
					className: "text-center space-y-3 py-4",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center",
							children: /* @__PURE__ */ jsx("ion-icon", {
								name: "checkmark-outline",
								style: {
									fontSize: "22px",
									color: "#22c55e"
								}
							})
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "font-semibold text-lg",
							children: "Reserva cancelada"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Cancelada correctamente. Contactá al profesional para gestionar el reembolso."
						})
					]
				}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col items-center gap-2 mb-5",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-1",
							children: /* @__PURE__ */ jsx("ion-icon", {
								name: "trash-outline",
								style: {
									fontSize: "22px",
									color: "#f87171"
								}
							})
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "font-display text-lg text-ink text-center",
							children: "¿Cancelar esta reserva?"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted text-center",
							children: "Esta acción no se puede deshacer. La reserva quedará cancelada permanentemente."
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => setConfirmingCancel(null),
						className: "flex-1 px-4 py-2 rounded-xl border border-border text-ink text-sm font-medium hover:bg-surface transition-colors",
						children: "Volver"
					}), /* @__PURE__ */ jsx("button", {
						onClick: handleCancel,
						className: "flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors",
						children: "Sí, cancelar"
					})]
				})] })
			})
		}),
		showCalificacion && /* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
			onClick: () => setShowCalificacion(false),
			children: /* @__PURE__ */ jsxs("div", {
				className: "bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-border",
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-semibold mb-4",
						children: "Calificar servicio"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mb-4",
						children: [/* @__PURE__ */ jsx("label", {
							className: "block text-sm font-medium mb-2",
							children: "Puntuación"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex gap-2",
							children: [
								1,
								2,
								3,
								4,
								5
							].map((n) => /* @__PURE__ */ jsx("button", {
								onClick: () => setPuntuacion(n),
								className: `text-3xl ${n <= puntuacion ? "text-yellow-500" : "text-gray-300"}`,
								children: "★"
							}, n))
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mb-4",
						children: [/* @__PURE__ */ jsx("label", {
							className: "block text-sm font-medium mb-2",
							children: "Comentario"
						}), /* @__PURE__ */ jsx("textarea", {
							value: comentario,
							onChange: (e) => setComentario(e.target.value),
							rows: 4,
							className: "w-full border rounded-lg px-3 py-2",
							placeholder: "Contanos tu experiencia..."
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ jsx("button", {
							onClick: () => setShowCalificacion(false),
							className: "px-4 py-2 border rounded-lg",
							children: "Cancelar"
						}), /* @__PURE__ */ jsx("button", {
							onClick: guardarCalificacion,
							className: "px-4 py-2 bg-primary text-white rounded-lg",
							children: "Enviar"
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "p-6 max-w-3xl mx-auto",
			children: [
				/* @__PURE__ */ jsx("nav", {
					className: "text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold",
					children: "Cliente"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink mb-1",
					children: "Reservas"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-ink-muted text-sm mb-6",
					children: "Historial y estado de tus turnos."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex gap-2 mb-6 flex-wrap",
					children: FILTERS.map((f) => /* @__PURE__ */ jsx("button", {
						onClick: () => setFilter(f),
						className: `px-4 py-1.5 rounded-full text-sm font-medium transition-colors border cursor-pointer ${filter === f ? "bg-ink text-white border-ink" : "border-border text-ink-muted hover:border-primary/40 hover:text-ink"}`,
						children: f
					}, f))
				}),
				loading ? /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: [
						1,
						2,
						3
					].map((i) => /* @__PURE__ */ jsx("div", { className: "h-24 bg-surface border border-border rounded-2xl animate-pulse" }, i))
				}) : error ? /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col items-center py-16 text-center gap-3",
					children: [
						/* @__PURE__ */ jsx("ion-icon", {
							name: "cloud-offline-outline",
							style: {
								fontSize: "40px",
								color: "var(--color-ink-muted)"
							}
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-ink font-medium",
							children: "No se pudieron cargar las reservas"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Hubo un problema al conectar con el servidor. Intentá de nuevo."
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => window.location.reload(),
							className: "text-sm text-primary hover:underline cursor-pointer",
							children: "Reintentar"
						})
					]
				}) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col items-center py-20 text-center gap-3",
					children: [
						/* @__PURE__ */ jsx("ion-icon", {
							name: "calendar-outline",
							style: {
								fontSize: "40px",
								color: "var(--color-ink-muted)"
							}
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-ink font-medium",
							children: ["No hay reservas ", filter !== "Todas" ? filter.toLowerCase() : ""]
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/client/discover",
							className: "text-sm text-primary hover:underline",
							children: "Explorar profesionales"
						})
					]
				}) : /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: filtered.map((r) => {
						const [ry, rm, rd] = r.fecha.split("-").map(Number);
						const isPast = new Date(ry, rm - 1, rd) < today;
						const puedeCalificar = isPast && r.estado === "finalizada" && !r.calificacion;
						const canReschedule = ["confirmada", "pagada"].includes(r.estado) && !isPast;
						const isCancelled = r.estado === "cancelada" || r.estado === "no_asistida";
						const displayEstado = isPast && !TERMINAL.has(r.estado) ? "no aceptada" : r.estado;
						const badge = ESTADO_STYLE[displayEstado] ?? {
							label: displayEstado,
							cls: "bg-surface text-ink-muted border-border"
						};
						const canCancel = ["pendiente", "confirmada"].includes(r.estado) && !isPast;
						return /* @__PURE__ */ jsxs("div", {
							className: `bg-surface border border-border rounded-2xl p-4 flex items-start gap-4 transition-opacity ${isCancelled ? "opacity-50" : ""}`,
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "shrink-0 w-14 flex flex-col items-center bg-bg border border-border rounded-xl py-2",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted uppercase",
											children: MONTH_NAMES$1[Number(r.fecha.split("-")[1]) - 1]
										}),
										/* @__PURE__ */ jsx("span", {
											className: `text-2xl font-bold leading-tight ${isCancelled ? "text-ink-muted" : "text-ink"}`,
											children: Number(r.fecha.split("-")[2])
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted",
											children: formatTime(r.hora)
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-start justify-between gap-2 mb-1",
											children: [/* @__PURE__ */ jsx("p", {
												className: `text-sm font-semibold ${isCancelled ? "text-ink-muted line-through" : "text-ink"}`,
												children: r.servicio?.nombre
											}), /* @__PURE__ */ jsx("span", {
												className: `shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${badge.cls}`,
												children: badge.label
											})]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted mb-1",
											children: r.servicio?.profesional_nombre
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-3 text-xs text-ink-muted flex-wrap",
											children: [
												/* @__PURE__ */ jsxs("span", {
													className: "flex items-center gap-1",
													children: [
														/* @__PURE__ */ jsx("ion-icon", {
															name: "time-outline",
															style: { fontSize: "12px" }
														}),
														r.servicio?.duracion,
														" min"
													]
												}),
												/* @__PURE__ */ jsxs("span", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ jsx("ion-icon", {
														name: r.servicio?.modalidad === "virtual" ? "desktop-outline" : "location-outline",
														style: { fontSize: "12px" }
													}), r.servicio?.modalidad]
												}),
												/* @__PURE__ */ jsxs("span", {
													className: `font-semibold ${isCancelled ? "text-ink-muted" : "text-ink"}`,
													children: ["$ ", Number(r.servicio?.precio).toFixed(0)]
												})
											]
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "shrink-0 flex flex-col gap-2",
									children: [canReschedule && /* @__PURE__ */ jsx(Link, {
										to: `/client/professional/${r.servicio.profesional_id}?reprogramar=${r.reserva_id}`,
										className: "px-3 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg text-xs",
										children: "Reprogramar"
									}), canCancel && /* @__PURE__ */ jsx("button", {
										onClick: () => setConfirmingCancel(r.reserva_id),
										disabled: cancelling === r.reserva_id,
										title: "Cancelar reserva",
										className: "w-full px-3 py-2 text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-xs transition-colors disabled:opacity-50",
										children: cancelling === r.reserva_id ? /* @__PURE__ */ jsx("ion-icon", {
											name: "hourglass-outline",
											style: { fontSize: "16px" }
										}) : /* @__PURE__ */ jsx("ion-icon", {
											name: "trash-outline",
											style: { fontSize: "16px" }
										})
									})]
								}),
								puedeCalificar && /* @__PURE__ */ jsx("button", {
									onClick: () => abrirModalCalificacion(r),
									className: "px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs",
									children: "Calificar"
								})
							]
						}, r.reserva_id);
					})
				})
			]
		})
	] });
});
//#endregion
//#region app/routes/client/profile.tsx
var profile_exports$1 = /* @__PURE__ */ __exportAll({ default: () => profile_default$1 });
function getInitials$3(name) {
	return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
var profile_default$1 = UNSAFE_withComponentProps(function ClientProfile() {
	const { user, token, updateUser } = useAuth();
	const [name, setName] = useState(user?.name ?? "");
	const [email, setEmail] = useState(user?.email ?? "");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [savingPwd, setSavingPwd] = useState(false);
	const [infoMsg, setInfoMsg] = useState(null);
	const [pwdMsg, setPwdMsg] = useState(null);
	const handleSaveInfo = async (e) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) return;
		setSaving(true);
		setInfoMsg(null);
		try {
			await api.put("/client/profile", {
				name: name.trim(),
				email: email.trim()
			}, token);
			updateUser({
				name: name.trim(),
				email: email.trim(),
				initials: getInitials$3(name.trim())
			});
			setInfoMsg({
				type: "ok",
				text: "Datos actualizados correctamente."
			});
		} catch (err) {
			setInfoMsg({
				type: "err",
				text: err.message ?? "Error al guardar."
			});
		} finally {
			setSaving(false);
		}
	};
	const handleSavePassword = async (e) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			setPwdMsg({
				type: "err",
				text: "Las contraseñas no coinciden."
			});
			return;
		}
		if (newPassword.length < 8) {
			setPwdMsg({
				type: "err",
				text: "La contraseña debe tener al menos 8 caracteres."
			});
			return;
		}
		setSavingPwd(true);
		setPwdMsg(null);
		try {
			await api.put("/profile/password", {
				current_password: currentPassword,
				password: newPassword,
				password_confirmation: confirmPassword
			}, token);
			setPwdMsg({
				type: "ok",
				text: "Contraseña actualizada."
			});
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err) {
			setPwdMsg({
				type: "err",
				text: err.message ?? "Error al cambiar contraseña."
			});
		} finally {
			setSavingPwd(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-2xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink mb-1",
				children: "Mi perfil"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-ink-muted mb-8",
				children: "Gestiona tu información personal"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-5 mb-10",
				children: [/* @__PURE__ */ jsx("div", {
					className: "w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-ink text-2xl font-bold",
					children: getInitials$3(name) || user?.initials || "?"
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "font-semibold text-ink text-lg",
					children: name || user?.name
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-ink-muted",
					children: "Cliente"
				})] })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-6 mb-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-semibold text-ink mb-4",
					children: "Información personal"
				}), /* @__PURE__ */ jsxs("form", {
					onSubmit: handleSaveInfo,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Nombre"
						}), /* @__PURE__ */ jsx("input", {
							type: "text",
							value: name,
							onChange: (e) => setName(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Correo electrónico"
						}), /* @__PURE__ */ jsx("input", {
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						infoMsg && /* @__PURE__ */ jsx("p", {
							className: `text-sm ${infoMsg.type === "ok" ? "text-green-600" : "text-red-500"}`,
							children: infoMsg.text
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex justify-end pt-2",
							children: /* @__PURE__ */ jsx("button", {
								type: "submit",
								disabled: saving,
								className: "bg-ink text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity",
								children: saving ? "Guardando..." : "Guardar cambios"
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-semibold text-ink mb-4",
					children: "Cambiar contraseña"
				}), /* @__PURE__ */ jsxs("form", {
					onSubmit: handleSavePassword,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Contraseña actual"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							value: currentPassword,
							onChange: (e) => setCurrentPassword(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Nueva contraseña"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							value: newPassword,
							onChange: (e) => setNewPassword(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Confirmar nueva contraseña"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							value: confirmPassword,
							onChange: (e) => setConfirmPassword(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						pwdMsg && /* @__PURE__ */ jsx("p", {
							className: `text-sm ${pwdMsg.type === "ok" ? "text-green-600" : "text-red-500"}`,
							children: pwdMsg.text
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex justify-end pt-2",
							children: /* @__PURE__ */ jsx("button", {
								type: "submit",
								disabled: savingPwd,
								className: "bg-ink text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity",
								children: savingPwd ? "Actualizando..." : "Cambiar contraseña"
							})
						})
					]
				})]
			})
		]
	});
});
//#endregion
//#region app/components/ProfessionalSidebar.tsx
var navItems$1 = [
	{
		to: "/professional/dashboard",
		label: "Resumen",
		icon: HomeIcon
	},
	{
		to: "/professional",
		label: "Clientes",
		icon: CalendarIcon,
		end: true
	},
	{
		to: "/professional/services",
		label: "Servicios",
		icon: PackageIcon
	},
	{
		to: "/professional/service-packages",
		label: "Paquetes",
		icon: BoxesIcon
	},
	{
		to: "/professional/availability",
		label: "Disponibilidad",
		icon: ClockIcon
	},
	{
		to: "/professional/payments",
		label: "Cobros",
		icon: CardIcon
	},
	{
		to: "/professional/notifications",
		label: "Notificaciones",
		icon: BellIcon
	}
];
function ProfessionalSidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }) {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { unreadCount } = useGlobalNotifications();
	const effectiveCollapsed = collapsed && !isMobileOpen;
	return /* @__PURE__ */ jsxs(Fragment, { children: [isMobileOpen && /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 bg-black/50 z-40 md:hidden",
		onClick: onMobileClose
	}), /* @__PURE__ */ jsxs("aside", {
		className: [
			"flex flex-col bg-sidebar shrink-0 transition-all duration-200 ease-in-out overflow-y-auto",
			"fixed inset-y-0 left-0 z-50",
			"w-72",
			isMobileOpen ? "translate-x-0" : "-translate-x-full",
			"md:relative md:inset-y-auto md:left-auto md:z-auto",
			"md:translate-x-0",
			collapsed ? "md:w-14" : "md:w-56",
			"md:min-h-screen"
		].join(" "),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "p-4 border-b border-white/10",
				children: [/* @__PURE__ */ jsxs("div", {
					className: `flex items-center ${effectiveCollapsed ? "justify-center" : "justify-between"}`,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-ink font-bold text-xs",
								children: "+"
							})
						}), !effectiveCollapsed && /* @__PURE__ */ jsx("span", {
							className: "font-display text-sidebar-text text-lg tracking-tight",
							children: "Cita.Pro"
						})]
					}), !effectiveCollapsed && /* @__PURE__ */ jsx("button", {
						onClick: isMobileOpen ? onMobileClose : onToggle,
						title: isMobileOpen ? "Cerrar menú" : "Contraer menú",
						className: "text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors",
						children: /* @__PURE__ */ jsx(ChevronLeftIcon$1, { className: "w-4 h-4" })
					})]
				}), effectiveCollapsed && /* @__PURE__ */ jsx("div", {
					className: "flex justify-center mt-3",
					children: /* @__PURE__ */ jsx("button", {
						onClick: onToggle,
						title: "Expandir menú",
						className: "text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors",
						children: /* @__PURE__ */ jsx(ChevronRightIcon$1, { className: "w-4 h-4" })
					})
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "flex-1 p-2 space-y-0.5",
				children: navItems$1.map(({ to, label, icon: Icon, end }) => /* @__PURE__ */ jsxs(NavLink, {
					to,
					end,
					title: effectiveCollapsed ? label : void 0,
					onClick: isMobileOpen ? onMobileClose : void 0,
					className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${effectiveCollapsed ? "justify-center px-0" : ""} ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`,
					children: [
						/* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 shrink-0" }),
						!effectiveCollapsed && /* @__PURE__ */ jsx("span", {
							className: "flex-1",
							children: label
						}),
						to === "/professional/notifications" && unreadCount > 0 && !effectiveCollapsed && /* @__PURE__ */ jsx("span", {
							className: "ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full",
							children: unreadCount
						})
					]
				}, to))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "p-3 border-t border-white/10",
				children: effectiveCollapsed ? /* @__PURE__ */ jsx("div", {
					className: "flex justify-center py-1",
					children: /* @__PURE__ */ jsx("button", {
						onClick: () => navigate("/professional/profile"),
						title: user?.name ?? "Profesional",
						className: "w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-ink text-xs font-bold hover:ring-2 hover:ring-white/40 transition-all",
						children: user?.initials ?? "MO"
					})
				}) : /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 px-3 py-2",
					children: [
						/* @__PURE__ */ jsx("button", {
							onClick: () => {
								navigate("/professional/profile");
								if (isMobileOpen) onMobileClose();
							},
							title: "Editar perfil",
							className: "w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-ink text-xs font-bold shrink-0 hover:ring-2 hover:ring-white/40 transition-all",
							children: user?.initials ?? "MO"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-medium text-sidebar-text truncate",
								children: user?.name ?? "Profesional"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-sidebar-muted",
								children: "Profesional"
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: async () => {
								await logout();
								navigate("/login");
							},
							title: "Cerrar sesión",
							className: "text-sidebar-muted hover:text-sidebar-text transition-colors",
							children: /* @__PURE__ */ jsx(LogoutIcon, { className: "w-4 h-4" })
						})
					]
				})
			})
		]
	})] });
}
function HomeIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }), /* @__PURE__ */ jsx("polyline", { points: "9 22 9 12 15 12 15 22" })]
	});
}
function CalendarIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "3",
				y: "4",
				width: "18",
				height: "18",
				rx: "2"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "16",
				y1: "2",
				x2: "16",
				y2: "6"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "8",
				y1: "2",
				x2: "8",
				y2: "6"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "10",
				x2: "21",
				y2: "10"
			})
		]
	});
}
function PackageIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
			/* @__PURE__ */ jsx("polyline", { points: "3.29 7 12 12 20.71 7" }),
			/* @__PURE__ */ jsx("line", {
				x1: "12",
				y1: "22",
				x2: "12",
				y2: "12"
			})
		]
	});
}
function BoxesIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: "3",
				y: "3",
				width: "7",
				height: "7",
				rx: "1"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "14",
				y: "3",
				width: "7",
				height: "7",
				rx: "1"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "3",
				y: "14",
				width: "7",
				height: "7",
				rx: "1"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "14",
				y: "14",
				width: "7",
				height: "7",
				rx: "1"
			})
		]
	});
}
function ClockIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}), /* @__PURE__ */ jsx("polyline", { points: "12 6 12 12 16 14" })]
	});
}
function CardIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("rect", {
			x: "1",
			y: "4",
			width: "22",
			height: "16",
			rx: "2"
		}), /* @__PURE__ */ jsx("line", {
			x1: "1",
			y1: "10",
			x2: "23",
			y2: "10"
		})]
	});
}
function BellIcon({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("path", { d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 1-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" })
	});
}
function LogoutIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
			/* @__PURE__ */ jsx("polyline", { points: "16 17 21 12 16 7" }),
			/* @__PURE__ */ jsx("line", {
				x1: "21",
				y1: "12",
				x2: "9",
				y2: "12"
			})
		]
	});
}
function ChevronLeftIcon$1({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("polyline", { points: "15 18 9 12 15 6" })
	});
}
function ChevronRightIcon$1({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("polyline", { points: "9 18 15 12 9 6" })
	});
}
//#endregion
//#region app/routes/professional/_layout.tsx
var _layout_exports$1 = /* @__PURE__ */ __exportAll({ default: () => _layout_default$1 });
var _layout_default$1 = UNSAFE_withComponentProps(function ProfessionalLayout() {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	useEffect(() => {
		if (!isLoading && !user) navigate("/login", { replace: true });
		if (!isLoading && user && user.role === "client") navigate("/client", { replace: true });
	}, [
		user,
		isLoading,
		navigate
	]);
	if (isLoading) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-bg",
		children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" })
	});
	return /* @__PURE__ */ jsx(NotificationProvider, {
		userId: user?.id,
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex min-h-screen bg-bg",
			children: [/* @__PURE__ */ jsx(ProfessionalSidebar, {
				collapsed: sidebarCollapsed,
				onToggle: () => setSidebarCollapsed((v) => !v),
				isMobileOpen: mobileOpen,
				onMobileClose: () => setMobileOpen(false)
			}), /* @__PURE__ */ jsxs("main", {
				className: "flex-1 overflow-auto min-w-0",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "sticky top-0 z-30 flex md:hidden items-center justify-between bg-sidebar px-4 py-3 border-b border-white/10",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-sm bg-surface flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-ink font-bold text-xs",
								children: "+"
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "font-display text-sidebar-text text-lg tracking-tight",
							children: "Cita.Pro"
						})]
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setMobileOpen(true),
						className: "text-sidebar-text p-1.5 rounded-lg hover:bg-white/10 transition-colors",
						"aria-label": "Abrir menú",
						children: /* @__PURE__ */ jsx(MenuIcon, { className: "w-5 h-5" })
					})]
				}), /* @__PURE__ */ jsx(Outlet, {})]
			})]
		})
	});
});
function MenuIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "6",
				x2: "21",
				y2: "6"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "12",
				x2: "21",
				y2: "12"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "3",
				y1: "18",
				x2: "21",
				y2: "18"
			})
		]
	});
}
//#endregion
//#region app/routes/professional/clients.tsx
var clients_exports = /* @__PURE__ */ __exportAll({ default: () => clients_default });
var HOURS$1 = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);
var CELL = 44;
var GRID_START$1 = 8;
var ESTADO_COLOR = {
	pendiente: "bg-amber-100  border-l-4 border-amber-400",
	confirmada: "bg-blue-100   border-l-4 border-blue-400",
	pagada: "bg-green-100  border-l-4 border-green-500",
	en_curso: "bg-violet-100 border-l-4 border-violet-500",
	finalizada: "bg-gray-50    border-l-4 border-gray-300"
};
var ESTADO_BADGE = {
	pendiente: "bg-amber-100 text-amber-800",
	confirmada: "bg-blue-100  text-blue-800",
	pagada: "bg-green-100 text-green-800",
	en_curso: "bg-violet-100 text-violet-800",
	finalizada: "bg-gray-100  text-gray-600"
};
var ESTADO_LABEL = {
	pendiente: "Pendiente",
	confirmada: "Confirmada",
	pagada: "Pagada",
	en_curso: "En curso",
	finalizada: "Finalizada"
};
var MONTH_NAMES = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic"
];
var DOW_LABELS = [
	"lun",
	"mar",
	"mié",
	"jue",
	"vie",
	"sáb",
	"dom"
];
var CLIENT_COLORS = [
	{
		avatar: "bg-violet-500",
		accent: "border-violet-300",
		block: "bg-violet-100 border-l-4 border-violet-500"
	},
	{
		avatar: "bg-orange-500",
		accent: "border-orange-300",
		block: "bg-orange-100 border-l-4 border-orange-500"
	},
	{
		avatar: "bg-teal-500",
		accent: "border-teal-300",
		block: "bg-teal-100   border-l-4 border-teal-500"
	},
	{
		avatar: "bg-rose-500",
		accent: "border-rose-300",
		block: "bg-rose-100   border-l-4 border-rose-500"
	},
	{
		avatar: "bg-amber-500",
		accent: "border-amber-300",
		block: "bg-amber-100  border-l-4 border-amber-500"
	}
];
function getWeekDates(monday) {
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(monday);
		d.setDate(d.getDate() + i);
		return d;
	});
}
function toMonday(date) {
	const d = new Date(date);
	const dow = d.getDay();
	d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
	d.setHours(0, 0, 0, 0);
	return d;
}
function toDateStr(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getInitials$2(nombre) {
	return nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
var clients_default = UNSAFE_withComponentProps(function ClientsAndAgenda() {
	const { token } = useAuth();
	const [reservas, setReservas] = useState([]);
	const [clientesProximos, setClientesProximos] = useState([]);
	const [clientesHistoricos, setClientesHistoricos] = useState([]);
	const [agendaLoading, setAgendaLoading] = useState(true);
	const [clientsLoading, setClientsLoading] = useState(true);
	const [weekStart, setWeekStart] = useState(() => toMonday(/* @__PURE__ */ new Date()));
	const [search, setSearch] = useState("");
	const [selectedClient, setSelectedClient] = useState(null);
	const [selectedReserva, setSelectedReserva] = useState(null);
	const [updatingId, setUpdatingId] = useState(null);
	const [actionMode, setActionMode] = useState("none");
	const [mobileStartDay, setMobileStartDay] = useState(0);
	const touchStartX = useRef(0);
	const fetchAgenda = () => {
		if (!token) return;
		setAgendaLoading(true);
		api.get("/mi-agenda", token).then((res) => {
			if (res.success) setReservas(res.data);
		}).catch(() => {}).finally(() => setAgendaLoading(false));
	};
	const fetchClientes = () => {
		if (!token) return;
		setClientsLoading(true);
		api.get("/clientes", token).then((data) => {
			setClientesProximos(data.proximos || []);
			setClientesHistoricos(data.historicos || []);
		}).catch(() => {
			setClientesProximos([]);
			setClientesHistoricos([]);
		}).finally(() => setClientsLoading(false));
	};
	useEffect(() => {
		setMobileStartDay(0);
	}, [weekStart]);
	useEffect(() => {
		if (!token) return;
		fetchAgenda();
		fetchClientes();
	}, [token]);
	useEffect(() => {
		if (!token) return;
		const handler = () => {
			console.log("CLIENTES REFRESH");
			fetchAgenda();
			fetchClientes();
		};
		window.addEventListener("reserva-updated", handler);
		return () => window.removeEventListener("reserva-updated", handler);
	}, [token]);
	const cambiarEstado = async (reservaId, estado) => {
		try {
			setUpdatingId(reservaId);
			await api.put(`/reservas/${reservaId}/estado`, { estado }, token);
			setReservas((prev) => prev.map((r) => r.reserva_id === reservaId ? {
				...r,
				estado
			} : r));
			if (selectedReserva?.reserva_id === reservaId) setSelectedReserva((prev) => prev ? {
				...prev,
				estado
			} : null);
		} catch (err) {
			console.error(err);
		} finally {
			setUpdatingId(null);
		}
	};
	const cancelarReserva = async (reservaId) => {
		console.log("CANCELAR RESERVA", reservaId);
		await api.put(`/reservas/${reservaId}/cancelar`, {}, token);
	};
	const weekDates = getWeekDates(weekStart);
	const todayStr = toDateStr(/* @__PURE__ */ new Date());
	const reservasByDay = {};
	for (const r of reservas) {
		if (!reservasByDay[r.fecha]) reservasByDay[r.fecha] = [];
		reservasByDay[r.fecha].push(r);
	}
	const weekLabel = (() => {
		const from = weekDates[0], to = weekDates[6];
		if (from.getMonth() === to.getMonth()) return `${from.getDate()}–${to.getDate()} ${MONTH_NAMES[from.getMonth()]} ${from.getFullYear()}`;
		return `${from.getDate()} ${MONTH_NAMES[from.getMonth()]} – ${to.getDate()} ${MONTH_NAMES[to.getMonth()]} ${to.getFullYear()}`;
	})();
	[...clientesProximos, ...clientesHistoricos].filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
	const clientColorMap = {};
	[...clientesProximos, ...clientesHistoricos].forEach((c, i) => {
		clientColorMap[c.nombre] = CLIENT_COLORS[i % CLIENT_COLORS.length];
	});
	const clientReservas = selectedClient ? reservas.filter((r) => r.cliente_nombre === selectedClient.nombre) : [];
	const handleReservaClick = (r) => {
		const client = [...clientesProximos, ...clientesHistoricos].find((c) => c.nombre === r.cliente_nombre) ?? null;
		if (selectedReserva?.reserva_id === r.reserva_id) {
			setSelectedReserva(null);
			setSelectedClient(null);
		} else {
			setSelectedReserva(r);
			setSelectedClient(client);
		}
	};
	const handleClientClick = (c) => {
		if (selectedClient?.cliente_id === c.cliente_id && !selectedReserva) {
			setSelectedClient(null);
			setSelectedReserva(null);
		} else {
			setSelectedClient(c);
			setSelectedReserva(null);
		}
	};
	const closePanel = () => {
		setSelectedClient(null);
		setSelectedReserva(null);
	};
	const prevMobileDays = () => setMobileStartDay((d) => Math.max(0, d - 1));
	const nextMobileDays = () => setMobileStartDay((d) => Math.min(4, d + 1));
	const handleTouchStart = (e) => {
		touchStartX.current = e.touches[0].clientX;
	};
	const handleTouchEnd = (e) => {
		const delta = touchStartX.current - e.changedTouches[0].clientX;
		if (delta > 40) nextMobileDays();
		else if (delta < -40) prevMobileDays();
	};
	const mobileDays = weekDates.slice(mobileStartDay, mobileStartDay + 3);
	const panelOpen = !!selectedClient;
	const panelClientColor = selectedClient ? CLIENT_COLORS[Math.max([...clientesProximos, ...clientesHistoricos].findIndex((c) => c.cliente_id === selectedClient.cliente_id), 0) % CLIENT_COLORS.length] : CLIENT_COLORS[0];
	const filteredProximos = clientesProximos.filter((c) => `${c.nombre} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
	const filteredHistoricos = clientesHistoricos.filter((c) => `${c.nombre} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-6",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink",
				children: "Clientes"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-ink-muted mt-1",
				children: "Hacé click en un turno o cliente para ver detalles y gestionar reservas"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 lg:grid-cols-4 gap-6 items-start",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "lg:col-span-3 min-w-0 space-y-6",
				children: [/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between mb-3 flex-wrap gap-2",
					children: [/* @__PURE__ */ jsxs("h2", {
						className: "font-display text-xl text-ink",
						children: ["Agenda", /* @__PURE__ */ jsx("span", {
							className: "ml-2 text-sm font-normal text-ink-muted",
							children: weekLabel
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ jsx("button", {
								onClick: () => setWeekStart((d) => {
									const n = new Date(d);
									n.setDate(n.getDate() - 7);
									return n;
								}),
								className: "w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors cursor-pointer",
								children: /* @__PURE__ */ jsx(ChevronLeftIcon, {})
							}),
							/* @__PURE__ */ jsx("button", {
								onClick: () => setWeekStart((d) => {
									const n = new Date(d);
									n.setDate(n.getDate() + 7);
									return n;
								}),
								className: "w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted hover:bg-bg transition-colors cursor-pointer",
								children: /* @__PURE__ */ jsx(ChevronRightIcon, {})
							}),
							/* @__PURE__ */ jsx("button", {
								onClick: () => setWeekStart(toMonday(/* @__PURE__ */ new Date())),
								className: "px-3 py-1.5 text-xs font-semibold border border-border rounded hover:bg-bg text-ink-muted transition-colors cursor-pointer",
								children: "Hoy"
							})
						]
					})]
				}), agendaLoading ? /* @__PURE__ */ jsx("div", { className: "bg-surface border border-border rounded h-64 animate-pulse" }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:hidden",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-2 px-1",
							children: [
								/* @__PURE__ */ jsx("button", {
									onClick: prevMobileDays,
									disabled: mobileStartDay === 0,
									className: "w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted disabled:opacity-30 hover:bg-bg transition-colors",
									children: /* @__PURE__ */ jsx(ChevronLeftIcon, {})
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "text-sm font-medium text-ink",
									children: [
										DOW_LABELS[mobileDays[0].getDay() === 0 ? 6 : mobileDays[0].getDay() - 1],
										" ",
										mobileDays[0].getDate(),
										" – ",
										DOW_LABELS[mobileDays[2].getDay() === 0 ? 6 : mobileDays[2].getDay() - 1],
										" ",
										mobileDays[2].getDate()
									]
								}),
								/* @__PURE__ */ jsx("button", {
									onClick: nextMobileDays,
									disabled: mobileStartDay >= 4,
									className: "w-8 h-8 rounded border border-border flex items-center justify-center text-ink-muted disabled:opacity-30 hover:bg-bg transition-colors",
									children: /* @__PURE__ */ jsx(ChevronRightIcon, {})
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded overflow-hidden",
							onTouchStart: handleTouchStart,
							onTouchEnd: handleTouchEnd,
							children: [/* @__PURE__ */ jsxs("div", {
								className: "grid border-b border-border",
								style: { gridTemplateColumns: "48px repeat(3, 1fr)" },
								children: [/* @__PURE__ */ jsx("div", { className: "border-r border-border" }), mobileDays.map((d, i) => {
									const str = toDateStr(d);
									const isToday = str === todayStr;
									const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
									return /* @__PURE__ */ jsxs("div", {
										className: `border-r border-border last:border-r-0 flex flex-col items-center justify-center py-2 min-h-[52px] ${isToday ? "bg-accent/10" : ""}`,
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted uppercase tracking-wide font-semibold",
												children: DOW_LABELS[dow]
											}),
											isToday ? /* @__PURE__ */ jsx("span", {
												className: "inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full bg-ink text-white text-xs font-bold",
												children: d.getDate()
											}) : /* @__PURE__ */ jsx("p", {
												className: "text-sm font-bold text-ink mt-0.5",
												children: d.getDate()
											}),
											reservasByDay[str]?.length > 0 && /* @__PURE__ */ jsxs("p", {
												className: "text-xs text-ink-muted mt-0.5",
												children: [reservasByDay[str].length, "t"]
											})
										]
									}, str);
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "relative grid",
								style: { gridTemplateColumns: "48px repeat(3, 1fr)" },
								children: [/* @__PURE__ */ jsx("div", {
									className: "border-r border-border",
									children: HOURS$1.map((h) => /* @__PURE__ */ jsx("div", {
										className: "border-b border-border/30 flex items-center justify-center px-1",
										style: { height: CELL },
										children: /* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted",
											children: h
										})
									}, h))
								}), mobileDays.map((d) => {
									const str = toDateStr(d);
									const isToday = str === todayStr;
									const dayRes = reservasByDay[str] ?? [];
									return /* @__PURE__ */ jsxs("div", {
										className: `relative border-r border-border last:border-r-0 ${isToday ? "bg-accent/5" : ""}`,
										children: [HOURS$1.map((_, hi) => /* @__PURE__ */ jsx("div", {
											className: "border-b border-border/20",
											style: { height: CELL }
										}, hi)), dayRes.map((r) => {
											const [hh, mm] = r.hora.split(":").map(Number);
											const topH = hh + mm / 60 - GRID_START$1;
											const durH = (r.servicio?.duracion ?? 60) / 60;
											return /* @__PURE__ */ jsx("div", {
												onClick: () => handleReservaClick(r),
												className: `absolute left-0.5 right-0.5 ${clientColorMap[r.cliente_nombre]?.block ?? ESTADO_COLOR[r.estado] ?? "bg-surface border-l-4 border-border"} rounded-r px-1 py-1 overflow-hidden cursor-pointer transition-all ${selectedReserva?.reserva_id === r.reserva_id ? "ring-2 ring-ink ring-offset-1 brightness-95" : "hover:brightness-95"}`,
												style: {
													top: topH * CELL,
													height: Math.max(durH * CELL - 2, 22)
												},
												children: /* @__PURE__ */ jsx("p", {
													className: "text-xs font-bold text-ink truncate leading-tight",
													children: r.cliente_nombre
												})
											}, r.reserva_id);
										})]
									}, str);
								})]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex justify-center gap-1.5 mt-3",
							children: [
								0,
								1,
								2,
								3,
								4
							].map((i) => /* @__PURE__ */ jsx("button", {
								onClick: () => setMobileStartDay(i),
								className: `w-1.5 h-1.5 rounded-full transition-colors ${i === mobileStartDay ? "bg-ink" : "bg-border"}`
							}, i))
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "hidden lg:block",
					children: /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded overflow-x-auto",
						children: /* @__PURE__ */ jsxs("div", {
							style: { minWidth: "520px" },
							children: [/* @__PURE__ */ jsxs("div", {
								className: "grid border-b border-border",
								style: { gridTemplateColumns: "52px repeat(7, 1fr)" },
								children: [/* @__PURE__ */ jsx("div", { className: "border-r border-border" }), weekDates.map((d, i) => {
									const str = toDateStr(d);
									const isToday = str === todayStr;
									return /* @__PURE__ */ jsxs("div", {
										className: `border-r border-border last:border-r-0 flex flex-col items-center justify-center py-2 min-h-[56px] ${isToday ? "bg-accent/10" : i >= 5 ? "bg-border/10" : ""}`,
										children: [
											/* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted uppercase tracking-wide font-semibold",
												children: DOW_LABELS[i]
											}),
											isToday ? /* @__PURE__ */ jsx("span", {
												className: "inline-flex items-center justify-center w-6 h-6 mt-0.5 rounded-full bg-ink text-white text-xs font-bold",
												children: d.getDate()
											}) : /* @__PURE__ */ jsx("p", {
												className: "text-sm font-bold text-ink mt-0.5",
												children: d.getDate()
											}),
											reservasByDay[str]?.length > 0 && /* @__PURE__ */ jsxs("p", {
												className: "text-xs text-ink-muted mt-0.5",
												children: [reservasByDay[str].length, "t"]
											})
										]
									}, str);
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "relative grid",
								style: { gridTemplateColumns: "52px repeat(7, 1fr)" },
								children: [/* @__PURE__ */ jsx("div", {
									className: "border-r border-border",
									children: HOURS$1.map((h) => /* @__PURE__ */ jsx("div", {
										className: "border-b border-border/30 flex items-center justify-center px-1",
										style: { height: CELL },
										children: /* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted",
											children: h
										})
									}, h))
								}), weekDates.map((d, i) => {
									const str = toDateStr(d);
									const isToday = str === todayStr;
									const isWeekend = i >= 5;
									const dayRes = reservasByDay[str] ?? [];
									return /* @__PURE__ */ jsxs("div", {
										className: `relative border-r border-border last:border-r-0 ${isToday ? "bg-accent/5" : isWeekend ? "bg-border/10" : ""}`,
										children: [HOURS$1.map((_, hi) => /* @__PURE__ */ jsx("div", {
											className: "border-b border-border/20",
											style: { height: CELL }
										}, hi)), dayRes.map((r) => {
											const [hh, mm] = r.hora.split(":").map(Number);
											const topH = hh + mm / 60 - GRID_START$1;
											const durH = (r.servicio?.duracion ?? 60) / 60;
											const color = clientColorMap[r.cliente_nombre]?.block ?? ESTADO_COLOR[r.estado] ?? "bg-surface border-l-4 border-border";
											const isSelected = selectedReserva?.reserva_id === r.reserva_id;
											return /* @__PURE__ */ jsxs("div", {
												onClick: () => handleReservaClick(r),
												title: `${r.cliente_nombre} · ${r.servicio?.nombre}`,
												className: `absolute left-0.5 right-0.5 ${color} rounded-r px-2 py-1 overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2 ring-ink ring-offset-1 brightness-95" : "hover:brightness-95"}`,
												style: {
													top: topH * CELL,
													height: Math.max(durH * CELL - 2, 22)
												},
												children: [/* @__PURE__ */ jsx("p", {
													className: "text-xs font-bold text-ink truncate leading-tight",
													children: r.cliente_nombre
												}), durH * CELL > 36 && /* @__PURE__ */ jsx("p", {
													className: "text-xs text-ink-muted truncate",
													children: r.servicio?.nombre
												})]
											}, r.reserva_id);
										})]
									}, str);
								})]
							})]
						})
					})
				})] })] }), /* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 mb-3",
					children: [/* @__PURE__ */ jsxs("h2", {
						className: "font-display text-xl text-ink shrink-0",
						children: ["Clientes", /* @__PURE__ */ jsx("span", {
							className: "ml-2 text-sm font-normal text-ink-muted",
							children: !clientsLoading && `${clientesProximos.length + clientesHistoricos.length} clientes`
						})]
					}), /* @__PURE__ */ jsx("input", {
						className: "flex-1 border border-border rounded px-3 py-1.5 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink",
						placeholder: "Buscar...",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})]
				}), clientsLoading ? /* @__PURE__ */ jsx("div", {
					className: "bg-surface border border-border rounded p-8 text-center text-ink-muted text-sm",
					children: "Cargando clientes..."
				}) : /* @__PURE__ */ jsxs("div", {
					className: "space-y-8",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-lg font-semibold text-ink mb-3",
						children: [
							"Próximas reservas (",
							filteredProximos.length,
							")"
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded overflow-hidden",
						children: /* @__PURE__ */ jsx("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ jsxs("div", {
								className: "min-w-[580px]",
								children: [/* @__PURE__ */ jsx("div", {
									className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
									children: [
										{
											label: "CLIENTE",
											span: "col-span-3"
										},
										{
											label: "EMAIL",
											span: "col-span-3"
										},
										{
											label: "PRÓXIMA SESIÓN",
											span: "col-span-3"
										},
										{
											label: "ESTADO",
											span: "col-span-1 flex items-center justify-center"
										}
									].map((h) => /* @__PURE__ */ jsx("div", {
										className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${h.span}`,
										children: h.label
									}, h.label))
								}), filteredProximos.length === 0 ? /* @__PURE__ */ jsx("div", {
									className: "p-8 text-center text-sm text-ink-muted",
									children: "No hay clientes con reservas futuras"
								}) : filteredProximos.map((c, index) => {
									const isSelected = selectedClient?.cliente_id === c.cliente_id;
									const cc = CLIENT_COLORS[index % CLIENT_COLORS.length];
									return /* @__PURE__ */ jsxs("div", {
										onClick: () => handleClientClick(c),
										className: `grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center cursor-pointer transition-colors border-l-[3px] ${cc.accent}
                      ${isSelected ? "bg-accent/10" : "hover:bg-bg"}`,
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "col-span-3 flex items-center gap-3",
												children: [/* @__PURE__ */ jsx("div", {
													className: `w-9 h-9 rounded-lg ${cc.avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`,
													children: getInitials$2(c.nombre)
												}), /* @__PURE__ */ jsx("span", {
													className: "text-sm font-semibold text-ink truncate",
													children: c.nombre
												})]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "col-span-3",
												children: /* @__PURE__ */ jsx("span", {
													className: "text-sm text-ink-muted truncate block",
													children: c.email
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "col-span-3",
												children: /* @__PURE__ */ jsxs("span", {
													className: "text-sm text-ink",
													children: [
														c.proxima_sesion,
														" ",
														c.hora_proxima_sesion?.slice(0, 5) ?? ""
													]
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "col-span-1 flex justify-center",
												children: /* @__PURE__ */ jsx("span", {
													className: `badge ${c.estado === "EN SESION" ? "badge-en-vivo" : "badge-confirmada"}`,
													children: c.estado
												})
											})
										]
									}, c.cliente_id);
								})]
							})
						})
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
						className: "text-lg font-semibold text-ink mb-3",
						children: [
							"Historial de clientes (",
							filteredHistoricos.length,
							")"
						]
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded overflow-hidden",
						children: /* @__PURE__ */ jsx("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ jsxs("div", {
								className: "min-w-[580px]",
								children: [/* @__PURE__ */ jsx("div", {
									className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
									children: [
										{
											label: "CLIENTE",
											span: "col-span-3"
										},
										{
											label: "EMAIL",
											span: "col-span-3"
										},
										{
											label: "ÚLTIMA SESIÓN",
											span: "col-span-3"
										},
										{
											label: "ESTADO",
											span: "col-span-1 flex items-center justify-center"
										}
									].map((h) => /* @__PURE__ */ jsx("div", {
										className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${h.span}`,
										children: h.label
									}, h.label))
								}), filteredHistoricos.length === 0 ? /* @__PURE__ */ jsx("div", {
									className: "p-8 text-center text-sm text-ink-muted",
									children: "No hay clientes históricos"
								}) : filteredHistoricos.map((c, index) => {
									const isSelected = selectedClient?.cliente_id === c.cliente_id;
									const cc = CLIENT_COLORS[index % CLIENT_COLORS.length];
									return /* @__PURE__ */ jsxs("div", {
										onClick: () => handleClientClick(c),
										className: `grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center cursor-pointer transition-colors border-l-[3px] ${cc.accent}
                      ${isSelected ? "bg-accent/10" : "hover:bg-bg"}`,
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "col-span-3 flex items-center gap-3",
												children: [/* @__PURE__ */ jsx("div", {
													className: `w-9 h-9 rounded-lg ${cc.avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`,
													children: getInitials$2(c.nombre)
												}), /* @__PURE__ */ jsx("span", {
													className: "text-sm font-semibold text-ink truncate",
													children: c.nombre
												})]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "col-span-3",
												children: /* @__PURE__ */ jsx("span", {
													className: "text-sm text-ink-muted truncate block",
													children: c.email
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "col-span-3",
												children: /* @__PURE__ */ jsx("span", {
													className: "text-sm text-ink-muted",
													children: "Sin reservas futuras"
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "col-span-1 flex justify-center",
												children: /* @__PURE__ */ jsx("span", {
													className: "badge",
													children: "Histórico"
												})
											})
										]
									}, c.cliente_id);
								})]
							})
						})
					})] })]
				})] })]
			}), /* @__PURE__ */ jsx("div", {
				className: "lg:sticky lg:top-8 space-y-3",
				children: panelOpen && selectedClient ? /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded overflow-hidden",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between px-4 py-3 border-b border-border bg-bg",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold text-ink-muted uppercase tracking-widest",
								children: selectedReserva ? "Turno" : "Cliente"
							}), /* @__PURE__ */ jsx("button", {
								onClick: closePanel,
								className: "text-ink-muted hover:text-ink transition-colors cursor-pointer",
								children: /* @__PURE__ */ jsx(CloseIcon$2, {})
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "px-4 py-4 border-b border-border flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: `w-11 h-11 rounded-lg ${panelClientColor.avatar} flex items-center justify-center text-white text-sm font-bold shrink-0`,
								children: getInitials$2(selectedClient.nombre)
							}), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink truncate",
									children: selectedClient.nombre
								}), /* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted truncate",
									children: selectedClient.email
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 divide-x divide-border border-b border-border",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "px-4 py-3",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted uppercase tracking-widest font-bold mb-1",
										children: "Sesiones"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "font-display text-2xl text-ink font-bold",
										children: selectedClient.sesiones_restantes
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: "restantes"
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "px-4 py-3",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted uppercase tracking-widest font-bold mb-1",
										children: "Próxima"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink font-semibold leading-snug",
										children: selectedClient.proxima_sesion ? `${selectedClient.proxima_sesion}` : "—"
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: selectedClient.hora_proxima_sesion?.slice(0, 5) ?? ""
									})
								]
							})]
						}),
						selectedReserva && /* @__PURE__ */ jsxs("div", {
							className: "px-4 py-4 border-b border-border",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
									children: "Turno seleccionado"
								}),
								/* @__PURE__ */ jsx(ReservaCard, {
									reserva: selectedReserva,
									updatingId,
									onCambiarEstado: cambiarEstado,
									onCancelarReserva: cancelarReserva,
									highlight: true
								}),
								(selectedReserva.estado === "en_curso" || selectedReserva.estado === "finalizada") && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
									className: "flex gap-2 mt-3",
									children: [/* @__PURE__ */ jsx("button", {
										className: "flex-1 bg-green-600 text-white rounded py-1.5 text-xs font-semibold",
										onClick: () => setSelectedReserva(null),
										children: "Asistió"
									}), /* @__PURE__ */ jsx("button", {
										className: "flex-1 bg-red-600 text-white rounded py-1.5 text-xs font-semibold",
										onClick: async () => {
											const r = selectedReserva;
											await api.put(`/reservas/${r.reserva_id}/estado`, { estado: "no_asistida" }, token);
											setReservas((prev) => prev.map((x) => x.reserva_id === r.reserva_id ? {
												...x,
												estado: "no_asistida"
											} : x));
											setSelectedReserva((prev) => prev ? {
												...prev,
												estado: "no_asistida"
											} : null);
										},
										children: "No asistió"
									})]
								}), selectedReserva.pago && /* @__PURE__ */ jsx("div", {
									className: "flex gap-2 mt-3",
									children: /* @__PURE__ */ jsx("button", {
										className: `flex-1 rounded py-1.5 text-xs font-semibold transition-colors ${selectedReserva.pago?.estado === "aprobado" ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`,
										onClick: async () => {
											const r = selectedReserva;
											await api.post(`/reservas/${r.reserva_id}/pago-presencial`, {}, token);
											setReservas((prev) => prev.map((x) => x.reserva_id === r.reserva_id ? {
												...x,
												pago: {
													...x.pago,
													estado: "aprobado"
												}
											} : x));
											setSelectedReserva((prev) => prev ? {
												...prev,
												pago: {
													...prev.pago,
													estado: "aprobado"
												}
											} : null);
										},
										children: selectedReserva.pago?.estado === "aprobado" ? "Pagado" : "Pago"
									})
								})] })
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "px-4 py-4",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-3",
								children: selectedReserva ? "Otros turnos" : "Turnos"
							}), clientReservas.length === 0 ? /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted",
								children: "Sin turnos registrados"
							}) : /* @__PURE__ */ jsxs("div", {
								className: "space-y-3",
								children: [clientReservas.filter((r) => r.reserva_id !== selectedReserva?.reserva_id).map((r) => /* @__PURE__ */ jsx(ReservaCard, {
									reserva: r,
									updatingId,
									onCambiarEstado: cambiarEstado,
									onCancelarReserva: cancelarReserva
								}, r.reserva_id)), clientReservas.filter((r) => r.reserva_id !== selectedReserva?.reserva_id).length === 0 && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted",
									children: "Sin otros turnos"
								})]
							})]
						})
					]
				}) : /* @__PURE__ */ jsx("div", {
					className: "bg-surface border border-border rounded p-5 text-center",
					children: /* @__PURE__ */ jsx("p", {
						className: "text-xs text-ink-muted",
						children: "Seleccioná un turno o cliente para ver los detalles"
					})
				})
			})]
		})]
	});
});
function ReservaCard({ reserva, updatingId, onCambiarEstado, onCancelarReserva, highlight = false }) {
	const canConfirm = reserva.estado === "pendiente";
	const canCancel = [
		"pendiente",
		"confirmada",
		"en_curso"
	].includes(reserva.estado);
	const isUpdating = updatingId === reserva.reserva_id;
	return /* @__PURE__ */ jsxs("div", {
		className: `rounded border p-3 space-y-2 ${highlight ? "border-ink/30 bg-white" : "border-border bg-white"}`,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-start justify-between gap-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs font-semibold text-ink",
						children: [
							reserva.fecha,
							" · ",
							reserva.hora.slice(0, 5)
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-ink-muted truncate",
						children: reserva.servicio?.nombre
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-xs text-ink-muted",
						children: [
							reserva.servicio?.duracion,
							" min · ",
							reserva.servicio?.modalidad
						]
					})
				]
			}), /* @__PURE__ */ jsx("span", {
				className: `text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${ESTADO_BADGE[reserva.estado] ?? "bg-gray-100 text-gray-600"}`,
				children: ESTADO_LABEL[reserva.estado] ?? reserva.estado
			})]
		}), (canConfirm || canCancel) && /* @__PURE__ */ jsxs("div", {
			className: "flex gap-1.5 pt-0.5",
			children: [canConfirm && /* @__PURE__ */ jsx("button", {
				disabled: isUpdating,
				onClick: () => onCambiarEstado(reserva.reserva_id, "confirmada"),
				className: "flex-1 py-1 text-xs font-semibold bg-ink text-white rounded hover:bg-primary transition-colors disabled:opacity-50",
				children: isUpdating ? "..." : "Confirmar"
			}), canCancel && /* @__PURE__ */ jsx("button", {
				disabled: isUpdating,
				onClick: () => {
					if (reserva.estado === "confirmada") onCancelarReserva(reserva.reserva_id);
					else onCambiarEstado(reserva.reserva_id, "cancelada");
				},
				className: `py-1 text-xs font-semibold border border-border rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-ink-muted transition-colors disabled:opacity-50 ${canConfirm ? "px-2" : "flex-1"}`,
				children: isUpdating ? "..." : "Cancelar"
			})]
		})]
	});
}
function ChevronLeftIcon() {
	return /* @__PURE__ */ jsx("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("polyline", { points: "15 18 9 12 15 6" })
	});
}
function ChevronRightIcon() {
	return /* @__PURE__ */ jsx("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("polyline", { points: "9 18 15 12 9 6" })
	});
}
function CloseIcon$2() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ jsx("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
//#endregion
//#region app/routes/professional/dashboard.tsx
var dashboard_exports$1 = /* @__PURE__ */ __exportAll({ default: () => dashboard_default$1 });
var COLORS = [
	"bg-violet-500",
	"bg-purple-400",
	"bg-teal-500",
	"bg-amber-500",
	"bg-orange-400",
	"bg-blue-500",
	"bg-rose-500"
];
var getInitials$1 = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
var getColor = (id) => COLORS[id % COLORS.length];
function todayStr() {
	const d = /* @__PURE__ */ new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfWeekStr() {
	const now = /* @__PURE__ */ new Date();
	const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
	const mon = new Date(now);
	mon.setDate(now.getDate() + diff);
	return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}
function puedeEntrar(reserva) {
	if (!reserva.servicio?.duracion) return false;
	const ahora = /* @__PURE__ */ new Date();
	const inicio = /* @__PURE__ */ new Date(`${reserva.fecha}T${reserva.hora}`);
	const fin = new Date(inicio);
	fin.setMinutes(fin.getMinutes() + reserva.servicio.duracion);
	const desde = new Date(inicio);
	desde.setMinutes(desde.getMinutes() - 10);
	return ahora >= desde && ahora <= fin;
}
var statusMap = {
	finalizada: {
		label: "FINALIZADA",
		cls: "text-xs text-ink-muted font-bold uppercase"
	},
	en_curso: {
		label: "EN VIVO",
		cls: "badge badge-en-vivo"
	},
	confirmada: {
		label: "CONFIRMADA",
		cls: "badge badge-confirmada"
	},
	pagada: {
		label: "PAGADA",
		cls: "badge badge-pagada"
	},
	pendiente: {
		label: "PENDIENTE",
		cls: "badge badge-pendiente"
	}
};
var calendar = [
	[
		24,
		25,
		26,
		27,
		1,
		2,
		3
	],
	[
		4,
		5,
		6,
		7,
		8,
		9,
		10
	],
	[
		11,
		12,
		13,
		14,
		15,
		16,
		17
	],
	[
		18,
		19,
		20,
		21,
		22,
		23,
		24
	],
	[
		25,
		26,
		27,
		28,
		29,
		30,
		31
	]
];
function Skeleton({ className = "" }) {
	return /* @__PURE__ */ jsx("div", { className: `animate-pulse rounded bg-border/60 ${className}` });
}
function DashboardSkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between mb-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-56" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-40" })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-3",
					children: [
						/* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-9 rounded" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-36 rounded" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-36 rounded" })
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8",
				children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-5 space-y-2",
					children: [
						/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-28" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-9 w-16" }),
						/* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-24" })
					]
				}, i))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "col-span-2",
					children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-64 mb-4" }), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded overflow-hidden",
						children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "w-16 space-y-1",
									children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-10" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-8" })]
								}),
								/* @__PURE__ */ jsx(Skeleton, { className: "w-8 h-8 rounded shrink-0" }),
								/* @__PURE__ */ jsxs("div", {
									className: "flex-1 space-y-1",
									children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32" }), /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-48" })]
								}),
								/* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-20 rounded-full" })
							]
						}, i))
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4",
						children: [/* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-24 mb-3" }), /* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-7 gap-0.5",
							children: [Array.from({ length: 7 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-6" }, i)), Array.from({ length: 35 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-7" }, i))]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4 space-y-2",
						children: [
							/* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-20 mb-3" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-14 rounded" }),
							/* @__PURE__ */ jsx(Skeleton, { className: "h-14 rounded" })
						]
					})]
				})]
			})
		]
	});
}
var dashboard_default$1 = UNSAFE_withComponentProps(function ProfessionalDashboard() {
	const { user, token } = useAuth();
	const firstName = user?.name?.split(" ")[0] ?? "Profesional";
	const [allReservas, setAllReservas] = useState([]);
	const [pendientes, setPendientes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [openSolicitudes, setOpenSolicitudes] = useState(false);
	const [loadingId, setLoadingId] = useState(null);
	const [calificaciones, setCalificaciones] = useState([]);
	const [promedio, setPromedio] = useState(0);
	const [openCalificaciones, setOpenCalificaciones] = useState(false);
	const [cantidadCalificaciones, setCantidadCalificaciones] = useState(0);
	const loadDashboard = async () => {
		if (!token || !user?.id) return;
		try {
			const [agendaRes, pendientesRes, calificacionesRes] = await Promise.all([
				api.get("/mi-agenda", token),
				api.get("/reservas/pendientes", token),
				api.get(`/profesionales/${user.id}/calificaciones`, token)
			]);
			const agenda = agendaRes;
			const pendientesData = pendientesRes;
			const calificacionesData = calificacionesRes;
			setAllReservas(agenda.data ?? []);
			setPendientes(pendientesData.data ?? []);
			setCalificaciones(calificacionesData.data ?? []);
			setPromedio(calificacionesData.promedio ?? 0);
			setCantidadCalificaciones(calificacionesData.cantidad ?? 0);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		loadDashboard();
	}, [token, user?.id]);
	useEffect(() => {
		const handler = () => {
			console.log("PRO DASHBOARD REFRESH");
			loadDashboard();
		};
		window.addEventListener("reserva-updated", handler);
		return () => window.removeEventListener("reserva-updated", handler);
	}, [token, user?.id]);
	const hoy = todayStr();
	const semanaDesde = startOfWeekStr();
	const agendaHoy = useMemo(() => allReservas.filter((r) => r.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora)), [allReservas, hoy]);
	const sesionesHoy = agendaHoy.length;
	const sesionesEstaSemana = useMemo(() => allReservas.filter((r) => r.fecha >= semanaDesde).length, [allReservas, semanaDesde]);
	const kpis = [
		{
			label: "SESIONES HOY",
			value: String(sesionesHoy),
			sub: "reservas para hoy"
		},
		{
			label: "SESIONES ESTA SEMANA",
			value: String(sesionesEstaSemana),
			sub: "semana en curso"
		},
		{
			label: "PENDIENTES",
			value: String(pendientes.length),
			sub: "esperan confirmación"
		},
		{
			label: "CALIFICACIÓN",
			value: promedio > 0 ? promedio.toString() : "—",
			sub: `${cantidadCalificaciones} reseñas`
		}
	];
	const cambiarEstado = async (id, estado) => {
		try {
			setLoadingId(id);
			await api.put(`/reservas/${id}/estado`, { estado }, token);
			setPendientes((prev) => prev.filter((r) => r.reserva_id !== id));
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingId(null);
		}
	};
	if (loading) return /* @__PURE__ */ jsx(DashboardSkeleton, {});
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h1", {
					className: "font-display text-3xl text-ink",
					children: ["Buenos días, ", firstName]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: sesionesHoy > 0 ? `Tenés ${sesionesHoy} sesión${sesionesHoy !== 1 ? "es" : ""} hoy` : "Sin sesiones hoy"
				})] }), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-center gap-2 sm:gap-3",
					children: /* @__PURE__ */ jsxs(Link, {
						to: "/professional/services",
						className: "flex items-center gap-2 border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink",
						children: [/* @__PURE__ */ jsx(PlusIcon, {}), "Nuevo servicio"]
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8",
				children: kpis.map((k) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-5",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: k.label
						}),
						/* @__PURE__ */ jsx("span", {
							className: "font-display text-3xl text-ink",
							children: k.value
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted mt-1",
							children: k.sub
						})
					]
				}, k.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex items-center justify-between mb-4",
						children: /* @__PURE__ */ jsxs("h2", {
							className: "font-display text-xl text-ink",
							children: [
								"Agenda de hoy ·",
								" ",
								(/* @__PURE__ */ new Date()).toLocaleDateString("es-UY", {
									weekday: "long",
									day: "numeric",
									month: "short"
								})
							]
						})
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded overflow-hidden",
						children: agendaHoy.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "px-5 py-6 text-sm text-ink-muted",
							children: "No hay sesiones registradas para hoy."
						}) : agendaHoy.map((item) => {
							const hora = item.hora.slice(0, 5);
							const initials = getInitials$1(item.cliente_nombre ?? "?");
							const color = getColor(item.cliente_id);
							const estado = item.estado;
							const duracion = item.servicio?.duracion ? `${item.servicio.duracion}min` : "";
							return /* @__PURE__ */ jsxs("div", {
								className: `flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-4 border-b border-border last:border-b-0 ${estado === "en_curso" ? "bg-accent/10" : ""}`,
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "w-12 sm:w-16 shrink-0",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-semibold text-ink",
											children: hora
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: duracion
										})]
									}),
									/* @__PURE__ */ jsx("div", {
										className: `w-8 h-8 rounded shrink-0 flex items-center justify-center text-white text-xs font-bold ${color}`,
										children: initials
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-semibold text-ink",
											children: item.cliente_nombre
										}), item.servicio?.nombre && /* @__PURE__ */ jsxs("p", {
											className: "text-xs text-ink-muted",
											children: [item.servicio.nombre, item.servicio.modalidad ? ` · ${item.servicio.modalidad}` : ""]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-3",
										children: [statusMap[estado] && /* @__PURE__ */ jsx("span", {
											className: statusMap[estado].cls,
											children: statusMap[estado].label
										}), item.modalidad === "virtual" && puedeEntrar(item) && /* @__PURE__ */ jsx(Link, {
											to: `/videollamada/${item.reserva_id}`,
											children: /* @__PURE__ */ jsxs("button", {
												className: "flex items-center gap-1 bg-ink text-white text-sm font-semibold px-2 sm:px-4 py-2 rounded hover:bg-primary transition-colors",
												children: [/* @__PURE__ */ jsx(VideoIcon, {}), /* @__PURE__ */ jsx("span", {
													className: "hidden sm:inline",
													children: "Iniciar videollamada"
												})]
											})
										})]
									})
								]
							}, item.reserva_id);
						})
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-ink",
								children: (/* @__PURE__ */ new Date()).toLocaleDateString("es-UY", {
									month: "long",
									year: "numeric"
								})
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex gap-1",
								children: [/* @__PURE__ */ jsx("button", {
									className: "w-6 h-6 border border-border rounded text-ink-muted hover:bg-bg text-xs",
									children: "‹"
								}), /* @__PURE__ */ jsx("button", {
									className: "w-6 h-6 border border-border rounded text-ink-muted hover:bg-bg text-xs",
									children: "›"
								})]
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-7 gap-0.5",
							children: [[
								"L",
								"M",
								"X",
								"J",
								"V",
								"S",
								"D"
							].map((d) => /* @__PURE__ */ jsx("div", {
								className: "text-center text-xs text-ink-muted py-1 font-semibold",
								children: d
							}, d)), calendar.flat().map((day, i) => {
								return /* @__PURE__ */ jsx("button", {
									className: `text-xs py-1.5 rounded transition-colors ${day === (/* @__PURE__ */ new Date()).getDate() ? "bg-ink text-white font-bold" : "text-ink-muted"}`,
									children: day
								}, i);
							})]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-semibold text-ink mb-3",
							children: "Por revisar"
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors",
								onClick: () => setOpenSolicitudes((v) => !v),
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "shrink-0 text-ink-muted",
										children: /* @__PURE__ */ jsx(ClipboardIcon, {})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ jsxs("p", {
											className: "text-sm font-semibold text-ink",
											children: [pendientes.length, " solicitudes de reserva"]
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Esperan tu confirmación"
										})]
									}),
									/* @__PURE__ */ jsx(ChevronIcon, { open: openSolicitudes })
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors",
								onClick: () => setOpenCalificaciones(true),
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "shrink-0 text-ink-muted",
										children: /* @__PURE__ */ jsx(StarIcon, {})
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ jsxs("p", {
											className: "text-sm font-semibold text-ink",
											children: [
												"Reseñas (",
												cantidadCalificaciones,
												")"
											]
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-xs text-ink-muted",
											children: [
												"Promedio: ",
												promedio,
												"/5"
											]
										})]
									}),
									/* @__PURE__ */ jsx(ChevronIcon, { open: openCalificaciones })
								]
							})]
						})]
					})]
				})]
			}),
			openSolicitudes && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
				children: /* @__PURE__ */ jsxs("div", {
					className: "bg-surface w-full max-w-lg rounded border border-border p-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex justify-between items-center mb-4",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-semibold text-ink",
							children: "Solicitudes de reserva"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => setOpenSolicitudes(false),
							className: "text-ink-muted hover:text-ink",
							children: /* @__PURE__ */ jsx(XIcon, {})
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-3 max-h-[400px] overflow-y-auto",
						children: pendientes.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "No hay solicitudes pendientes."
						}) : pendientes.map((r) => /* @__PURE__ */ jsxs("div", {
							className: "p-3 border rounded bg-bg",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink",
									children: r.cliente_nombre
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted",
									children: r.servicio?.nombre
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted",
									children: [
										r.fecha,
										" · ",
										r.hora?.slice(0, 5)
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex gap-2 mt-3",
									children: [/* @__PURE__ */ jsx("button", {
										disabled: loadingId === r.reserva_id,
										onClick: () => cambiarEstado(r.reserva_id, "confirmada"),
										className: "px-3 py-1 text-xs bg-ink text-white rounded hover:bg-primary disabled:opacity-50 cursor-pointer",
										children: loadingId === r.reserva_id ? "..." : "Confirmar"
									}), /* @__PURE__ */ jsx("button", {
										disabled: loadingId === r.reserva_id,
										onClick: () => cambiarEstado(r.reserva_id, "cancelada"),
										className: "px-3 py-1 text-xs border border-border rounded hover:bg-bg disabled:opacity-50 cursor-pointer",
										children: loadingId === r.reserva_id ? "..." : "Cancelar"
									})]
								})
							]
						}, r.reserva_id))
					})]
				})
			}),
			openCalificaciones && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
				children: /* @__PURE__ */ jsxs("div", {
					className: "bg-surface w-full max-w-lg rounded border border-border p-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex justify-between items-center mb-4",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-semibold text-ink",
							children: "Reseñas recibidas"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => setOpenCalificaciones(false),
							className: "text-ink-muted hover:text-ink",
							children: /* @__PURE__ */ jsx(XIcon, {})
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-3 max-h-[400px] overflow-y-auto",
						children: calificaciones.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "text-sm text-ink-muted",
							children: "Aún no tenés reseñas."
						}) : calificaciones.map((c) => /* @__PURE__ */ jsxs("div", {
							className: "p-3 border rounded bg-bg",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "flex justify-between items-center",
									children: /* @__PURE__ */ jsxs("span", {
										className: "text-amber-500 font-bold",
										children: [
											"⭐ ",
											c.puntuacion,
											"/5"
										]
									})
								}),
								c.comentario && /* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink-muted mt-2",
									children: c.comentario
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-xs text-ink-muted mt-2",
									children: c.reserva?.servicio?.nombre
								})
							]
						}, c.calificacion_id))
					})]
				})
			})
		]
	});
});
function PlusIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "15",
		height: "15",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2.5,
		strokeLinecap: "round",
		children: [/* @__PURE__ */ jsx("line", {
			x1: "12",
			y1: "5",
			x2: "12",
			y2: "19"
		}), /* @__PURE__ */ jsx("line", {
			x1: "5",
			y1: "12",
			x2: "19",
			y2: "12"
		})]
	});
}
function VideoIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "15",
		height: "15",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ jsx("polygon", { points: "23 7 16 12 23 17 23 7" }), /* @__PURE__ */ jsx("rect", {
			x: "1",
			y: "5",
			width: "15",
			height: "14",
			rx: "2"
		})]
	});
}
function ClipboardIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ jsx("path", { d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }), /* @__PURE__ */ jsx("rect", {
			x: "8",
			y: "2",
			width: "8",
			height: "4",
			rx: "1"
		})]
	});
}
function StarIcon() {
	return /* @__PURE__ */ jsx("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: /* @__PURE__ */ jsx("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })
	});
}
function ChevronIcon({ open }) {
	return /* @__PURE__ */ jsx("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2.5,
		strokeLinecap: "round",
		style: {
			transform: open ? "rotate(180deg)" : "rotate(0deg)",
			transition: "transform 0.15s"
		},
		children: /* @__PURE__ */ jsx("polyline", { points: "6 9 12 15 18 9" })
	});
}
function XIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2.5,
		strokeLinecap: "round",
		children: [/* @__PURE__ */ jsx("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ jsx("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
//#endregion
//#region app/routes/professional/services.tsx
var services_exports = /* @__PURE__ */ __exportAll({ default: () => services_default });
var GMAPS_KEY = "AIzaSyBWf1wjKY5nMYkBi0f-1enF1k5k7xDXkq0";
var API_BASE = "http://localhost:8000/api";
var EMPTY_FORM$1 = {
	nombre: "",
	descripcion: "",
	modalidad: "presencial",
	tipo: "",
	tipoPersonalizado: "",
	precio: "",
	duracion: "",
	pausa: "",
	min_cancelacion: "",
	ubicacion: "",
	latitud: null,
	longitud: null
};
var MODALIDAD_CLS = {
	presencial: "bg-emerald-100 text-emerald-800",
	virtual: "bg-orange-100  text-orange-700",
	hibrido: "bg-amber-100   text-amber-800"
};
var TIPOS_SERVICIO = [
	"Psicología",
	"Nutrición",
	"Tarot",
	"Astrología",
	"Entrenamiento Personal",
	"Yoga",
	"Pilates",
	"Fisioterapia",
	"Masoterapia",
	"Clases Particulares",
	"Idiomas",
	"Música",
	"Consultoría",
	"Asesoría Legal",
	"Belleza y Estética",
	"Fotografía",
	"Otro"
];
var inputCls$1 = "w-full border border-border rounded px-3 py-2 text-sm bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
var labelCls$1 = "block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5";
function useGoogleMaps() {
	const [ready, setReady] = useState(() => !!window.google?.maps);
	useEffect(() => {
		if (window.google?.maps) {
			setReady(true);
			return;
		}
		if (document.getElementById("gmap-sdk")) return;
		const script = document.createElement("script");
		script.id = "gmap-sdk";
		script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`;
		script.async = true;
		script.onload = () => setReady(true);
		document.head.appendChild(script);
	}, []);
	return ready;
}
function MapPicker({ lat, lng, onDragEnd }) {
	const mapsReady = useGoogleMaps();
	const containerRef = useRef(null);
	const mapRef = useRef(null);
	const markerRef = useRef(null);
	const onDragEndRef = useRef(onDragEnd);
	onDragEndRef.current = onDragEnd;
	useEffect(() => {
		if (!mapsReady || !containerRef.current) return;
		const g = window.google.maps;
		const center = {
			lat: lat ?? -34.9011,
			lng: lng ?? -56.1645
		};
		const map = new g.Map(containerRef.current, {
			center,
			zoom: 15
		});
		const marker = new g.Marker({
			position: center,
			map,
			draggable: true
		});
		marker.addListener("dragend", async () => {
			const pos = marker.getPosition();
			const newLat = pos.lat();
			const newLng = pos.lng();
			try {
				const res = await fetch(`${API_BASE}/geocoding/reverse?lat=${newLat}&lng=${newLng}`);
				const json = await res.json();
				if (res.ok && json.success) onDragEndRef.current(newLat, newLng, json.data.direccion_formateada);
				else onDragEndRef.current(newLat, newLng, "Ubicación personalizada");
			} catch {
				onDragEndRef.current(newLat, newLng, "Ubicación personalizada");
			}
		});
		mapRef.current = map;
		markerRef.current = marker;
		return () => {
			marker.setMap(null);
		};
	}, [mapsReady]);
	useEffect(() => {
		if (!markerRef.current || lat === null || lng === null) return;
		const pos = new window.google.maps.LatLng(lat, lng);
		markerRef.current.setPosition(pos);
		mapRef.current?.panTo(pos);
	}, [lat, lng]);
	if (!mapsReady) return /* @__PURE__ */ jsx("div", {
		className: "w-full h-56 rounded border border-border bg-gray-100 flex items-center justify-center text-xs text-ink-muted animate-pulse",
		children: "Cargando mapa..."
	});
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		className: "w-full h-56 rounded border border-border"
	});
}
var services_default = UNSAFE_withComponentProps(function Services() {
	const { token } = useAuth();
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [deletingId, setDeletingId] = useState(null);
	const [form, setForm] = useState({ ...EMPTY_FORM$1 });
	const [toast, setToast] = useState(null);
	const showToast = (msg, ok = true) => {
		setToast({
			msg,
			ok
		});
		setTimeout(() => setToast(null), 3e3);
	};
	const fetchServicios = async () => {
		try {
			setLoading(true);
			const data = await api.get("/mis-servicios", token);
			if (data.success) setServices(data.data);
		} catch {
			setServices([]);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchServicios();
	}, [token]);
	const openCreate = () => {
		setDeletingId(null);
		setForm({ ...EMPTY_FORM$1 });
		setEditingId(editingId === "new" ? null : "new");
	};
	const openEdit = (s) => {
		setDeletingId(null);
		const id = s.servicio_id;
		if (editingId === id) {
			setEditingId(null);
			return;
		}
		setForm({
			nombre: s.nombre,
			descripcion: s.descripcion,
			modalidad: s.modalidad,
			tipo: TIPOS_SERVICIO.includes(s.tipo) ? s.tipo : "Otro",
			tipoPersonalizado: TIPOS_SERVICIO.includes(s.tipo) ? "" : s.tipo,
			precio: String(s.precio),
			duracion: String(s.duracion),
			pausa: String(s.pausa),
			min_cancelacion: String(s.min_cancelacion),
			ubicacion: s.ubicacion ?? "",
			latitud: s.latitud ?? null,
			longitud: s.longitud ?? null
		});
		setEditingId(id);
	};
	const closeAll = () => {
		setEditingId(null);
		setDeletingId(null);
		setForm({ ...EMPTY_FORM$1 });
	};
	const setF = (patch) => setForm((f) => ({
		...f,
		...patch
	}));
	const needsLocation = ["presencial", "hibrido"].includes(form.modalidad.toLowerCase());
	const handleSave = async () => {
		const tipoFinal = form.tipo === "Otro" ? form.tipoPersonalizado.trim() : form.tipo;
		if (!form.nombre.trim()) return showToast("El nombre es requerido", false);
		if (!tipoFinal.trim()) return showToast("El tipo es requerido", false);
		if (!form.precio) return showToast("El precio es requerido", false);
		if (!form.duracion) return showToast("La duración es requerida", false);
		if (needsLocation && (form.latitud === null || form.longitud === null)) return showToast("Confirmá la ubicación en el mapa", false);
		setSaving(true);
		try {
			const body = {
				nombre: form.nombre,
				descripcion: form.descripcion,
				modalidad: form.modalidad.toLowerCase(),
				tipo: tipoFinal,
				precio: Number(form.precio),
				duracion: Number(form.duracion),
				pausa: Number(form.pausa),
				min_cancelacion: Number(form.min_cancelacion)
			};
			if (needsLocation) {
				body.direccion = form.ubicacion.trim();
				body.latitud = form.latitud;
				body.longitud = form.longitud;
			}
			if (editingId === "new") {
				await api.post("/servicios", body, token);
				showToast("Servicio creado");
			} else if (typeof editingId === "number") {
				await api.put(`/servicios/${editingId}`, body, token);
				showToast("Servicio actualizado");
			}
			closeAll();
			fetchServicios();
		} catch (err) {
			showToast(err.message ?? "Error al guardar", false);
		} finally {
			setSaving(false);
		}
	};
	const handleDelete = async (id) => {
		setSaving(true);
		try {
			await api.delete(`/servicios/${id}`, token);
			showToast("Servicio eliminado");
			setDeletingId(null);
			fetchServicios();
		} catch (err) {
			showToast(err.message ?? "Error al eliminar", false);
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [
			toast && /* @__PURE__ */ jsx("div", {
				className: `fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg ${toast.ok ? "bg-accent text-ink border-ink/20" : "bg-red-100 text-red-800 border-red-200"}`,
				children: toast.msg
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Servicios"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-ink-muted mt-0.5",
					children: loading ? "Cargando..." : `${services.length} servicio${services.length !== 1 ? "s" : ""} registrado${services.length !== 1 ? "s" : ""}`
				})] }), /* @__PURE__ */ jsx("button", {
					onClick: openCreate,
					className: `px-4 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${editingId === "new" ? "bg-border text-ink-muted" : "bg-ink text-white hover:bg-primary"}`,
					children: editingId === "new" ? "Cancelar" : /* @__PURE__ */ jsx("b", { children: "+ Nuevo servicio" })
				})]
			}),
			editingId === "new" && /* @__PURE__ */ jsx(ServiceForm, {
				form,
				setF,
				saving,
				isEdit: false,
				onSave: handleSave,
				onCancel: closeAll,
				needsLocation
			}),
			loading && /* @__PURE__ */ jsx("div", {
				className: "bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm",
				children: "Cargando servicios..."
			}),
			!loading && services.length === 0 && editingId !== "new" && /* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-12 text-center",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "font-display text-xl text-ink mb-1",
						children: "Sin servicios aún"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-ink-muted text-sm mb-5",
						children: "Creá tu primer servicio para que los clientes puedan reservar"
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: openCreate,
						className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors cursor-pointer",
						children: "+ Nuevo servicio"
					})
				]
			}),
			!loading && services.length > 0 && /* @__PURE__ */ jsx("div", {
				className: "border border-border rounded overflow-x-auto",
				children: /* @__PURE__ */ jsxs("div", {
					className: "bg-surface",
					style: { minWidth: "640px" },
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid px-5 py-2 border-b border-border bg-bg",
						style: { gridTemplateColumns: "2fr 90px 130px 80px 130px 72px" },
						children: [
							"Servicio",
							"Duración",
							"Modalidad",
							"Precio",
							"Reservas",
							""
						].map((h) => /* @__PURE__ */ jsx("div", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest",
							children: h
						}, h))
					}), services.map((s, idx) => {
						const activo = s.activo ?? true;
						const isEditing = editingId === s.servicio_id;
						const isDeleting = deletingId === s.servicio_id;
						const isDimmed = typeof editingId === "number" && !isEditing;
						const modalidad = s.modalidad?.toLowerCase();
						return /* @__PURE__ */ jsxs("div", {
							className: `${idx > 0 ? "border-t border-border" : ""} ${isDimmed ? "opacity-40 pointer-events-none" : "transition-opacity"}`,
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: `grid px-5 py-4 items-center ${isEditing || isDeleting ? "bg-accent/10" : ""}`,
									style: { gridTemplateColumns: "2fr 90px 130px 80px 130px 72px" },
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "flex items-center gap-3 min-w-0",
											children: /* @__PURE__ */ jsxs("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ jsx("p", {
													className: `text-sm font-semibold truncate ${activo ? "text-ink" : "text-ink-muted"}`,
													children: s.nombre
												}), s.ubicacion && /* @__PURE__ */ jsxs("p", {
													className: "text-xs text-ink-muted truncate flex items-center gap-1 mt-0.5",
													children: [
														/* @__PURE__ */ jsx(PinIcon, {}),
														" ",
														s.ubicacion
													]
												})]
											})
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "text-sm text-ink",
											children: [s.duracion, " min"]
										}),
										/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("span", {
											className: `text-xs font-semibold px-2 py-0.5 rounded ${MODALIDAD_CLS[modalidad] ?? "bg-gray-100 text-gray-700"}`,
											children: s.modalidad
										}) }),
										/* @__PURE__ */ jsxs("div", {
											className: "font-display text-sm font-bold text-ink",
											children: ["$", s.precio]
										}),
										/* @__PURE__ */ jsx("div", {
											className: "text-sm text-ink-muted",
											children: s.reservas_count != null ? `${s.reservas_count} totales` : "—"
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-end gap-1",
											children: [/* @__PURE__ */ jsx("button", {
												onClick: () => {
													setDeletingId(null);
													openEdit(s);
												},
												title: "Editar",
												className: `p-1.5 rounded transition-colors cursor-pointer ${isEditing ? "bg-ink text-white" : "hover:bg-border/40 text-ink-muted hover:text-ink"}`,
												children: /* @__PURE__ */ jsx(EditIcon$1, {})
											}), /* @__PURE__ */ jsx("button", {
												onClick: () => {
													setEditingId(null);
													setDeletingId(isDeleting ? null : s.servicio_id);
												},
												title: "Eliminar",
												className: `p-1.5 rounded transition-colors cursor-pointer ${isDeleting ? "bg-red-500 text-white" : "hover:bg-border/40 text-ink-muted hover:text-red-500"}`,
												children: /* @__PURE__ */ jsx(TrashIcon$1, {})
											})]
										})
									]
								}),
								isDeleting && /* @__PURE__ */ jsxs("div", {
									className: "px-5 py-4 border-t border-border bg-red-50 flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ jsxs("p", {
										className: "text-sm text-red-700",
										children: [
											"¿Eliminar ",
											/* @__PURE__ */ jsxs("span", {
												className: "font-semibold",
												children: [
													"\"",
													s.nombre,
													"\""
												]
											}),
											"? Esta acción no se puede deshacer."
										]
									}), /* @__PURE__ */ jsxs("div", {
										className: "flex gap-2 shrink-0",
										children: [/* @__PURE__ */ jsx("button", {
											onClick: () => setDeletingId(null),
											className: "px-3 py-1.5 rounded border border-border bg-white text-sm text-ink font-medium hover:bg-bg transition-colors cursor-pointer",
											children: "Cancelar"
										}), /* @__PURE__ */ jsx("button", {
											onClick: () => handleDelete(s.servicio_id),
											disabled: saving,
											className: "px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer",
											children: saving ? "Eliminando..." : "Eliminar"
										})]
									})]
								}),
								isEditing && /* @__PURE__ */ jsx("div", {
									className: "border-t border-border",
									children: /* @__PURE__ */ jsx(ServiceForm, {
										form,
										setF,
										saving,
										isEdit: true,
										onSave: handleSave,
										onCancel: closeAll,
										needsLocation
									})
								})
							]
						}, s.servicio_id);
					})]
				})
			})
		]
	});
});
function ServiceForm({ form, setF, saving, isEdit, onSave, onCancel, needsLocation }) {
	const [geocodingError, setGeocodingError] = useState(null);
	const [geocoding, setGeocoding] = useState(false);
	const debounceRef = useRef(null);
	useEffect(() => () => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
	}, []);
	const handleAddressInput = (value) => {
		setF({
			ubicacion: value,
			latitud: null,
			longitud: null
		});
		setGeocodingError(null);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!value.trim()) return;
		debounceRef.current = setTimeout(async () => {
			setGeocoding(true);
			try {
				const res = await fetch(`${API_BASE}/geocoding?address=${encodeURIComponent(value)}`);
				const json = await res.json();
				if (res.status === 404) {
					setGeocodingError("No se encontró la dirección, intentá con más detalle");
					return;
				}
				if (res.ok && json.success) {
					setF({
						ubicacion: json.data.direccion_formateada,
						latitud: json.data.latitud,
						longitud: json.data.longitud
					});
					setGeocodingError(null);
				}
			} catch {} finally {
				setGeocoding(false);
			}
		}, 600);
	};
	const handleMapDragEnd = (lat, lng, address) => {
		setF({
			latitud: lat,
			longitud: lng,
			ubicacion: address
		});
		setGeocodingError(null);
	};
	const locationConfirmed = form.latitud !== null && form.longitud !== null;
	const canSave = !saving && (!needsLocation || locationConfirmed);
	return /* @__PURE__ */ jsxs("div", {
		className: "bg-white border border-border rounded p-5 space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs font-bold text-ink-muted uppercase tracking-widest",
					children: isEdit ? "Editar servicio" : "Nuevo servicio"
				}), /* @__PURE__ */ jsx("button", {
					onClick: onCancel,
					className: "text-ink-muted hover:text-ink transition-colors cursor-pointer",
					children: /* @__PURE__ */ jsx(CloseIcon$1, {})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
					className: labelCls$1,
					children: "Nombre"
				}), /* @__PURE__ */ jsx("input", {
					className: inputCls$1,
					placeholder: "Ej. Sesión individual",
					value: form.nombre,
					onChange: (e) => setF({ nombre: e.target.value })
				})] }), /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("label", {
						className: labelCls$1,
						children: "Tipo"
					}),
					/* @__PURE__ */ jsxs("select", {
						className: inputCls$1,
						value: form.tipo,
						onChange: (e) => setF({
							tipo: e.target.value,
							tipoPersonalizado: ""
						}),
						children: [/* @__PURE__ */ jsx("option", {
							value: "",
							children: "Seleccionar tipo"
						}), TIPOS_SERVICIO.map((tipo) => /* @__PURE__ */ jsx("option", {
							value: tipo,
							children: tipo
						}, tipo))]
					}),
					form.tipo === "Otro" && /* @__PURE__ */ jsx("input", {
						className: `${inputCls$1} mt-2`,
						placeholder: "Especifique el tipo de servicio",
						value: form.tipoPersonalizado,
						onChange: (e) => setF({ tipoPersonalizado: e.target.value })
					})
				] })]
			}),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
				className: labelCls$1,
				children: "Descripción"
			}), /* @__PURE__ */ jsx("textarea", {
				rows: 2,
				className: `${inputCls$1} resize-none`,
				placeholder: "Describe el servicio...",
				value: form.descripcion,
				onChange: (e) => setF({ descripcion: e.target.value })
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-3 gap-4",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
						className: labelCls$1,
						children: "Modalidad"
					}), /* @__PURE__ */ jsxs("select", {
						className: inputCls$1,
						value: form.modalidad,
						onChange: (e) => setF({ modalidad: e.target.value }),
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "presencial",
								children: "Presencial"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "virtual",
								children: "Virtual"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "hibrido",
								children: "Híbrido"
							})
						]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
						className: labelCls$1,
						children: "Precio ($)"
					}), /* @__PURE__ */ jsx("input", {
						type: "number",
						min: 0,
						className: inputCls$1,
						placeholder: "0",
						value: form.precio,
						onChange: (e) => setF({ precio: e.target.value })
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
						className: labelCls$1,
						children: "Duración (min)"
					}), /* @__PURE__ */ jsx("input", {
						type: "number",
						min: 1,
						className: inputCls$1,
						placeholder: "50",
						value: form.duracion,
						onChange: (e) => setF({ duracion: e.target.value })
					})] })
				]
			}),
			needsLocation && /* @__PURE__ */ jsxs("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("label", {
						className: labelCls$1,
						children: "Dirección / Ubicación"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "relative",
						children: [/* @__PURE__ */ jsx("input", {
							className: inputCls$1,
							placeholder: "Ej. Av. Arequipa 123, Lima",
							value: form.ubicacion,
							onChange: (e) => handleAddressInput(e.target.value)
						}), geocoding && /* @__PURE__ */ jsx("span", {
							className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted pointer-events-none",
							children: "Buscando..."
						})]
					}),
					geocodingError ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-red-500 mt-1",
						children: geocodingError
					}) : locationConfirmed ? /* @__PURE__ */ jsx("p", {
						className: "text-xs text-emerald-600 mt-1",
						children: "✓ Ubicación confirmada en el mapa"
					}) : /* @__PURE__ */ jsx("p", {
						className: "text-xs text-ink-muted mt-1",
						children: "Escribí la dirección para ubicarla en el mapa, o arrastrá el pin"
					})
				] }), /* @__PURE__ */ jsx(MapPicker, {
					lat: form.latitud,
					lng: form.longitud,
					onDragEnd: handleMapDragEnd
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
					className: labelCls$1,
					children: "Pausa entre turnos (min)"
				}), /* @__PURE__ */ jsx("input", {
					type: "number",
					min: 0,
					className: inputCls$1,
					placeholder: "10",
					value: form.pausa,
					onChange: (e) => setF({ pausa: e.target.value })
				})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
					className: labelCls$1,
					children: "Cancelación mínima (hs)"
				}), /* @__PURE__ */ jsx("input", {
					type: "number",
					min: 0,
					className: inputCls$1,
					placeholder: "24",
					value: form.min_cancelacion,
					onChange: (e) => setF({ min_cancelacion: e.target.value })
				})] })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex justify-end gap-2 pt-1",
				children: [/* @__PURE__ */ jsx("button", {
					onClick: onCancel,
					className: "border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors cursor-pointer",
					children: "Cancelar"
				}), /* @__PURE__ */ jsx("button", {
					onClick: onSave,
					disabled: !canSave,
					title: needsLocation && !locationConfirmed ? "Confirmá la ubicación en el mapa" : void 0,
					className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
					children: saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear servicio"
				})]
			})
		]
	});
}
function EditIcon$1() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "15",
		height: "15",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), /* @__PURE__ */ jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })]
	});
}
function TrashIcon$1() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "15",
		height: "15",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("polyline", { points: "3 6 5 6 21 6" }),
			/* @__PURE__ */ jsx("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
			/* @__PURE__ */ jsx("path", { d: "M10 11v6M14 11v6" }),
			/* @__PURE__ */ jsx("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })
		]
	});
}
function CloseIcon$1() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ jsx("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
function PinIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "11",
		height: "11",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }), /* @__PURE__ */ jsx("circle", {
			cx: "12",
			cy: "10",
			r: "3"
		})]
	});
}
//#endregion
//#region app/routes/professional/service-packages.tsx
var service_packages_exports = /* @__PURE__ */ __exportAll({ default: () => service_packages_default });
var EMPTY_FORM = {
	nombre: "",
	descripcion: "",
	precio_total: "",
	items: []
};
var inputCls = "w-full border border-border rounded px-3 py-2 text-sm bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink";
var labelCls = "block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5";
var SVC_COLORS = [
	"bg-violet-100 text-violet-700",
	"bg-orange-100 text-orange-700",
	"bg-teal-100   text-teal-700",
	"bg-rose-100   text-rose-700",
	"bg-amber-100  text-amber-700",
	"bg-sky-100    text-sky-700"
];
var service_packages_default = UNSAFE_withComponentProps(function ServicePackages() {
	const { token } = useAuth();
	const [servicios, setServicios] = useState([]);
	const [paquetes, setPaquetes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [deletingId, setDeletingId] = useState(null);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState({ ...EMPTY_FORM });
	const [toast, setToast] = useState(null);
	const showToast = (msg, ok = true) => {
		setToast({
			msg,
			ok
		});
		setTimeout(() => setToast(null), 3e3);
	};
	const fetchAll = async () => {
		setLoading(true);
		try {
			const [svcRes, pkgRes] = await Promise.all([api.get("/mis-servicios", token), api.get("/mis-paquetes", token)]);
			if (svcRes?.success) setServicios(svcRes.data);
			if (Array.isArray(pkgRes)) setPaquetes(pkgRes);
			else if (pkgRes?.success) setPaquetes(pkgRes.data);
		} catch {
			setPaquetes([]);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchAll();
	}, [token]);
	const openCreate = () => {
		setEditingId(null);
		setDeletingId(null);
		setForm({ ...EMPTY_FORM });
		setCreating(true);
	};
	const openEdit = (pkg) => {
		setCreating(false);
		setDeletingId(null);
		setForm({
			nombre: pkg.nombre,
			descripcion: pkg.descripcion,
			precio_total: String(pkg.precio_total),
			items: pkg.servicios.map((s) => ({
				servicio_id: s.servicio_id,
				cantidad_sesiones: s.pivot?.cantidad_sesiones ?? s.cantidad_sesiones ?? 1,
				ubicacion: s.ubicacion ?? ""
			}))
		});
		setEditingId(editingId === pkg.paquete_id ? null : pkg.paquete_id);
	};
	const closeAll = () => {
		setEditingId(null);
		setCreating(false);
		setDeletingId(null);
		setForm({ ...EMPTY_FORM });
	};
	const addItem = (svc) => {
		if (form.items.some((i) => i.servicio_id === svc.servicio_id)) return;
		setForm((f) => ({
			...f,
			items: [...f.items, {
				servicio_id: svc.servicio_id,
				cantidad_sesiones: 1,
				ubicacion: ""
			}]
		}));
	};
	const removeItem = (id) => setForm((f) => ({
		...f,
		items: f.items.filter((i) => i.servicio_id !== id)
	}));
	const updateItem = (id, patch) => setForm((f) => ({
		...f,
		items: f.items.map((i) => i.servicio_id === id ? {
			...i,
			...patch
		} : i)
	}));
	const subtotal = useMemo(() => form.items.reduce((acc, item) => {
		return acc + (servicios.find((s) => s.servicio_id === item.servicio_id)?.precio ?? 0) * item.cantidad_sesiones;
	}, 0), [form.items, servicios]);
	const handleSave = async () => {
		if (!form.nombre.trim()) return showToast("El nombre es requerido", false);
		if (form.items.length === 0) return showToast("Agregá al menos un servicio", false);
		const body = {
			nombre: form.nombre,
			descripcion: form.descripcion,
			precio_total: Number(form.precio_total) || subtotal,
			servicios: form.items.map(({ servicio_id, cantidad_sesiones, ubicacion }) => ({
				servicio_id,
				cantidad_sesiones,
				...ubicacion ? { ubicacion } : {}
			}))
		};
		setSaving(true);
		try {
			if (editingId !== null) {
				await api.put(`/paquetes/${editingId}`, body, token);
				showToast("Paquete actualizado");
			} else {
				await api.post("/paquetes", body, token);
				showToast("Paquete creado");
			}
			closeAll();
			fetchAll();
		} catch (e) {
			showToast(e.message ?? "Error al guardar", false);
		} finally {
			setSaving(false);
		}
	};
	const handleDelete = async (id) => {
		setSaving(true);
		try {
			await api.delete(`/paquetes/${id}`, token);
			showToast("Paquete eliminado");
			setDeletingId(null);
			fetchAll();
		} catch (e) {
			showToast(e.message ?? "Error al eliminar", false);
		} finally {
			setSaving(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [
			toast && /* @__PURE__ */ jsx("div", {
				className: `fixed top-5 right-5 z-50 px-4 py-3 rounded border text-sm font-semibold shadow-lg transition-all ${toast.ok ? "bg-accent text-ink border-ink/20" : "bg-red-100 text-red-800 border-red-200"}`,
				children: toast.msg
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Paquetes"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-ink-muted mt-0.5",
					children: loading ? "Cargando..." : `${paquetes.length} paquete${paquetes.length !== 1 ? "s" : ""} creado${paquetes.length !== 1 ? "s" : ""}`
				})] }), /* @__PURE__ */ jsx("button", {
					onClick: () => creating ? closeAll() : openCreate(),
					className: `px-4 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${creating ? "bg-border text-ink-muted" : "bg-ink text-white hover:bg-primary"}`,
					children: creating ? "Cancelar" : /* @__PURE__ */ jsx("b", { children: "+ Nuevo paquete" })
				})]
			}),
			creating && /* @__PURE__ */ jsx(PackageForm, {
				form,
				setForm,
				servicios,
				subtotal,
				saving,
				isEdit: false,
				onSave: handleSave,
				onCancel: closeAll,
				addItem,
				removeItem,
				updateItem
			}),
			loading && /* @__PURE__ */ jsx("div", {
				className: "bg-surface border border-border rounded p-12 text-center text-ink-muted text-sm",
				children: "Cargando paquetes..."
			}),
			!loading && paquetes.length === 0 && !creating && /* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-12 text-center",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "font-display text-xl text-ink mb-1",
						children: "Sin paquetes aún"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-ink-muted text-sm mb-5",
						children: "Creá tu primer paquete de servicios"
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: openCreate,
						className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors cursor-pointer",
						children: "+ Nuevo paquete"
					})
				]
			}),
			!loading && paquetes.length > 0 && /* @__PURE__ */ jsx("div", {
				className: "space-y-0 bg-surface border border-border rounded overflow-hidden",
				children: paquetes.map((pkg, idx) => {
					const isEditing = editingId === pkg.paquete_id;
					const isDeleting = deletingId === pkg.paquete_id;
					const totalSesiones = pkg.servicios?.reduce((acc, s) => acc + (s.pivot?.cantidad_sesiones ?? s.cantidad_sesiones ?? 1), 0) ?? 0;
					return /* @__PURE__ */ jsxs("div", {
						className: `${idx > 0 ? "border-t border-border" : ""} ${editingId !== null && !isEditing ? "opacity-40 pointer-events-none" : "transition-opacity"}`,
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: `flex items-center px-5 py-4 gap-6 ${isEditing || isDeleting ? "bg-accent/10" : ""}`,
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "min-w-0 w-40 shrink-0",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-semibold text-ink truncate",
											children: pkg.nombre
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-xs text-ink-muted mt-0.5",
											children: [
												totalSesiones,
												" sesión",
												totalSesiones !== 1 ? "es" : ""
											]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex-1 grid grid-cols-2 gap-1.5",
										style: { maxWidth: 420 },
										children: [pkg.servicios?.slice(0, 6).map((s, si) => /* @__PURE__ */ jsx("span", {
											className: `text-xs px-2.5 py-1 rounded font-medium truncate ${SVC_COLORS[si % SVC_COLORS.length]}`,
											children: s.nombre ?? `Servicio #${s.servicio_id}`
										}, s.servicio_id)), (pkg.servicios?.length ?? 0) > 6 && /* @__PURE__ */ jsxs("span", {
											className: "text-xs text-ink-muted px-2 py-1",
											children: [
												"+",
												pkg.servicios.length - 6,
												" más"
											]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "font-display text-sm font-bold text-ink whitespace-nowrap ml-auto",
										children: ["$ ", Number(pkg.precio_total).toFixed(0)]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-1 shrink-0",
										children: [/* @__PURE__ */ jsx("button", {
											onClick: () => openEdit(pkg),
											title: "Editar",
											className: `p-1.5 rounded transition-colors cursor-pointer ${isEditing ? "bg-ink text-white" : "hover:bg-border/40 text-ink-muted hover:text-ink"}`,
											children: /* @__PURE__ */ jsx(EditIcon, {})
										}), /* @__PURE__ */ jsx("button", {
											onClick: () => setDeletingId(isDeleting ? null : pkg.paquete_id),
											title: "Eliminar",
											className: `p-1.5 rounded transition-colors cursor-pointer ${isDeleting ? "bg-red-500 text-white" : "hover:bg-border/40 text-ink-muted hover:text-red-500"}`,
											children: /* @__PURE__ */ jsx(TrashIcon, {})
										})]
									})
								]
							}),
							isDeleting && /* @__PURE__ */ jsxs("div", {
								className: "px-5 py-4 border-t border-border bg-red-50 flex items-center justify-between gap-4",
								children: [/* @__PURE__ */ jsxs("p", {
									className: "text-sm text-red-700",
									children: [
										"¿Eliminar ",
										/* @__PURE__ */ jsxs("span", {
											className: "font-semibold",
											children: [
												"\"",
												pkg.nombre,
												"\""
											]
										}),
										"? Esta acción no se puede deshacer."
									]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex gap-2 shrink-0",
									children: [/* @__PURE__ */ jsx("button", {
										onClick: () => setDeletingId(null),
										className: "px-3 py-1.5 rounded border border-border bg-white text-sm text-ink font-medium hover:bg-bg transition-colors cursor-pointer",
										children: "Cancelar"
									}), /* @__PURE__ */ jsx("button", {
										onClick: () => handleDelete(pkg.paquete_id),
										disabled: saving,
										className: "px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer",
										children: saving ? "Eliminando..." : "Eliminar"
									})]
								})]
							}),
							isEditing && /* @__PURE__ */ jsx("div", {
								className: "border-t border-border",
								children: /* @__PURE__ */ jsx(PackageForm, {
									form,
									setForm,
									servicios,
									subtotal,
									saving,
									isEdit: true,
									onSave: handleSave,
									onCancel: closeAll,
									addItem,
									removeItem,
									updateItem
								})
							})
						]
					}, pkg.paquete_id);
				})
			})
		]
	});
});
function PackageForm({ form, setForm, servicios, subtotal, saving, isEdit, onSave, onCancel, addItem, removeItem, updateItem }) {
	const available = servicios.filter((s) => !form.items.some((i) => i.servicio_id === s.servicio_id));
	return /* @__PURE__ */ jsxs("div", {
		className: "bg-white border border-border rounded p-5 space-y-5",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs font-bold text-ink-muted uppercase tracking-widest",
					children: isEdit ? "Editar paquete" : "Nuevo paquete"
				}), /* @__PURE__ */ jsx("button", {
					onClick: onCancel,
					className: "text-ink-muted hover:text-ink transition-colors cursor-pointer",
					children: /* @__PURE__ */ jsx(CloseIcon, {})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "col-span-2",
						children: [/* @__PURE__ */ jsx("label", {
							className: labelCls,
							children: "Nombre del paquete"
						}), /* @__PURE__ */ jsx("input", {
							className: inputCls,
							placeholder: "Ej. Pack mensual de bienestar",
							value: form.nombre,
							onChange: (e) => setForm((f) => ({
								...f,
								nombre: e.target.value
							}))
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "col-span-2",
						children: [/* @__PURE__ */ jsx("label", {
							className: labelCls,
							children: "Descripción"
						}), /* @__PURE__ */ jsx("textarea", {
							rows: 2,
							className: `${inputCls} resize-none`,
							placeholder: "Descripción visible para el cliente",
							value: form.descripcion,
							onChange: (e) => setForm((f) => ({
								...f,
								descripcion: e.target.value
							}))
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("label", {
							className: labelCls,
							children: "Precio final ($)"
						}),
						/* @__PURE__ */ jsx("input", {
							type: "number",
							min: 0,
							className: inputCls,
							placeholder: `Sugerido: $${subtotal}`,
							value: form.precio_total,
							onChange: (e) => setForm((f) => ({
								...f,
								precio_total: e.target.value
							}))
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-ink-muted mt-1",
							children: ["Subtotal por sesiones: $", subtotal]
						})
					] })
				]
			}),
			form.items.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: labelCls,
				children: "Servicios incluidos"
			}), /* @__PURE__ */ jsx("div", {
				className: "space-y-3",
				children: form.items.map((item) => {
					const svc = servicios.find((s) => s.servicio_id === item.servicio_id);
					if (!svc) return null;
					const isPresencial = svc.modalidad?.toLowerCase().includes("presencial");
					return /* @__PURE__ */ jsxs("div", {
						className: "border border-border rounded bg-surface p-4 space-y-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-semibold text-ink",
									children: svc.nombre
								}), /* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted",
									children: [
										"$",
										svc.precio,
										" · ",
										svc.duracion,
										" min · ",
										svc.modalidad
									]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 shrink-0",
								children: [
									/* @__PURE__ */ jsx("label", {
										className: "text-xs text-ink-muted",
										children: "Sesiones"
									}),
									/* @__PURE__ */ jsx("input", {
										type: "number",
										min: 1,
										className: "w-16 border border-border rounded px-2 py-1 text-sm bg-white text-ink text-center focus:outline-none focus:ring-2 focus:ring-ink",
										value: item.cantidad_sesiones,
										onChange: (e) => updateItem(item.servicio_id, { cantidad_sesiones: Math.max(1, Number(e.target.value)) })
									}),
									/* @__PURE__ */ jsx("button", {
										onClick: () => removeItem(item.servicio_id),
										className: "text-ink-muted hover:text-red-500 transition-colors cursor-pointer p-1",
										title: "Quitar",
										children: /* @__PURE__ */ jsx(CloseIcon, {})
									})
								]
							})]
						}), isPresencial && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: labelCls,
							children: "Dirección / Ubicación"
						}), /* @__PURE__ */ jsx("input", {
							className: inputCls,
							placeholder: "Ej. Av. Corrientes 1234, CABA",
							value: item.ubicacion,
							onChange: (e) => updateItem(item.servicio_id, { ubicacion: e.target.value })
						})] })]
					}, item.servicio_id);
				})
			})] }),
			available.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: labelCls,
				children: "Agregar servicio"
			}), /* @__PURE__ */ jsx("div", {
				className: "space-y-2",
				children: available.map((svc) => /* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between border border-border rounded px-4 py-3 bg-surface hover:bg-bg transition-colors",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-ink",
						children: svc.nombre
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-xs text-ink-muted",
						children: [
							"$",
							svc.precio,
							" · ",
							svc.duracion,
							" min · ",
							svc.modalidad
						]
					})] }), /* @__PURE__ */ jsx("button", {
						onClick: () => addItem(svc),
						className: "text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded hover:bg-primary transition-colors cursor-pointer",
						children: "+ Agregar"
					})]
				}, svc.servicio_id))
			})] }),
			available.length === 0 && form.items.length === 0 && /* @__PURE__ */ jsx("p", {
				className: "text-sm text-ink-muted text-center py-4",
				children: "No tenés servicios creados. Primero creá servicios individuales."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between pt-2",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-sm text-ink-muted",
					children: form.items.length > 0 && /* @__PURE__ */ jsxs("span", { children: [
						form.items.reduce((a, i) => a + i.cantidad_sesiones, 0),
						" sesiones ·",
						" ",
						/* @__PURE__ */ jsxs("span", {
							className: "font-semibold text-ink",
							children: ["Subtotal $", subtotal]
						})
					] })
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: onCancel,
						className: "border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink transition-colors cursor-pointer",
						children: "Cancelar"
					}), /* @__PURE__ */ jsx("button", {
						onClick: onSave,
						disabled: saving,
						className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer",
						children: saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear paquete"
					})]
				})]
			})
		]
	});
}
function EditIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "15",
		height: "15",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), /* @__PURE__ */ jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })]
	});
}
function TrashIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "15",
		height: "15",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("polyline", { points: "3 6 5 6 21 6" }),
			/* @__PURE__ */ jsx("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
			/* @__PURE__ */ jsx("path", { d: "M10 11v6M14 11v6" }),
			/* @__PURE__ */ jsx("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })
		]
	});
}
function CloseIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ jsx("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		})]
	});
}
//#endregion
//#region app/routes/professional/availability.tsx
var availability_exports = /* @__PURE__ */ __exportAll({ default: () => availability_default });
var DAYS = [
	"LUN",
	"MAR",
	"MIÉ",
	"JUE",
	"VIE",
	"SÁB",
	"DOM"
];
var KEY_TO_DIA = {
	LUN: "lunes",
	MAR: "martes",
	MIÉ: "miercoles",
	JUE: "jueves",
	VIE: "viernes",
	SÁB: "sabado",
	DOM: "domingo"
};
var DIA_TO_KEY = Object.fromEntries(Object.entries(KEY_TO_DIA).map(([k, v]) => [v, k]));
var GRID_START = 8;
var GRID_END = 22;
var HOUR_PX = 40;
var SNAP = .5;
var HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => `${String(i + GRID_START).padStart(2, "0")}:00`);
var DEFAULT_SLOTS = Object.fromEntries(DAYS.map((d) => [d, {
	active: false,
	blocks: []
}]));
function hourToTime(h) {
	const hh = Math.floor(h);
	const mm = Math.round(h % 1 * 60);
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function timeToHour(t) {
	const [h, m] = t.split(":").map(Number);
	return h + m / 60;
}
function snapTo(raw, step) {
	return Math.round(raw / step) * step;
}
function getPeriod(start) {
	if (start < 13) return "Mañana";
	if (start < 20) return "Tarde";
	return "Noche";
}
function generateDefaultBlocks() {
	return [{
		start: 9,
		end: 13
	}];
}
function dispsToSlots(data) {
	const slots = structuredClone(DEFAULT_SLOTS);
	for (const d of data) {
		const key = DIA_TO_KEY[d.dia_semana];
		if (!key) continue;
		slots[key].active = true;
		slots[key].blocks.push({
			start: timeToHour(d.hora_inicio),
			end: timeToHour(d.hora_fin),
			modalidad: d.modalidad
		});
	}
	return slots;
}
function slotsToDisps(slots) {
	return Object.entries(slots).filter(([, day]) => day.active && day.blocks.length > 0).flatMap(([key, day]) => day.blocks.map((b) => ({
		dia_semana: KEY_TO_DIA[key],
		hora_inicio: hourToTime(b.start),
		hora_fin: hourToTime(b.end),
		modalidad: b.modalidad
	})));
}
function calcTurnos(block, duracion, pausa) {
	return Math.floor((block.end - block.start) * 60 / (duracion + pausa));
}
function resolveCollision(proposed, duration, others, step, originalStart) {
	const sorted = [...others].sort((a, b) => a.start - b.start);
	const free = [];
	let cursor = GRID_START;
	for (const o of sorted) {
		if (o.start > cursor) free.push([cursor, o.start]);
		cursor = Math.max(cursor, o.end);
	}
	if (cursor < GRID_END) free.push([cursor, GRID_END]);
	for (const [fs, fe] of free) if (proposed >= fs && proposed + duration <= fe) return proposed;
	let best = originalStart;
	let bestDist = Infinity;
	for (const [fs, fe] of free) {
		if (fe - fs < duration) continue;
		const snapped = snapTo(Math.max(fs, Math.min(fe - duration, proposed)), step);
		const final = Math.max(fs, Math.min(fe - duration, snapped));
		const dist = Math.abs(final - proposed);
		if (dist < bestDist) {
			bestDist = dist;
			best = final;
		}
	}
	return best;
}
var Toggle = ({ checked, onChange }) => /* @__PURE__ */ jsx("button", {
	onMouseDown: (e) => e.stopPropagation(),
	onClick: (e) => {
		e.stopPropagation();
		onChange();
	},
	className: `relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? "bg-ink" : "bg-border"}`,
	children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}` })
});
function AvailabilitySkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto animate-pulse",
		children: [
			/* @__PURE__ */ jsx("div", { className: "h-3 w-24 bg-border/50 rounded mb-4" }),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between mb-4 gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ jsx("div", { className: "h-8 w-48 bg-border/50 rounded" }), /* @__PURE__ */ jsx("div", { className: "h-4 w-72 bg-border/30 rounded" })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ jsx("div", { className: "h-9 w-44 bg-border/30 rounded-lg" }), /* @__PURE__ */ jsx("div", { className: "h-9 w-36 bg-border/50 rounded" })]
				})]
			}),
			/* @__PURE__ */ jsx("div", { className: "h-12 bg-surface border border-border rounded-xl mb-5" }),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsx("div", {
					className: "lg:col-span-2 bg-surface border border-border rounded-2xl overflow-x-auto",
					children: /* @__PURE__ */ jsxs("div", {
						style: { minWidth: "520px" },
						children: [/* @__PURE__ */ jsxs("div", {
							className: "grid h-16 border-b border-border",
							style: { gridTemplateColumns: "56px repeat(7, 1fr)" },
							children: [/* @__PURE__ */ jsx("div", { className: "border-r border-border" }), DAYS.map((d) => /* @__PURE__ */ jsx("div", { className: "border-r border-border last:border-r-0" }, d))]
						}), Array.from({ length: 10 }).map((_, i) => /* @__PURE__ */ jsxs("div", {
							className: "grid border-b border-border/30",
							style: { gridTemplateColumns: "56px repeat(7, 1fr)" },
							children: [/* @__PURE__ */ jsx("div", { className: "h-10 border-r border-border/40" }), DAYS.map((d) => /* @__PURE__ */ jsx("div", { className: "h-10 border-r border-border/20 last:border-r-0" }, d))]
						}, i))]
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ jsx("div", { className: "bg-surface border border-border rounded-2xl h-96" }), /* @__PURE__ */ jsx("div", { className: "bg-surface border border-border rounded-2xl h-24" })]
				})]
			})
		]
	});
}
var availability_default = UNSAFE_withComponentProps(function Availability() {
	const { token } = useAuth();
	const [servicios, setServicios] = useState([]);
	const [loadingServicios, setLoadingServicios] = useState(true);
	const [selectedId, setSelectedId] = useState(null);
	const [slots, setSlots] = useState(structuredClone(DEFAULT_SLOTS));
	const [loadingDisp, setLoadingDisp] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(null);
	const [drag, setDrag] = useState(null);
	const [selectedBlock, setSelectedBlock] = useState(null);
	const dragMoved = useRef(false);
	const [rules, setRules] = useState({
		aviso: "24",
		reservas: "60",
		cancelacion: "24"
	});
	const [showExcepciones, setShowExcepciones] = useState(false);
	const [showNuevaExcepcion, setShowNuevaExcepcion] = useState(false);
	const [nuevaExcepcion, setNuevaExcepcion] = useState({
		fecha_inicio: "",
		fecha_fin: "",
		diaCompleto: true,
		hora_inicio: "",
		hora_fin: "",
		motivo: ""
	});
	const [excepciones, setExcepciones] = useState([]);
	const [errorExcepcion, setErrorExcepcion] = useState("");
	useEffect(() => {
		setLoadingServicios(true);
		api.get("/mis-servicios", token).then((res) => {
			if (res.success && res.data.length > 0) {
				setServicios(res.data);
				setSelectedId(res.data[0].servicio_id);
			}
		}).catch(() => {}).finally(() => setLoadingServicios(false));
	}, [token]);
	useEffect(() => {
		if (!selectedId || servicios.length === 0) return;
		setLoadingDisp(true);
		setError(null);
		api.get(`/servicios/${selectedId}/disponibilidad`).then((res) => {
			setSlots(res.success && res.data.length > 0 ? dispsToSlots(res.data) : structuredClone(DEFAULT_SLOTS));
		}).catch(() => setSlots(structuredClone(DEFAULT_SLOTS))).finally(() => setLoadingDisp(false));
	}, [selectedId, servicios]);
	useEffect(() => {
		const servicio = servicios.find((s) => s.servicio_id === selectedId);
		if (!servicio) return;
		setRules({
			aviso: String(servicio.min_aviso ?? 24),
			reservas: String(servicio.max_anticipacion_dias ?? 60),
			cancelacion: String(servicio.min_cancelacion ?? 24)
		});
	}, [selectedId, servicios]);
	useEffect(() => {
		if (!showExcepciones) return;
		api.get("/excepciones", token).then((res) => {
			if (res.success) setExcepciones(res.data);
		}).catch(console.error);
	}, [showExcepciones, token]);
	useEffect(() => {
		if (!drag) return;
		const onMove = (e) => {
			const deltaY = e.clientY - drag.startY;
			if (Math.abs(deltaY) > 4) dragMoved.current = true;
			setSlots((prev) => {
				const allBlocks = prev[drag.day].blocks;
				const others = allBlocks.filter((_, i) => i !== drag.blockIdx);
				const blocks = allBlocks.map((b, i) => {
					if (i !== drag.blockIdx) return b;
					const duration = drag.originalEnd - drag.originalStart;
					if (drag.mode === "move") {
						const rawStart = drag.originalStart + deltaY / HOUR_PX;
						const start = resolveCollision(snapTo(Math.max(GRID_START, Math.min(GRID_END - duration, rawStart)), drag.snap), duration, others, drag.snap, drag.originalStart);
						return {
							start,
							end: start + duration
						};
					} else if (drag.mode === "resize-bottom") {
						const rawEnd = drag.originalEnd + deltaY / HOUR_PX;
						const end = snapTo(Math.max(drag.originalStart + drag.minDuration, Math.min(GRID_END, rawEnd)), drag.snap);
						const maxEnd = others.filter((o) => o.start >= drag.originalEnd - .01).reduce((m, o) => Math.min(m, o.start), GRID_END);
						return {
							...b,
							end: Math.min(end, maxEnd)
						};
					} else {
						const rawStart = drag.originalStart + deltaY / HOUR_PX;
						const start = snapTo(Math.max(GRID_START, Math.min(drag.originalEnd - drag.minDuration, rawStart)), drag.snap);
						const minStart = others.filter((o) => o.end <= drag.originalStart + .01).reduce((m, o) => Math.max(m, o.end), GRID_START);
						return {
							...b,
							start: Math.max(start, minStart)
						};
					}
				});
				return {
					...prev,
					[drag.day]: {
						...prev[drag.day],
						blocks
					}
				};
			});
		};
		const onUp = () => setDrag(null);
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [drag]);
	const selectedServicio = servicios.find((s) => s.servicio_id === selectedId);
	const toggleDay = (day) => {
		setSlots((prev) => ({
			...prev,
			[day]: prev[day].active ? {
				active: false,
				blocks: []
			} : {
				active: true,
				blocks: generateDefaultBlocks()
			}
		}));
	};
	const addBlock = (day) => {
		const daySlot = slots[day];
		const last = daySlot.blocks[daySlot.blocks.length - 1];
		const newStart = last ? Math.min(last.end + 1, GRID_END - 2) : 9;
		const interval = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : 1;
		const newEnd = Math.min(newStart + Math.max(interval * 2, 1), GRID_END);
		if (newEnd > GRID_END || newStart >= GRID_END - .5) return;
		const newBi = daySlot.blocks.length;
		setSlots((prev) => ({
			...prev,
			[day]: {
				active: true,
				blocks: [...prev[day].blocks, {
					start: newStart,
					end: newEnd,
					modalidad: selectedServicio?.modalidad === "hibrido" ? "presencial" : void 0
				}]
			}
		}));
		setSelectedBlock({
			day,
			bi: newBi
		});
	};
	const removeBlock = (day, blockIdx) => {
		setSlots((prev) => {
			const daySlot = prev[day];
			const blocks = daySlot.blocks.filter((_, i) => i !== blockIdx);
			return {
				...prev,
				[day]: {
					...daySlot,
					blocks
				}
			};
		});
		setSelectedBlock(null);
	};
	const updateBlockTime = (day, blockIdx, field, timeStr) => {
		const h = timeToHour(timeStr);
		if (isNaN(h)) return;
		const interval = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : SNAP;
		setSlots((prev) => {
			const blocks = prev[day].blocks.map((b, i) => {
				if (i !== blockIdx) return b;
				if (field === "start") {
					const clamped = Math.max(GRID_START, Math.min(b.end - interval, h));
					return {
						...b,
						start: clamped
					};
				} else {
					const clamped = Math.min(GRID_END, Math.max(b.start + interval, h));
					return {
						...b,
						end: clamped
					};
				}
			});
			return {
				...prev,
				[day]: {
					...prev[day],
					blocks
				}
			};
		});
	};
	const addTurn = (day, blockIdx) => {
		if (!selectedServicio) return;
		const interval = (selectedServicio.duracion + selectedServicio.pausa) / 60;
		setSlots((prev) => {
			const daySlot = prev[day];
			const blocks = daySlot.blocks.map((b, i) => {
				if (i !== blockIdx) return b;
				const newEnd = b.end + interval;
				if (newEnd > GRID_END) return b;
				const nextBlock = daySlot.blocks.find((ob, oi) => oi !== blockIdx && ob.start >= b.end - .01);
				if (nextBlock && newEnd > nextBlock.start) return b;
				return {
					...b,
					end: newEnd
				};
			});
			return {
				...prev,
				[day]: {
					...daySlot,
					blocks
				}
			};
		});
	};
	const removeTurn = (day, blockIdx) => {
		if (!selectedServicio) return;
		const interval = (selectedServicio.duracion + selectedServicio.pausa) / 60;
		setSlots((prev) => {
			const daySlot = prev[day];
			const blocks = daySlot.blocks.map((b, i) => {
				if (i !== blockIdx) return b;
				const current = calcTurnos(b, selectedServicio.duracion, selectedServicio.pausa);
				if (current <= 1) return b;
				return {
					...b,
					end: b.start + (current - 1) * interval
				};
			});
			return {
				...prev,
				[day]: {
					...daySlot,
					blocks
				}
			};
		});
	};
	const startDrag = (e, day, blockIdx, mode) => {
		e.preventDefault();
		e.stopPropagation();
		dragMoved.current = false;
		const block = slots[day].blocks[blockIdx];
		const minDuration = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : SNAP;
		setDrag({
			day,
			blockIdx,
			mode,
			startY: e.clientY,
			originalStart: block.start,
			originalEnd: block.end,
			snap: SNAP,
			minDuration
		});
	};
	const handleSave = async () => {
		if (!selectedId) return;
		setSaving(true);
		setError(null);
		try {
			const res = await api.put(`/servicios/${selectedId}/disponibilidad`, {
				disponibilidades: slotsToDisps(slots),
				min_aviso: Number(rules.aviso),
				min_cancelacion: Number(rules.cancelacion),
				max_anticipacion_dias: Number(rules.reservas)
			}, token);
			if (res.success) {
				setSaved(true);
				setTimeout(() => setSaved(false), 3e3);
			} else setError(res.message ?? "Error al guardar");
		} catch (e) {
			setError(e.message ?? "Error al guardar");
		} finally {
			setSaving(false);
		}
	};
	const hoy = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const handleCrearExcepcion = async () => {
		if (!nuevaExcepcion.fecha_inicio || !nuevaExcepcion.fecha_fin) return;
		try {
			await api.post("/excepciones", {
				fecha_desde: nuevaExcepcion.fecha_inicio,
				fecha_hasta: nuevaExcepcion.fecha_fin,
				hora_inicio: nuevaExcepcion.diaCompleto ? null : nuevaExcepcion.hora_inicio,
				hora_fin: nuevaExcepcion.diaCompleto ? null : nuevaExcepcion.hora_fin,
				motivo: nuevaExcepcion.motivo
			}, token);
			setShowNuevaExcepcion(false);
			const res = await api.get("/excepciones", token);
			if (res.success) setExcepciones(res.data);
		} catch (e) {
			setErrorExcepcion(e instanceof Error ? e.message : "Error al crear excepción");
		}
	};
	const handleDeleteExcepcion = async (id) => {
		try {
			await api.delete(`/excepciones/${id}`, token);
			setExcepciones((prev) => prev.filter((e) => e.excepcion_id !== id));
		} catch (error) {
			alert("Error al eliminar excepción");
		}
	};
	const isDragging = drag !== null;
	if (loadingServicios) return /* @__PURE__ */ jsx(AvailabilitySkeleton, {});
	return /* @__PURE__ */ jsxs("div", {
		className: `p-4 md:p-8 max-w-6xl mx-auto ${isDragging ? "select-none" : ""}`,
		style: { cursor: isDragging ? drag.mode === "move" ? "grabbing" : "ns-resize" : void 0 },
		children: [
			/* @__PURE__ */ jsx("nav", {
				className: "text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold",
				children: "Configuración"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "font-display text-3xl text-ink",
						children: "Disponibilidad"
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => {
							setErrorExcepcion("");
							setShowNuevaExcepcion(true);
						},
						className: "self-start sm:self-auto px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200",
						children: "Excepciones"
					})]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Definí cuándo aceptás reservas y tus reglas de agenda."
				})]
			}),
			showExcepciones && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
				children: /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ jsx("h2", {
								className: "text-xl font-semibold",
								children: "Excepciones"
							}), /* @__PURE__ */ jsx("button", {
								onClick: () => setShowExcepciones(false),
								className: "text-gray-500 hover:text-gray-700",
								children: "✕"
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex justify-end mb-4",
							children: /* @__PURE__ */ jsx("button", {
								onClick: () => setShowNuevaExcepcion(true),
								className: "px-4 py-2 bg-primary text-white rounded-lg",
								children: "+ Nueva excepción"
							})
						}),
						excepciones.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "text-ink-muted",
							children: "No hay excepciones configuradas."
						}) : /* @__PURE__ */ jsx("div", {
							className: "space-y-3",
							children: excepciones.map((e) => /* @__PURE__ */ jsxs("div", {
								className: "border rounded-xl p-4",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "font-medium",
										children: [e.fecha_desde, e.fecha_desde !== e.fecha_hasta && ` al ${e.fecha_hasta}`]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "text-sm text-ink-muted",
										children: e.hora_inicio && e.hora_fin ? `${e.hora_inicio.slice(0, 5)} - ${e.hora_fin.slice(0, 5)}` : "Día completo"
									}),
									e.motivo && /* @__PURE__ */ jsx("div", {
										className: "text-sm mt-1",
										children: e.motivo
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-3 flex justify-end",
										children: /* @__PURE__ */ jsx("button", {
											onClick: () => handleDeleteExcepcion(e.excepcion_id),
											className: "text-red-600 hover:text-red-700",
											children: "Eliminar"
										})
									})
								]
							}, e.excepcion_id))
						})
					]
				})
			}),
			showNuevaExcepcion && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 bg-black/40 flex items-center justify-center z-[60]",
				children: /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-2xl p-6 w-full max-w-md",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex justify-between items-center mb-4",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-xl font-semibold",
							children: "Nueva excepción"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => setShowNuevaExcepcion(false),
							children: "✕"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium mb-1",
								children: "Desde"
							}), /* @__PURE__ */ jsx("input", {
								type: "date",
								min: hoy,
								value: nuevaExcepcion.fecha_inicio,
								onChange: (e) => setNuevaExcepcion({
									...nuevaExcepcion,
									fecha_inicio: e.target.value
								}),
								className: "w-full border rounded-lg px-3 py-2"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium mb-1",
								children: "Hasta"
							}), /* @__PURE__ */ jsx("input", {
								type: "date",
								min: hoy,
								value: nuevaExcepcion.fecha_fin,
								onChange: (e) => setNuevaExcepcion({
									...nuevaExcepcion,
									fecha_fin: e.target.value
								}),
								className: "w-full border rounded-lg px-3 py-2"
							})] }),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									checked: nuevaExcepcion.diaCompleto,
									onChange: (e) => setNuevaExcepcion({
										...nuevaExcepcion,
										diaCompleto: e.target.checked
									})
								}), /* @__PURE__ */ jsx("span", { children: "Día completo" })]
							}),
							!nuevaExcepcion.diaCompleto && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium mb-1",
								children: "Hora inicio"
							}), /* @__PURE__ */ jsx("input", {
								type: "time",
								value: nuevaExcepcion.hora_inicio,
								onChange: (e) => setNuevaExcepcion({
									...nuevaExcepcion,
									hora_inicio: e.target.value
								}),
								className: "w-full border rounded-lg px-3 py-2"
							})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium mb-1",
								children: "Hora fin"
							}), /* @__PURE__ */ jsx("input", {
								type: "time",
								value: nuevaExcepcion.hora_fin,
								onChange: (e) => setNuevaExcepcion({
									...nuevaExcepcion,
									hora_fin: e.target.value
								}),
								className: "w-full border rounded-lg px-3 py-2"
							})] })] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
								className: "block text-sm font-medium mb-1",
								children: "Motivo"
							}), /* @__PURE__ */ jsx("textarea", {
								value: nuevaExcepcion.motivo,
								onChange: (e) => setNuevaExcepcion({
									...nuevaExcepcion,
									motivo: e.target.value
								}),
								rows: 3,
								className: "w-full border rounded-lg px-3 py-2"
							})] }),
							errorExcepcion && /* @__PURE__ */ jsx("div", {
								className: "bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm",
								children: errorExcepcion
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex justify-end gap-2 pt-2",
								children: [/* @__PURE__ */ jsx("button", {
									onClick: () => setShowNuevaExcepcion(false),
									className: "px-4 py-2 border rounded-lg",
									children: "Cancelar"
								}), /* @__PURE__ */ jsx("button", {
									onClick: handleCrearExcepcion,
									className: "px-4 py-2 bg-primary text-white rounded-lg",
									children: "Guardar"
								})]
							})
						]
					})]
				})
			}),
			servicios.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "mb-5 flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded-xl text-sm flex-wrap",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "relative flex items-center",
					children: [/* @__PURE__ */ jsx("select", {
						value: selectedId ?? "",
						onChange: (e) => setSelectedId(Number(e.target.value)),
						className: "appearance-none font-semibold text-ink bg-transparent pr-5 focus:outline-none cursor-pointer",
						children: servicios.map((s) => /* @__PURE__ */ jsx("option", {
							value: s.servicio_id,
							children: s.nombre
						}, s.servicio_id))
					}), /* @__PURE__ */ jsx("ion-icon", {
						name: "chevron-down-outline",
						style: {
							fontSize: "13px",
							position: "absolute",
							right: 0,
							top: "50%",
							transform: "translateY(-50%)",
							pointerEvents: "none"
						}
					})]
				}), selectedServicio && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx("span", {
						className: "text-border",
						children: "·"
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1 text-ink-muted",
						children: [
							/* @__PURE__ */ jsx("ion-icon", {
								name: "time-outline",
								style: { fontSize: "14px" }
							}),
							selectedServicio.duracion,
							" min"
						]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-border",
						children: "·"
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "text-ink-muted",
						children: ["Pausa ", /* @__PURE__ */ jsxs("strong", {
							className: "text-ink ml-1",
							children: [selectedServicio.pausa, " min"]
						})]
					})
				] })]
			}),
			error && /* @__PURE__ */ jsx("div", {
				className: "mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700",
				children: error
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsx("div", {
					className: "lg:col-span-2 bg-surface border border-border rounded-2xl overflow-x-auto",
					children: loadingDisp ? /* @__PURE__ */ jsx("div", {
						className: "flex items-center justify-center h-64",
						style: { minWidth: "520px" },
						children: /* @__PURE__ */ jsx("span", { className: "w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" })
					}) : /* @__PURE__ */ jsx("div", {
						style: { minWidth: "520px" },
						children: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
							className: "grid border-b border-border",
							style: { gridTemplateColumns: "56px repeat(7, 1fr)" },
							children: [/* @__PURE__ */ jsx("div", { className: "border-r border-border" }), DAYS.map((day) => /* @__PURE__ */ jsxs("div", {
								className: "py-3 px-1 border-r border-border last:border-r-0 flex flex-col items-center gap-1",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs font-bold text-ink-muted uppercase tracking-wide",
										children: day
									}),
									/* @__PURE__ */ jsx(Toggle, {
										checked: slots[day].active,
										onChange: () => toggleDay(day)
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: slots[day].active ? "Activo" : "Off"
									})
								]
							}, day))]
						}), /* @__PURE__ */ jsxs("div", {
							className: "grid",
							style: { gridTemplateColumns: "56px repeat(7, 1fr)" },
							children: [/* @__PURE__ */ jsx("div", {
								className: "border-r border-border",
								children: HOURS.map((h) => /* @__PURE__ */ jsx("div", {
									className: "h-10 border-b border-border/50 flex items-center justify-center px-2",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-xs text-ink-muted",
										children: h
									})
								}, h))
							}), DAYS.map((day) => /* @__PURE__ */ jsxs("div", {
								className: "relative border-r border-border last:border-r-0 overflow-hidden",
								children: [HOURS.map((_, i) => /* @__PURE__ */ jsx("div", {
									className: "h-10 border-b border-border/30 relative",
									children: /* @__PURE__ */ jsx("div", {
										className: "absolute inset-x-0 border-b border-border/15",
										style: { top: "50%" }
									})
								}, i)), slots[day].active && slots[day].blocks.map((block, bi) => {
									const top = (block.start - GRID_START) * HOUR_PX;
									const height = (block.end - block.start) * HOUR_PX;
									const isThis = isDragging && drag?.day === day && drag?.blockIdx === bi;
									const isSel = selectedBlock?.day === day && selectedBlock?.bi === bi;
									const turnos = selectedServicio ? calcTurnos(block, selectedServicio.duracion, selectedServicio.pausa) : null;
									return /* @__PURE__ */ jsxs("div", {
										className: `absolute left-1 right-1 rounded-xl flex flex-col items-center justify-center overflow-hidden transition-shadow ${isSel ? "bg-accent/30 border-2 border-accent shadow-md" : "bg-accent/20 border border-accent/60"}`,
										style: {
											top,
											height,
											cursor: isThis && drag.mode === "move" ? "grabbing" : "grab",
											zIndex: isThis || isSel ? 10 : 1
										},
										onMouseDown: (e) => startDrag(e, day, bi, "move"),
										onClick: () => {
											if (!dragMoved.current) setSelectedBlock({
												day,
												bi
											});
										},
										children: [
											/* @__PURE__ */ jsx("div", {
												className: "absolute top-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-accent/30 transition-colors rounded-t-xl",
												onMouseDown: (e) => startDrag(e, day, bi, "resize-top")
											}),
											height >= 28 && /* @__PURE__ */ jsxs("span", {
												className: "text-xs font-bold text-ink pointer-events-none leading-tight text-center px-2",
												children: [
													hourToTime(block.start),
													" — ",
													hourToTime(block.end)
												]
											}),
											height >= 48 && /* @__PURE__ */ jsx("span", {
												className: "text-xs text-ink-muted pointer-events-none mt-0.5",
												children: getPeriod(block.start)
											}),
											height >= 64 && turnos !== null && /* @__PURE__ */ jsxs("span", {
												className: "text-xs text-ink-muted/70 pointer-events-none mt-0.5",
												children: [
													turnos,
													" turno",
													turnos !== 1 ? "s" : ""
												]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-accent/30 transition-colors rounded-b-xl",
												onMouseDown: (e) => startDrag(e, day, bi, "resize-bottom")
											})
										]
									}, bi);
								})]
							}, day))]
						})] })
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [
						(() => {
							if (!selectedBlock) return /* @__PURE__ */ jsxs("div", {
								className: "bg-surface border border-border rounded-2xl p-5",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3",
										children: "Agregar Turnos"
									}),
									/* @__PURE__ */ jsx("div", {
										className: "grid grid-cols-4 gap-1.5 mb-3",
										children: DAYS.map((d) => /* @__PURE__ */ jsx("button", {
											onClick: () => addBlock(d),
											className: "text-xs py-2 rounded-lg border border-border hover:bg-accent/10 hover:border-accent/50 text-ink font-semibold transition-colors",
											children: d
										}, d))
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted text-center mt-2",
										children: "o hacé clic en un turno para editarlo"
									})
								]
							});
							const { day, bi } = selectedBlock;
							const block = slots[day]?.blocks[bi];
							selectedServicio?.modalidad;
							if (!block) return null;
							const turnos = selectedServicio ? calcTurnos(block, selectedServicio.duracion, selectedServicio.pausa) : null;
							const interval = selectedServicio ? (selectedServicio.duracion + selectedServicio.pausa) / 60 : SNAP;
							const canAdd = block.end + interval <= GRID_END;
							const canRemove = turnos !== null && turnos > 1;
							return /* @__PURE__ */ jsxs("div", {
								className: "bg-surface border border-border rounded-2xl p-5",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-start justify-between mb-4",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("p", {
											className: "text-xs text-ink-muted uppercase tracking-wide font-semibold mb-0.5",
											children: [
												day,
												" · ",
												getPeriod(block.start)
											]
										}), /* @__PURE__ */ jsxs("p", {
											className: "text-base font-bold text-ink",
											children: [
												hourToTime(block.start),
												" — ",
												hourToTime(block.end)
											]
										})] }), /* @__PURE__ */ jsx("button", {
											onClick: () => setSelectedBlock(null),
											className: "w-6 h-6 rounded-full bg-bg hover:bg-border/50 flex items-center justify-center text-ink-muted transition-colors",
											children: /* @__PURE__ */ jsx("ion-icon", {
												name: "close-outline",
												style: { fontSize: "13px" }
											})
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-5",
										children: [
											/* @__PURE__ */ jsx("input", {
												type: "time",
												value: hourToTime(block.start),
												onChange: (e) => updateBlockTime(day, bi, "start", e.target.value),
												className: "flex-1 text-sm border border-border rounded-lg px-2 py-1.5 bg-bg text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-ink-muted text-sm shrink-0",
												children: "—"
											}),
											/* @__PURE__ */ jsx("input", {
												type: "time",
												value: hourToTime(block.end),
												onChange: (e) => updateBlockTime(day, bi, "end", e.target.value),
												className: "flex-1 text-sm border border-border rounded-lg px-2 py-1.5 bg-bg text-ink focus:outline-none focus:ring-1 focus:ring-accent/50"
											})
										]
									}),
									selectedServicio?.modalidad === "hibrido" && /* @__PURE__ */ jsxs("div", {
										className: "mb-5",
										children: [/* @__PURE__ */ jsx("label", {
											className: "block text-sm font-semibold text-ink mb-2",
											children: "Modalidad"
										}), /* @__PURE__ */ jsxs("select", {
											value: block.modalidad || "presencial",
											onChange: (e) => {
												const modalidad = e.target.value;
												setSlots((prev) => ({
													...prev,
													[day]: {
														...prev[day],
														blocks: prev[day].blocks.map((b, i) => i === bi ? {
															...b,
															modalidad
														} : b)
													}
												}));
											},
											className: "w-full text-sm border border-border rounded-lg px-3 py-2 bg-bg text-ink",
											children: [/* @__PURE__ */ jsx("option", {
												value: "presencial",
												children: "Presencial"
											}), /* @__PURE__ */ jsx("option", {
												value: "virtual",
												children: "Virtual"
											})]
										})]
									}),
									turnos !== null && /* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between mb-5",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-sm font-semibold text-ink",
											children: "Turnos"
										}), /* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-3",
											children: [
												/* @__PURE__ */ jsx("button", {
													onClick: () => removeTurn(day, bi),
													disabled: !canRemove,
													className: "w-8 h-8 rounded-lg bg-bg border border-border hover:bg-border/40 disabled:opacity-30 flex items-center justify-center text-ink text-lg font-bold transition-colors",
													children: "−"
												}),
												/* @__PURE__ */ jsxs("span", {
													className: "text-sm font-bold w-20 text-center",
													children: [
														turnos,
														" turno",
														turnos !== 1 ? "s" : ""
													]
												}),
												/* @__PURE__ */ jsx("button", {
													onClick: () => addTurn(day, bi),
													disabled: !canAdd,
													className: "w-8 h-8 rounded-lg bg-bg border border-border hover:bg-border/40 disabled:opacity-30 flex items-center justify-center text-ink text-lg font-bold transition-colors",
													children: "+"
												})
											]
										})]
									}),
									/* @__PURE__ */ jsxs("button", {
										onClick: () => removeBlock(day, bi),
										className: "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors",
										children: [/* @__PURE__ */ jsx("ion-icon", {
											name: "trash-outline",
											style: { fontSize: "14px" }
										}), "Eliminar bloque"]
									})
								]
							});
						})(),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl p-5",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-sm font-bold text-ink mb-4",
								children: "Reglas de la agenda"
							}), /* @__PURE__ */ jsxs("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ jsx("p", {
												className: "text-sm font-semibold text-ink",
												children: "Duración mínima de aviso"
											}), /* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted mt-0.5",
												children: "¿Cuánta anticipación al reservar?"
											})]
										}), /* @__PURE__ */ jsxs("select", {
											value: rules.aviso,
											onChange: (e) => setRules((r) => ({
												...r,
												aviso: e.target.value
											})),
											className: "text-xs border border-border rounded-lg px-2.5 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0",
											children: [
												/* @__PURE__ */ jsx("option", {
													value: "1",
													children: "1 hora"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "2",
													children: "2 horas"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "12",
													children: "12 horas"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "24",
													children: "24 horas"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "48",
													children: "48 horas"
												})
											]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ jsx("p", {
												className: "text-sm font-semibold text-ink",
												children: "Reservas Anticipadas"
											}), /* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted mt-0.5",
												children: "Máximo de días a futuro"
											})]
										}), /* @__PURE__ */ jsxs("select", {
											value: rules.reservas,
											onChange: (e) => setRules((r) => ({
												...r,
												reservas: e.target.value
											})),
											className: "text-xs border border-border rounded-lg px-2.5 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0",
											children: [
												/* @__PURE__ */ jsx("option", {
													value: "7",
													children: "7 días"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "14",
													children: "14 días"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "30",
													children: "30 días"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "60",
													children: "60 días"
												})
											]
										})]
									}),
									/* @__PURE__ */ jsx("div", { className: "border-t border-border/30" }),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-start justify-between gap-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ jsx("p", {
												className: "text-sm font-semibold text-ink",
												children: "Política de Cancelación"
											}), /* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted mt-0.5",
												children: "Tiempo mínimo sin cargo"
											})]
										}), /* @__PURE__ */ jsxs("select", {
											value: rules.cancelacion,
											onChange: (e) => setRules((r) => ({
												...r,
												cancelacion: e.target.value
											})),
											className: "text-xs border border-border rounded-lg px-2.5 py-1.5 bg-bg text-ink font-semibold focus:outline-none shrink-0",
											children: [
												/* @__PURE__ */ jsx("option", {
													value: "12",
													children: "12 horas"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "24",
													children: "24 horas"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "48",
													children: "48 horas"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "72",
													children: "72 horas"
												})
											]
										})]
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							onClick: handleSave,
							disabled: saving || !selectedId,
							className: `w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-green-500 text-white" : "bg-ink text-white hover:bg-primary disabled:opacity-50"}`,
							children: [saving && /* @__PURE__ */ jsx("span", { className: "w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" }), saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"]
						})
					]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/professional/payments.tsx
var payments_exports$1 = /* @__PURE__ */ __exportAll({ default: () => payments_default$1 });
var badgeCls$1 = {
	aprobado: "badge badge-confirmada",
	pendiente: "badge badge-pendiente"
};
var payments_default$1 = UNSAFE_withComponentProps(function Payments() {
	const { token, user } = useAuth();
	const [transactions, setTransactions] = useState([]);
	const [resumen, setResumen] = useState({
		total_mes: 0,
		pagado: 0,
		pendiente: 0
	});
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		if (!token || !user) return;
		Promise.all([api.get("/profesional/pagos", token), api.get("/profesional/pagos/resumen", token)]).then(([pagosRes, resumenRes]) => {
			setTransactions(pagosRes.data ?? []);
			setResumen(resumenRes.data ?? {});
		}).catch(console.error).finally(() => setLoading(false));
	}, [token, user]);
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center justify-between mb-6",
				children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Cobros"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Historial de pagos y liquidaciones"
				})] })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8",
				children: [
					{
						label: "INGRESOS DEL MES",
						value: `$${resumen.total_mes}`,
						sub: "Total generado"
					},
					{
						label: "PAGADO",
						value: `$${resumen.pagado}`,
						sub: "Ya acreditado"
					},
					{
						label: "PENDIENTE",
						value: `$${resumen.pendiente}`,
						sub: "Por liquidar"
					}
				].map((c) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-5",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: c.label
						}),
						/* @__PURE__ */ jsx("p", {
							className: "font-display text-3xl text-ink font-bold",
							children: c.value
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted mt-1",
							children: c.sub
						})
					]
				}, c.label))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "border border-border rounded overflow-x-auto bg-surface",
				children: /* @__PURE__ */ jsx("div", {
					className: "min-w-[520px] w-full",
					children: /* @__PURE__ */ jsxs("div", {
						className: "bg-bg border-b border-border w-full",
						children: [/* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-12 px-5 py-3 w-full",
							children: [
								"FECHA",
								"CLIENTE",
								"SERVICIO",
								"MONTO",
								"ESTADO"
							].map((h, i) => /* @__PURE__ */ jsx("div", {
								className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-2" : i === 1 ? "col-span-3" : i === 2 ? "col-span-4" : i === 3 ? "col-span-2" : "col-span-1 text-center"}`,
								children: h
							}, i))
						}), transactions.map((t, i) => /* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors bg-surface",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-sm text-ink-muted whitespace-nowrap",
										children: t.fecha
									})
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-3",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-sm font-semibold text-ink text-center",
										children: t.cliente
									})
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-4",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-sm text-ink-muted",
										children: t.servicio
									})
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-2",
									children: /* @__PURE__ */ jsxs("span", {
										className: "font-display text-lg font-bold text-ink",
										children: ["$", t.monto]
									})
								}),
								/* @__PURE__ */ jsx("div", {
									className: "col-span-1 text-center",
									children: /* @__PURE__ */ jsx("span", {
										className: badgeCls$1[t.estado] ?? "badge",
										children: t.estado.toUpperCase()
									})
								})
							]
						}, i))]
					})
				})
			})
		]
	});
});
//#endregion
//#region app/routes/professional/messages.tsx
var messages_exports = /* @__PURE__ */ __exportAll({ default: () => messages_default });
var conversations = [
	{
		initials: "LP",
		name: "Lucía Pérez",
		preview: "Antes de la sesión, completá el formulario...",
		time: "1h",
		unread: 2,
		color: "bg-violet-500"
	},
	{
		initials: "CR",
		name: "Carlos Ruiz",
		preview: "¿Podemos mover la sesión del martes?",
		time: "3h",
		unread: 1,
		color: "bg-purple-400"
	},
	{
		initials: "ML",
		name: "Marta López",
		preview: "Muchas gracias por hoy, fue muy útil.",
		time: "ayer",
		unread: 0,
		color: "bg-orange-400"
	},
	{
		initials: "JV",
		name: "Joaquín Vega",
		preview: "Ok, nos vemos el jueves entonces.",
		time: "lun",
		unread: 0,
		color: "bg-teal-500"
	}
];
var messages = [
	{
		from: "client",
		text: "Hola María, ¿podemos confirmar el horario de mañana?",
		time: "10:30"
	},
	{
		from: "pro",
		text: "Hola Lucía! Sí, confirmado para las 16:30. Te mando el enlace 15 min antes.",
		time: "10:35"
	},
	{
		from: "client",
		text: "Perfecto, muchas gracias. Nos vemos mañana.",
		time: "10:37"
	},
	{
		from: "pro",
		text: "Antes de la sesión, completá el formulario que te envié por mail. ¡Nos vemos!",
		time: "10:40"
	}
];
var messages_default = UNSAFE_withComponentProps(function Messages() {
	const [selected, setSelected] = useState(0);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen overflow-hidden",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "w-72 border-r border-border bg-surface flex flex-col",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "p-4 border-b border-border",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-display text-xl text-ink mb-3",
					children: "Mensajes"
				}), /* @__PURE__ */ jsx("input", {
					className: "w-full border border-border rounded px-3 py-2 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink",
					placeholder: "Buscar..."
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "flex-1 overflow-y-auto",
				children: conversations.map((c, i) => /* @__PURE__ */ jsxs("button", {
					onClick: () => setSelected(i),
					className: `w-full flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-bg text-left transition-colors ${selected === i ? "bg-accent/20" : ""}`,
					children: [
						/* @__PURE__ */ jsx("div", {
							className: `w-9 h-9 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`,
							children: c.initials
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex-1 min-w-0",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between mb-0.5",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-sm font-semibold text-ink",
									children: c.name
								}), /* @__PURE__ */ jsx("span", {
									className: "text-xs text-ink-muted",
									children: c.time
								})]
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted truncate",
								children: c.preview
							})]
						}),
						c.unread > 0 && /* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold shrink-0",
							children: c.unread
						})
					]
				}, i))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 flex flex-col bg-bg",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "bg-surface border-b border-border px-6 py-4 flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: `w-9 h-9 rounded-lg ${conversations[selected].color} flex items-center justify-center text-white text-xs font-bold`,
						children: conversations[selected].initials
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-ink",
						children: conversations[selected].name
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-ink-muted",
						children: "Cliente · sesión mañana 16:30"
					})] })]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex-1 overflow-y-auto p-6 space-y-3",
					children: messages.map((m, i) => /* @__PURE__ */ jsx("div", {
						className: `flex ${m.from === "pro" ? "justify-end" : "justify-start"}`,
						children: /* @__PURE__ */ jsxs("div", {
							className: `max-w-sm px-4 py-3 rounded text-sm ${m.from === "pro" ? "bg-ink text-white" : "bg-surface border border-border text-ink"}`,
							children: [/* @__PURE__ */ jsx("p", { children: m.text }), /* @__PURE__ */ jsx("p", {
								className: `text-xs mt-1 ${m.from === "pro" ? "text-white/60" : "text-ink-muted"}`,
								children: m.time
							})]
						})
					}, i))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "bg-surface border-t border-border p-4 flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("input", {
						className: "flex-1 border border-border rounded px-4 py-2.5 text-sm bg-bg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink",
						placeholder: "Escribir mensaje..."
					}), /* @__PURE__ */ jsx("button", {
						className: "bg-ink text-white px-4 py-2.5 rounded hover:bg-primary text-sm font-semibold transition-colors",
						children: "Enviar"
					})]
				})
			]
		})]
	});
});
//#endregion
//#region app/routes/professional/profile.tsx
var profile_exports = /* @__PURE__ */ __exportAll({ default: () => profile_default });
function getInitials(name) {
	return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
var profile_default = UNSAFE_withComponentProps(function ProfessionalProfile() {
	const { user, token, updateUser } = useAuth();
	const [name, setName] = useState(user?.name ?? "");
	const [email, setEmail] = useState(user?.email ?? "");
	const [descripcion, setDescripcion] = useState(user?.descripcion ?? "");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [savingPwd, setSavingPwd] = useState(false);
	const [infoMsg, setInfoMsg] = useState(null);
	const [pwdMsg, setPwdMsg] = useState(null);
	const handleSaveInfo = async (e) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) return;
		setSaving(true);
		setInfoMsg(null);
		try {
			await api.put("/profesional/profile", {
				name: name.trim(),
				email: email.trim(),
				descripcion: descripcion.trim()
			}, token);
			updateUser({
				name: name.trim(),
				email: email.trim(),
				initials: getInitials(name.trim()),
				descripcion: descripcion.trim()
			});
			setInfoMsg({
				type: "ok",
				text: "Datos actualizados correctamente."
			});
		} catch (err) {
			setInfoMsg({
				type: "err",
				text: err.message ?? "Error al guardar."
			});
		} finally {
			setSaving(false);
		}
	};
	const handleSavePassword = async (e) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			setPwdMsg({
				type: "err",
				text: "Las contraseñas no coinciden."
			});
			return;
		}
		if (newPassword.length < 8) {
			setPwdMsg({
				type: "err",
				text: "La contraseña debe tener al menos 8 caracteres."
			});
			return;
		}
		setSavingPwd(true);
		setPwdMsg(null);
		try {
			await api.put("/profile/password", {
				current_password: currentPassword,
				password: newPassword,
				password_confirmation: confirmPassword
			}, token);
			setPwdMsg({
				type: "ok",
				text: "Contraseña actualizada."
			});
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (err) {
			setPwdMsg({
				type: "err",
				text: err.message ?? "Error al cambiar contraseña."
			});
		} finally {
			setSavingPwd(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-2xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink mb-1",
				children: "Mi perfil"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-ink-muted mb-8",
				children: "Gestiona tu información personal"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-5 mb-10",
				children: [/* @__PURE__ */ jsx("div", {
					className: "w-20 h-20 rounded-2xl bg-primary-soft flex items-center justify-center text-ink text-2xl font-bold",
					children: getInitials(name) || user?.initials || "?"
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "font-semibold text-ink text-lg",
					children: name || user?.name
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-ink-muted",
					children: "Profesional"
				})] })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-6 mb-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-semibold text-ink mb-4",
					children: "Información personal"
				}), /* @__PURE__ */ jsxs("form", {
					onSubmit: handleSaveInfo,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Nombre"
						}), /* @__PURE__ */ jsx("input", {
							type: "text",
							value: name,
							onChange: (e) => setName(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Descripción"
						}), /* @__PURE__ */ jsx("input", {
							type: "text",
							value: descripcion,
							onChange: (e) => setDescripcion(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Correo electrónico"
						}), /* @__PURE__ */ jsx("input", {
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						infoMsg && /* @__PURE__ */ jsx("p", {
							className: `text-sm ${infoMsg.type === "ok" ? "text-green-600" : "text-red-500"}`,
							children: infoMsg.text
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex justify-end pt-2",
							children: /* @__PURE__ */ jsx("button", {
								type: "submit",
								disabled: saving,
								className: "bg-ink text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity",
								children: saving ? "Guardando..." : "Guardar cambios"
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-semibold text-ink mb-4",
					children: "Cambiar contraseña"
				}), /* @__PURE__ */ jsxs("form", {
					onSubmit: handleSavePassword,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Contraseña actual"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							value: currentPassword,
							onChange: (e) => setCurrentPassword(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Nueva contraseña"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							value: newPassword,
							onChange: (e) => setNewPassword(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
							className: "block text-xs font-bold text-ink-muted uppercase mb-1",
							children: "Confirmar nueva contraseña"
						}), /* @__PURE__ */ jsx("input", {
							type: "password",
							value: confirmPassword,
							onChange: (e) => setConfirmPassword(e.target.value),
							className: "w-full border border-border rounded px-3 py-2 text-sm text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary",
							required: true
						})] }),
						pwdMsg && /* @__PURE__ */ jsx("p", {
							className: `text-sm ${pwdMsg.type === "ok" ? "text-green-600" : "text-red-500"}`,
							children: pwdMsg.text
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex justify-end pt-2",
							children: /* @__PURE__ */ jsx("button", {
								type: "submit",
								disabled: savingPwd,
								className: "bg-ink text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity",
								children: savingPwd ? "Actualizando..." : "Cambiar contraseña"
							})
						})
					]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/professional/notifications.tsx
var notifications_exports = /* @__PURE__ */ __exportAll({ default: () => notifications_default });
var notifications_default = UNSAFE_withComponentProps(function NotificationsPage() {
	const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead } = useGlobalNotifications();
	useEffect(() => {
		const init = async () => {
			try {
				await loadNotifications();
			} catch (err) {
				console.error("Error cargando notificaciones", err);
			}
		};
		init();
	}, [loadNotifications]);
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink",
				children: "Notificaciones"
			}), /* @__PURE__ */ jsxs("p", {
				className: "text-ink-muted mt-1",
				children: [
					notifications.length,
					" notificaciones · ",
					unreadCount,
					" sin leer"
				]
			})] }), /* @__PURE__ */ jsx("button", {
				onClick: markAllAsRead,
				className: "self-start sm:self-auto text-sm font-semibold border px-4 py-2 rounded bg-surface hover:bg-bg transition",
				children: "✓ Marcar todas como leídas"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8",
			children: [/* @__PURE__ */ jsx("div", {
				className: "lg:col-span-2 space-y-3",
				children: notifications.length === 0 ? /* @__PURE__ */ jsx("div", {
					className: "border rounded p-6 text-center",
					children: /* @__PURE__ */ jsx("p", {
						className: "text-ink-muted",
						children: "No hay notificaciones todavía"
					})
				}) : notifications.map((n) => /* @__PURE__ */ jsx("div", {
					className: `border rounded p-4 transition ${n.read_at ? "opacity-60" : "bg-surface"}`,
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-10 h-10 rounded bg-accent/20 flex items-center justify-center",
							children: /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-ink" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ jsx("p", {
										className: "font-semibold text-sm",
										children: n.data?.type ?? "Notificación"
									}), !n.read_at && /* @__PURE__ */ jsx("button", {
										onClick: () => markAsRead(n.id),
										className: "text-xs text-blue-500",
										children: "Marcar leída"
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink-muted mt-1",
									children: n.data?.message ?? ""
								}),
								n.data?.reserva_id && /* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted mt-2",
									children: ["Reserva #", n.data.reserva_id]
								}),
								n.read_at && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-green-600 mt-2",
									children: "Leída"
								})
							]
						})]
					})
				}, n.id))
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-5",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "border rounded p-5",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-semibold mb-2",
							children: "Resumen"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ jsx("span", { children: "Total" }), /* @__PURE__ */ jsx("span", { children: notifications.length })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between text-red-500",
							children: [/* @__PURE__ */ jsx("span", { children: "Sin leer" }), /* @__PURE__ */ jsx("span", { children: unreadCount })]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "border rounded p-4",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs uppercase mb-3",
						children: "Últimas"
					}), notifications.slice(0, 5).map((n) => /* @__PURE__ */ jsx("div", {
						className: "py-2 border-b last:border-0",
						children: /* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold truncate",
							children: n.data?.message ?? ""
						})
					}, n.id))]
				})]
			})]
		})]
	});
});
//#endregion
//#region app/routes/admin/_layout.tsx
var _layout_exports = /* @__PURE__ */ __exportAll({ default: () => _layout_default });
var navItems = [
	{
		to: "/admin",
		label: "Panel",
		icon: "▣",
		end: true
	},
	{
		to: "/admin/users",
		label: "Usuarios",
		icon: "👥"
	},
	{
		to: "/admin/payments",
		label: "Pagos",
		icon: "💳"
	}
];
var _layout_default = UNSAFE_withComponentProps(function AdminLayout() {
	const { user, isLoading, logout } = useAuth();
	const navigate = useNavigate();
	const [mobileOpen, setMobileOpen] = useState(false);
	useEffect(() => {
		if (!isLoading && !user) navigate("/login", { replace: true });
	}, [
		user,
		isLoading,
		navigate
	]);
	if (isLoading) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-bg",
		children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" })
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-screen bg-bg",
		children: [
			mobileOpen && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 bg-black/50 z-40 md:hidden",
				onClick: () => setMobileOpen(false)
			}),
			/* @__PURE__ */ jsxs("aside", {
				className: [
					"flex flex-col bg-sidebar shrink-0 transition-all duration-200 ease-in-out",
					"fixed inset-y-0 left-0 z-50",
					"w-72",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
					"md:relative md:inset-y-auto md:left-auto md:z-auto",
					"md:translate-x-0 md:w-56 md:min-h-screen"
				].join(" "),
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "p-5 border-b border-white/10",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "w-5 h-5 bg-surface flex items-center justify-center",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-ink font-bold text-xs",
										children: "+"
									})
								}), /* @__PURE__ */ jsx("span", {
									className: "font-display text-sidebar-text text-lg",
									children: "Cita.Pro"
								})]
							}), /* @__PURE__ */ jsx("button", {
								onClick: () => setMobileOpen(false),
								className: "md:hidden text-sidebar-muted hover:text-sidebar-text p-1 rounded transition-colors",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-4 h-4",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									strokeWidth: 2,
									children: /* @__PURE__ */ jsx("polyline", { points: "15 18 9 12 15 6" })
								})
							})]
						})
					}),
					/* @__PURE__ */ jsx("nav", {
						className: "flex-1 p-3 space-y-0.5",
						children: navItems.map(({ to, label, icon, end }) => /* @__PURE__ */ jsxs(NavLink, {
							to,
							end,
							onClick: () => setMobileOpen(false),
							className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`,
							children: [/* @__PURE__ */ jsx("span", { children: icon }), /* @__PURE__ */ jsx("span", { children: label })]
						}, to))
					}),
					/* @__PURE__ */ jsx("div", {
						className: "p-3 border-t border-white/10",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 px-3 py-2",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold shrink-0",
									children: "A"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm font-semibold text-sidebar-text truncate",
										children: "Admin"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-sidebar-muted",
										children: "Administrador"
									})]
								}),
								/* @__PURE__ */ jsx("button", {
									onClick: () => {
										logout();
										navigate("/login");
									},
									className: "text-sidebar-muted hover:text-sidebar-text text-xs",
									children: "✕"
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "flex-1 overflow-auto",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "sticky top-0 z-30 flex md:hidden items-center justify-between bg-sidebar px-4 py-3 border-b border-white/10",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 bg-surface flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-ink font-bold text-xs",
								children: "+"
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "font-display text-sidebar-text text-lg",
							children: "Cita.Pro"
						})]
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setMobileOpen(true),
						className: "text-sidebar-text p-1.5 rounded-lg hover:bg-white/10 transition-colors",
						"aria-label": "Abrir menú",
						children: /* @__PURE__ */ jsxs("svg", {
							className: "w-5 h-5",
							fill: "none",
							viewBox: "0 0 24 24",
							stroke: "currentColor",
							strokeWidth: 2,
							children: [
								/* @__PURE__ */ jsx("line", {
									x1: "3",
									y1: "6",
									x2: "21",
									y2: "6"
								}),
								/* @__PURE__ */ jsx("line", {
									x1: "3",
									y1: "12",
									x2: "21",
									y2: "12"
								}),
								/* @__PURE__ */ jsx("line", {
									x1: "3",
									y1: "18",
									x2: "21",
									y2: "18"
								})
							]
						})
					})]
				}), /* @__PURE__ */ jsx(Outlet, {})]
			})
		]
	});
});
//#endregion
//#region app/routes/admin/dashboard.tsx
var dashboard_exports = /* @__PURE__ */ __exportAll({ default: () => dashboard_default });
var defaultKpis = [
	{
		label: "USUARIOS TOTALES",
		value: "-",
		delta: "",
		sub: ""
	},
	{
		label: "CLIENTES REGISTRADOS",
		value: "-",
		delta: "",
		sub: ""
	},
	{
		label: "PROFESIONALES REGISTRADOS",
		value: "-",
		delta: "",
		sub: ""
	},
	{
		label: "RESERVAS TOTALES",
		value: "-",
		delta: "",
		sub: ""
	}
];
var dashboard_default = UNSAFE_withComponentProps(function AdminDashboard() {
	const { token } = useAuth();
	const [kpis, setKpis] = useState(defaultKpis);
	const [recentActivity, setRecentActivity] = useState([]);
	const [barData, setBarData] = useState([]);
	const [tooltip, setTooltip] = useState(null);
	const [serviceByType, setServiceByType] = useState([]);
	const [topServices, setTopServices] = useState([]);
	useEffect(() => {
		if (!token) return;
		const loadKpis = async () => {
			try {
				const res = await api.get("/admin/dashboard", token);
				if (!res.success) return;
				setKpis([
					{
						label: "USUARIOS TOTALES",
						value: res.data.kpis.users,
						delta: "",
						sub: ""
					},
					{
						label: "CLIENTES TOTALES",
						value: res.data.kpis.clients,
						delta: "",
						sub: ""
					},
					{
						label: "PROFESIONALES ACTIVOS",
						value: res.data.kpis.professionals,
						delta: "",
						sub: ""
					},
					{
						label: "RESERVAS TOTALES",
						value: res.data.kpis.reservas,
						delta: "",
						sub: ""
					}
				]);
				setRecentActivity(res.data.recent_activity);
				setBarData(res.data.reservas_por_dia);
				setServiceByType(res.data.servicios_por_tipo);
				setTopServices(res.data.servicios_mas_reservados);
			} catch (e) {
				console.error("Error KPIs:", e);
			}
		};
		loadKpis();
	}, [token]);
	const maxService = Math.max(...serviceByType.map((s) => Number(s.total || 0)), 1);
	Math.max(...barData.map((d) => Number(d.finalizadas || 0) + Number(d.no_asistidas || 0) + Number(d.canceladas || 0)), 1);
	const rawMax = Math.max(...barData.map((d) => Number(d.finalizadas || 0) + Number(d.no_asistidas || 0) + Number(d.canceladas || 0)), 1);
	const step = Math.ceil(rawMax / 4);
	const maxScale = step * 4;
	const ESTADO_STYLE = {
		pendiente: "bg-amber-50 text-amber-700 border-amber-200",
		confirmada: "bg-blue-50 text-blue-700 border-blue-200",
		pagada: "bg-green-50 text-green-700 border-green-200",
		cancelada: "bg-red-50 text-red-500 border-red-200",
		finalizada: "bg-gray-100 text-gray-700 border-gray-200"
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-7xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8",
				children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Panel administrativo"
				}) })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8",
				children: kpis.map((k) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2 min-h-[32px]",
							children: k.label
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-display text-2xl text-ink font-bold",
								children: k.value
							}), k.delta && /* @__PURE__ */ jsx("span", {
								className: "text-xs text-green-500 font-semibold",
								children: k.delta
							})]
						}),
						k.sub && /* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted mt-1",
							children: k.sub
						})
					]
				}, k.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 bg-surface border border-border rounded p-6",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "font-display text-xl text-ink",
							children: "Volumen de reservas del último mes"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-4",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "w-10 h-56 flex flex-col justify-between text-xs text-ink-muted pr-2",
									children: [
										/* @__PURE__ */ jsx("span", { children: maxScale }),
										/* @__PURE__ */ jsx("span", { children: step * 3 }),
										/* @__PURE__ */ jsx("span", { children: step * 2 }),
										/* @__PURE__ */ jsx("span", { children: step }),
										/* @__PURE__ */ jsx("span", { children: "0" })
									]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex-1",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "relative h-56 border-l border-b border-border",
											children: [/* @__PURE__ */ jsx("div", {
												className: "absolute inset-0 flex flex-col justify-between pointer-events-none",
												children: [
													1,
													2,
													3,
													4
												].map((n) => /* @__PURE__ */ jsx("div", { className: "border-t border-dashed border-border" }, n))
											}), /* @__PURE__ */ jsx("div", {
												className: "absolute inset-0 flex items-end gap-1 px-1",
												children: barData.map((d, i) => {
													const finalizadas = Number(d.finalizadas || 0);
													const no_asistidas = Number(d.no_asistidas || 0);
													const canceladas = Number(d.canceladas || 0);
													finalizadas + no_asistidas + canceladas;
													const hFinalizadas = finalizadas / maxScale * 100;
													const hNo = no_asistidas / maxScale * 100;
													const hCanceladas = canceladas / maxScale * 100;
													return /* @__PURE__ */ jsx("div", {
														className: "flex-1 h-full flex items-end cursor-pointer relative",
														onMouseEnter: (e) => {
															setTooltip({
																x: e.clientX,
																y: e.clientY,
																data: d
															});
														},
														onMouseLeave: () => setTooltip(null),
														children: /* @__PURE__ */ jsxs("div", {
															className: "w-full flex flex-col justify-end h-full",
															children: [
																canceladas > 0 && /* @__PURE__ */ jsx("div", {
																	className: "bg-red-500 w-full",
																	style: { height: `${hCanceladas}%` }
																}),
																no_asistidas > 0 && /* @__PURE__ */ jsx("div", {
																	className: "bg-orange-400 w-full",
																	style: { height: `${hNo}%` }
																}),
																finalizadas > 0 && /* @__PURE__ */ jsx("div", {
																	className: "bg-green-500 w-full",
																	style: { height: `${hFinalizadas}%` }
																})
															]
														})
													}, i);
												})
											})]
										}),
										tooltip && /* @__PURE__ */ jsxs("div", {
											className: "fixed z-50 bg-black text-white text-xs p-3 rounded shadow-lg pointer-events-none",
											style: {
												left: tooltip.x + 10,
												top: tooltip.y + 10
											},
											children: [
												/* @__PURE__ */ jsx("div", {
													className: "font-bold mb-1",
													children: tooltip.data.fecha
												}),
												/* @__PURE__ */ jsxs("div", { children: ["✔ Finalizadas: ", tooltip.data.finalizadas] }),
												/* @__PURE__ */ jsxs("div", { children: ["⚠ No asistieron: ", tooltip.data.no_asistidas] }),
												/* @__PURE__ */ jsxs("div", { children: ["✖ Canceladas: ", tooltip.data.canceladas] })
											]
										}),
										/* @__PURE__ */ jsx("div", {
											className: "flex mt-2 text-[10px] text-ink-muted",
											children: barData.map((d, i) => /* @__PURE__ */ jsx("div", {
												className: "flex-1 flex flex-col justify-end",
												children: i % 5 === 0 ? new Date(d.fecha).toLocaleDateString("es-UY", {
													day: "2-digit",
													month: "2-digit"
												}) : ""
											}, i))
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-5 mt-4 text-xs text-ink-muted",
											children: [
												/* @__PURE__ */ jsxs("span", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-green-500 rounded-sm" }), "Finalizadas"]
												}),
												/* @__PURE__ */ jsxs("span", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-orange-400 rounded-sm" }), "No asistieron"]
												}),
												/* @__PURE__ */ jsxs("span", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-red-500 rounded-sm" }), "Canceladas"]
												})
											]
										})
									]
								})]
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-6 border-t border-border pt-4",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold text-ink-muted uppercase mb-3",
								children: "RESERVAS RECIENTES"
							}), recentActivity.map((a, i) => /* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between py-2 border-b border-border last:border-b-0",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
									className: "text-sm font-medium text-ink",
									children: a.texto
								}), /* @__PURE__ */ jsxs("p", {
									className: "text-xs text-ink-muted",
									children: [
										a.fecha,
										" · ",
										a.hora
									]
								})] }), /* @__PURE__ */ jsx("span", {
									className: `px-2 py-0.5 rounded-full border text-xs font-medium ${ESTADO_STYLE[a.estado] ?? "bg-gray-100 text-gray-600 border-gray-200"}`,
									children: a.estado
								})]
							}, i))]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-display text-lg mb-4",
							children: "Categorias más reservadas"
						}), serviceByType.map((s, i) => /* @__PURE__ */ jsxs("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ jsx("span", { children: s.tipo }), /* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: s.total
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "h-1.5 bg-border rounded",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full bg-ink rounded",
									style: { width: `${s.total / maxService * 100}%` }
								})
							})]
						}, i))]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "font-display text-lg mb-4",
							children: "Servicios más reservados"
						}), topServices.map((s, i) => /* @__PURE__ */ jsxs("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ jsx("span", { children: s.nombre }), /* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: s.total
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "h-1.5 bg-border rounded",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full bg-ink rounded",
									style: { width: `${s.total / Math.max(...topServices.map((x) => x.total), 1) * 100}%` }
								})
							})]
						}, i))]
					})]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/admin/users.tsx
var users_exports = /* @__PURE__ */ __exportAll({ default: () => users_default });
var users_default = UNSAFE_withComponentProps(function AdminUsers() {
	const { token } = useAuth();
	const [clients, setClients] = useState([]);
	const [professionals, setProfessionals] = useState([]);
	const [loadingId, setLoadingId] = useState(null);
	useEffect(() => {
		if (!token) return;
		const loadUsers = async () => {
			try {
				const [resClients, resPros] = await Promise.all([api.get("/admin/clients", token), api.get("/admin/professionals", token)]);
				if (resClients.success) setClients(resClients.data);
				if (resPros.success) setProfessionals(resPros.data);
			} catch (e) {
				console.error("Error loading users:", e);
			}
		};
		loadUsers();
	}, [token]);
	const [modal, setModal] = useState({
		open: false,
		message: ""
	});
	const blockUser = async (id) => {
		try {
			setLoadingId(id);
			const res = await api.post(`/admin/blockUser/${id}`, {}, token);
			if (res.success) {
				const toggle = (list) => list.map((u) => u.id === id ? {
					...u,
					activo: !u.activo
				} : u);
				setClients(toggle(clients));
				setProfessionals(toggle(professionals));
				setModal({
					open: true,
					message: res.message
				});
			}
		} catch (e) {
			console.error("Error cambiando estado:", e);
		} finally {
			setLoadingId(null);
		}
	};
	const getInitials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
	const Table = ({ title, data }) => /* @__PURE__ */ jsxs("div", {
		className: "mb-10",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "text-xl font-bold text-ink mb-3",
			children: title
		}), /* @__PURE__ */ jsx("div", {
			className: "border border-border rounded overflow-x-auto",
			children: /* @__PURE__ */ jsxs("div", {
				style: { minWidth: "500px" },
				children: [/* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-24 px-5 py-3 border-b border-border bg-bg",
					children: [
						"USUARIO",
						"EMAIL",
						"SESIONES",
						"DESDE",
						"ESTADO",
						""
					].map((h, i) => /* @__PURE__ */ jsx("div", {
						className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-6" : i === 1 ? "col-span-6" : i === 2 ? "col-span-3 text-center" : i === 3 ? "col-span-4 text-center" : i === 4 ? "col-span-3 text-center" : "col-span-2"}`,
						children: h
					}, i))
				}), data.map((u) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-24 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors bg-surface",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-6 flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold",
								children: getInitials(u.name)
							}), /* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-ink",
								children: u.name
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-6 min-w-0",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink-muted block truncate sm:truncate-none sm:break-words",
								children: u.email
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-3 text-center",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink",
								children: u.sessions
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-4 text-center",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink-muted justify items-center",
								children: u.joined
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-3 text-center",
							children: u.activo ? /* @__PURE__ */ jsx("span", {
								className: "text-xs px-2 py-1 rounded bg-green-500 text-white",
								children: "Activo"
							}) : /* @__PURE__ */ jsx("span", {
								className: "text-xs px-2 py-1 rounded bg-red-500 text-white",
								children: "Bloqueado"
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsx("button", {
								onClick: () => blockUser(Number(u.id)),
								disabled: loadingId === u.id,
								className: `text-xs px-2 py-1 rounded text-white ${u.activo ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} ${loadingId === u.id ? "opacity-60 cursor-not-allowed" : ""}`,
								children: loadingId === u.id ? "Cargando..." : u.activo ? "Bloquear" : "Activar"
							})
						})
					]
				}, u.email))]
			})
		})]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6",
				children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Usuarios"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Gestión de clientes y profesionales"
				})]
			}),
			/* @__PURE__ */ jsx(Table, {
				title: "Clientes",
				data: clients
			}),
			/* @__PURE__ */ jsx(Table, {
				title: "Profesionales",
				data: professionals
			}),
			modal.open && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
				children: /* @__PURE__ */ jsxs("div", {
					className: "bg-white rounded-lg p-6 shadow-lg w-[300px] text-center",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm text-ink mb-4",
						children: modal.message
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setModal({
							open: false,
							message: ""
						}),
						className: "bg-violet-500 text-white px-4 py-2 rounded",
						children: "OK"
					})]
				})
			})
		]
	});
});
//#endregion
//#region app/routes/admin/payments.tsx
var payments_exports = /* @__PURE__ */ __exportAll({ default: () => payments_default });
var badgeCls = {
	aprobado: "badge badge-confirmada",
	pendiente: "badge badge-pendiente"
};
var payments_default = UNSAFE_withComponentProps(function AdminPayments() {
	const { token } = useAuth();
	const [summary, setSummary] = useState(null);
	const [transactions, setTransactions] = useState([]);
	useEffect(() => {
		if (!token) return;
		const loadPayments = async () => {
			try {
				const [res, resSummary] = await Promise.all([api.get("/admin/pagos", token), api.get("/admin/pagosTotales", token)]);
				if (res.success) setTransactions(res.data);
				if (resSummary.success) setSummary(resSummary.data);
			} catch (e) {
				console.error("Error loading payments:", e);
			}
		};
		loadPayments();
	}, [token]);
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 md:p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex items-center justify-between mb-6",
				children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Pagos"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Todas las transacciones de la plataforma"
				})] })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: "TOTAL"
						}), /* @__PURE__ */ jsxs("p", {
							className: "font-display text-2xl text-ink font-bold",
							children: ["€", summary?.total ?? 0]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: "PAGADO"
						}), /* @__PURE__ */ jsxs("p", {
							className: "font-display text-2xl text-ink font-bold text-green-600",
							children: ["€", summary?.pagado ?? 0]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: "PENDIENTE"
						}), /* @__PURE__ */ jsxs("p", {
							className: "font-display text-2xl text-ink font-bold text-yellow-600",
							children: ["€", summary?.pendiente ?? 0]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "border border-border rounded overflow-x-auto",
				children: /* @__PURE__ */ jsxs("div", {
					style: { minWidth: "640px" },
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex px-5 py-3 border-b border-border bg-bg text-xs font-bold text-ink-muted uppercase tracking-widest items-center",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-24",
								children: "FECHA"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex-[2]",
								children: "DE"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex-[2]",
								children: "PARA"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex-[3]",
								children: "SERVICIO"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "w-20 text-left",
								children: "TOTAL"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "w-24 text-center",
								children: "MÉTODO"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "w-28 text-center",
								children: "ESTADO"
							})
						]
					}), transactions.map((t, i) => /* @__PURE__ */ jsxs("div", {
						className: "flex px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors text-sm bg-surface",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-24 text-ink-muted",
								children: t.fecha
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex-[2] text-ink font-semibold truncate pr-2",
								children: t.de
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex-[2] text-ink font-semibold truncate pr-2",
								children: t.para
							}),
							/* @__PURE__ */ jsx("div", {
								className: "flex-[3] text-ink-muted truncate pr-2",
								children: t.servicio
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "w-20 text-left font-bold text-ink",
								children: ["$", t.total]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "w-24 text-center text-ink-muted uppercase text-xs",
								children: t.metodo
							}),
							/* @__PURE__ */ jsx("div", {
								className: "w-28 text-center",
								children: /* @__PURE__ */ jsx("span", {
									className: badgeCls[t.estado],
									children: t.estado?.toUpperCase()
								})
							})
						]
					}))]
				})
			})
		]
	});
});
//#endregion
//#region app/routes/videollamada.tsx
var videollamada_exports = /* @__PURE__ */ __exportAll({ default: () => videollamada_default });
var videollamada_default = UNSAFE_withComponentProps(function Videollamada() {
	const navigate = useNavigate();
	const { id } = useParams();
	const { token } = useAuth();
	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);
	const roomRef = useRef(null);
	const [micOn, setMicOn] = useState(false);
	const [camOn, setCamOn] = useState(false);
	const [participants, setParticipants] = useState(1);
	const salir = async () => {
		try {
			await api.post(`/videollamada/${id}/estado`, { estado: "finalizada" }, token);
			await roomRef.current?.disconnect();
		} finally {
			navigate("/");
		}
	};
	useEffect(() => {
		const handleUnload = () => {
			navigator.sendBeacon(`undefined/videollamada/${id}/estado`, JSON.stringify({ estado: "finalizada" }));
		};
		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [id]);
	useEffect(() => {
		if (!id || !token) return;
		const room = new Room();
		roomRef.current = room;
		const join = async () => {
			try {
				const { token: livekitToken, url } = (await api.get(`/videollamada/token/${id}`, token)).data;
				room.on("trackSubscribed", (track) => {
					if (track.kind === Track.Kind.Video && remoteVideoRef.current) track.attach(remoteVideoRef.current);
					if (track.kind === Track.Kind.Audio) track.attach();
				});
				await room.connect(url, livekitToken);
				api.post(`/videollamada/${id}/estado`, { estado: "en_curso" }, token).catch(() => {});
				await Promise.all([room.localParticipant.setCameraEnabled(true), room.localParticipant.setMicrophoneEnabled(true)]);
				setCamOn(true);
				setMicOn(true);
				const attachLocal = () => {
					room.localParticipant.videoTrackPublications.forEach((pub) => {
						if (pub.track && localVideoRef.current) pub.track.attach(localVideoRef.current);
					});
				};
				attachLocal();
				room.localParticipant.on("trackPublished", attachLocal);
				setParticipants(room.numParticipants);
				room.on("participantConnected", () => {
					setParticipants(room.numParticipants);
				});
				room.on("participantDisconnected", () => {
					setParticipants(room.numParticipants);
				});
			} catch (err) {
				console.error("LiveKit error:", err);
			}
		};
		join();
		return () => {
			room.disconnect();
		};
	}, [id, token]);
	const toggleMic = async () => {
		if (!roomRef.current) return;
		const enabled = !micOn;
		setMicOn(enabled);
		await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
	};
	const toggleCam = async () => {
		if (!roomRef.current) return;
		const enabled = !camOn;
		setCamOn(enabled);
		await roomRef.current.localParticipant.setCameraEnabled(enabled);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "px-5 py-3 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur",
				children: [/* @__PURE__ */ jsx("div", {
					className: "font-semibold",
					children: "🎥 Videollamada"
				}), /* @__PURE__ */ jsxs("div", {
					className: "text-sm text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10",
					children: ["👥 ", participants]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex-1 relative",
				children: [/* @__PURE__ */ jsx("video", {
					ref: remoteVideoRef,
					autoPlay: true,
					playsInline: true,
					className: "absolute w-full h-full object-cover bg-black"
				}), /* @__PURE__ */ jsx("div", {
					className: "absolute bottom-5 right-5 w-48 h-32 rounded-2xl overflow-hidden border border-white/20 bg-black",
					children: /* @__PURE__ */ jsx("video", {
						ref: localVideoRef,
						autoPlay: true,
						playsInline: true,
						muted: true,
						className: "w-full h-full object-cover"
					})
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "p-4 flex justify-center gap-4 bg-black/60 border-t border-white/10",
				children: [
					/* @__PURE__ */ jsx("button", {
						onClick: toggleMic,
						className: `px-5 py-2 rounded-full ${micOn ? "bg-green-500" : "bg-red-500"}`,
						children: "🎤"
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: toggleCam,
						className: `px-5 py-2 rounded-full ${camOn ? "bg-green-500" : "bg-red-500"}`,
						children: "📷"
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: salir,
						className: "px-5 py-2 rounded-full bg-white/10",
						children: "Salir"
					})
				]
			})
		]
	});
});
//#endregion
//#region app/routes/session.$id.tsx
var session_$id_exports = /* @__PURE__ */ __exportAll({ default: () => session_$id_default });
var session_$id_default = UNSAFE_withComponentProps(function Session() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [micOn, setMicOn] = useState(true);
	const [camOn, setCamOn] = useState(true);
	const [notes, setNotes] = useState("· Continuar trabajo con técnicas de respiración\n· Mencionó mejor sueño esta semana\n· Próxima: revisar registros del miércoles");
	const handleEnd = () => navigate(`/session/${id}/rating`);
	return /* @__PURE__ */ jsxs("div", {
		className: "h-screen flex flex-col bg-ink text-white overflow-hidden",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between px-6 py-3 border-b border-white/10",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "flex items-center gap-1.5 text-sm",
							children: [/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse" }), "EN VIVO · 14:23"]
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-white/40",
							children: "·"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-sm text-white/60",
							children: "Sesión individual"
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-4 text-sm text-white/60",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ jsx("span", {
							className: "w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-xs",
							children: "○"
						}), "Cifrada extremo a extremo"]
					}), /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1.5",
						children: [/* @__PURE__ */ jsx("span", { children: "👥" }), /* @__PURE__ */ jsx("span", {
							className: "font-bold text-white",
							children: "2"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex-1 relative overflow-hidden flex",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex-1 flex items-center justify-center relative",
					style: { background: "radial-gradient(ellipse at center, #3d2b1f 0%, #1a1410 60%, #0a0906 100%)" },
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded p-4 w-72",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between mb-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-xs font-bold text-white uppercase tracking-widest",
									children: "NOTAS PRIVADAS"
								}), /* @__PURE__ */ jsx("span", {
									className: "text-xs text-white/40",
									children: "Auto-guardado"
								})]
							}), /* @__PURE__ */ jsx("textarea", {
								value: notes,
								onChange: (e) => setNotes(e.target.value),
								className: "w-full bg-transparent text-sm text-white/80 resize-none outline-none leading-relaxed",
								rows: 5,
								placeholder: "Escribiendo..."
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "text-center",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "w-28 h-28 rounded-full border-2 border-white/20 flex items-center justify-center bg-white/10 mx-auto mb-4 text-4xl font-bold text-white/60",
									children: "MO"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "font-display text-white text-2xl mb-1",
									children: "María Ortiz"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm text-white/50",
									children: "Hablando · cámara y micrófono activos"
								})
							]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "absolute bottom-4 right-4 w-36 h-28 bg-white/10 rounded overflow-hidden border border-white/20 flex items-center justify-center",
							children: /* @__PURE__ */ jsxs("div", {
								className: "text-center",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-10 h-10 rounded-full bg-accent mx-auto mb-1 flex items-center justify-center text-ink text-xs font-bold",
									children: "LP"
								}), /* @__PURE__ */ jsx("p", {
									className: "text-xs text-white font-medium",
									children: "· Vos"
								})]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ jsx("div", {
				className: "bg-black/80 backdrop-blur-sm border-t border-white/10 px-6 py-4",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-center gap-4",
					children: [
						/* @__PURE__ */ jsx(ControlBtn, {
							onClick: () => setMicOn(!micOn),
							active: micOn,
							icon: "🎤",
							label: "Mic"
						}),
						/* @__PURE__ */ jsx(ControlBtn, {
							onClick: () => setCamOn(!camOn),
							active: camOn,
							icon: "📷",
							label: "Cám"
						}),
						/* @__PURE__ */ jsx(ControlBtn, {
							onClick: () => {},
							active: true,
							icon: "🖥",
							label: "Compartir"
						}),
						/* @__PURE__ */ jsx(ControlBtn, {
							onClick: () => {},
							active: true,
							icon: "💬",
							label: "Chat",
							badge: 3
						}),
						/* @__PURE__ */ jsx(ControlBtn, {
							onClick: () => {},
							active: true,
							icon: "👥",
							label: "Personas"
						}),
						/* @__PURE__ */ jsx(ControlBtn, {
							onClick: () => {},
							active: true,
							icon: "⋯",
							label: "Más"
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: handleEnd,
							className: "flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded transition-colors ml-4",
							children: "📞 Finalizar sesión"
						})
					]
				})
			})
		]
	});
});
function ControlBtn({ onClick, active, icon, label, badge }) {
	return /* @__PURE__ */ jsxs("button", {
		onClick,
		className: `relative flex flex-col items-center gap-1 w-14 py-2 rounded transition-colors ${active ? "text-white hover:bg-white/10" : "text-white/40 hover:bg-white/10"}`,
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "text-xl",
				children: icon
			}),
			/* @__PURE__ */ jsx("span", {
				className: "text-xs",
				children: label
			}),
			badge && /* @__PURE__ */ jsx("span", {
				className: "absolute -top-1 left-1/2 -translate-x-1/2 translate-x-3 w-4 h-4 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold",
				children: badge
			})
		]
	});
}
//#endregion
//#region app/routes/session.$id.rating.tsx
var session_$id_rating_exports = /* @__PURE__ */ __exportAll({ default: () => session_$id_rating_default });
var ASPECTS = [
	"Empática",
	"Profesional",
	"Puntual",
	"Buena escucha",
	"Clara",
	"Cálida",
	"Estructurada"
];
var STAR_LABELS = [
	"",
	"Muy malo",
	"Malo",
	"Regular",
	"Bueno",
	"Excelente"
];
var session_$id_rating_default = UNSAFE_withComponentProps(function Rating() {
	const navigate = useNavigate();
	const [stars, setStars] = useState(5);
	const [hovered, setHovered] = useState(0);
	const [selected, setSelected] = useState([
		"Empática",
		"Profesional",
		"Puntual",
		"Cálida"
	]);
	const [comment, setComment] = useState("Súper contenida y profesional. Cada sesión siento que avanzo un poco más.");
	const [publicName, setPublicName] = useState(true);
	const [loading, setLoading] = useState(false);
	const toggleAspect = (a) => {
		setSelected((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
	};
	const handleSubmit = async () => {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 800));
		navigate("/client");
	};
	const displayStars = hovered || stars;
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen bg-bg flex items-center justify-center px-4 py-12",
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-lg",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "text-center mb-8",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "badge badge-confirmada mb-4 inline-block",
						children: "SESIÓN FINALIZADA"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "font-display text-4xl text-ink mb-3",
						children: "¿Cómo estuvo tu sesión con María?"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-ink-muted",
						children: "Tu opinión la ayuda a mejorar y guía a otros clientes."
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded p-6 space-y-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between pb-4 border-b border-border",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm",
								children: "MO"
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-ink",
								children: "María Ortiz"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted",
								children: "Sesión individual · 50 min · 22 may 15:00"
							})] })]
						}), /* @__PURE__ */ jsx("span", {
							className: "text-xs text-ink-muted font-semibold",
							children: "Sesión #14"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "text-center",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex items-center justify-center gap-2 mb-2",
							children: [
								1,
								2,
								3,
								4,
								5
							].map((s) => /* @__PURE__ */ jsx("button", {
								onMouseEnter: () => setHovered(s),
								onMouseLeave: () => setHovered(0),
								onClick: () => setStars(s),
								className: `text-4xl transition-transform hover:scale-110 ${displayStars >= s ? "text-accent" : "text-border"}`,
								children: "★"
							}, s))
						}), /* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-ink",
							children: STAR_LABELS[displayStars]
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm font-semibold text-ink mb-3",
						children: "¿Qué destacarías?"
					}), /* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap gap-2",
						children: ASPECTS.map((a) => /* @__PURE__ */ jsxs("button", {
							onClick: () => toggleAspect(a),
							className: `text-sm px-4 py-2 rounded-full border font-semibold transition-colors ${selected.includes(a) ? "bg-ink text-white border-ink" : "border-border text-ink-muted hover:border-ink hover:text-ink"}`,
							children: [selected.includes(a) && "✓ ", a]
						}, a))
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("label", {
						className: "block text-sm font-semibold text-ink mb-2",
						children: ["Comentario ", /* @__PURE__ */ jsx("span", {
							className: "text-ink-muted font-normal",
							children: "(opcional)"
						})]
					}), /* @__PURE__ */ jsx("textarea", {
						value: comment,
						onChange: (e) => setComment(e.target.value),
						rows: 3,
						className: "w-full border border-border rounded px-4 py-3 text-sm text-ink bg-bg resize-none focus:outline-none focus:ring-2 focus:ring-ink"
					})] }),
					/* @__PURE__ */ jsxs("label", {
						className: "flex items-center gap-2 cursor-pointer",
						children: [/* @__PURE__ */ jsx("input", {
							type: "checkbox",
							checked: publicName,
							onChange: (e) => setPublicName(e.target.checked),
							className: "w-4 h-4 accent-ink"
						}), /* @__PURE__ */ jsx("span", {
							className: "text-sm text-ink",
							children: "Publicar mi reseña con mi nombre"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx("button", {
							onClick: handleSubmit,
							disabled: loading,
							className: "w-full bg-ink text-white font-semibold py-3 rounded hover:bg-primary transition-colors disabled:opacity-60",
							children: loading ? "Enviando..." : "Enviar reseña →"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => navigate("/client"),
							className: "w-full border border-border text-ink-muted font-semibold py-3 rounded hover:bg-bg transition-colors",
							children: "Saltar por ahora"
						})]
					})
				]
			})]
		})
	});
});
//#endregion
//#region \0virtual:react-router/server-manifest
var server_manifest_default = {
	"entry": {
		"module": "/assets/entry.client-D6-dwf4X.js",
		"imports": ["/assets/jsx-runtime-B75Xqy3m.js"],
		"css": []
	},
	"routes": {
		"root": {
			"id": "root",
			"parentId": void 0,
			"path": "",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": true,
			"module": "/assets/root-CgdQvbnh.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": ["/assets/root-6VFZ2a-t.css"],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/home": {
			"id": "routes/home",
			"parentId": "root",
			"path": void 0,
			"index": true,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/home-jbRgOG_y.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/login": {
			"id": "routes/login",
			"parentId": "root",
			"path": "login",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/login-DLGBmClL.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/register": {
			"id": "routes/register",
			"parentId": "root",
			"path": "register",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/register-DgngsB-s.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/auth.google.callback": {
			"id": "routes/auth.google.callback",
			"parentId": "root",
			"path": "auth/google/callback",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/auth.google.callback-CjDD0zji.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/_layout": {
			"id": "routes/client/_layout",
			"parentId": "root",
			"path": "client",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/_layout-D1AwYk45.js",
			"imports": [
				"/assets/jsx-runtime-B75Xqy3m.js",
				"/assets/AuthContext-NE5TAd_g.js",
				"/assets/NotificationContext-Bop2CCqz.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/dashboard": {
			"id": "routes/client/dashboard",
			"parentId": "routes/client/_layout",
			"path": void 0,
			"index": true,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/dashboard-BuCkQy9F.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/discover": {
			"id": "routes/client/discover",
			"parentId": "routes/client/_layout",
			"path": "discover",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/discover-Bq7jFXMc.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/professional.$id": {
			"id": "routes/client/professional.$id",
			"parentId": "routes/client/_layout",
			"path": "professional/:id",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/professional._id-C46H-u4s.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/booking.$id.pay": {
			"id": "routes/client/booking.$id.pay",
			"parentId": "routes/client/_layout",
			"path": "booking/:id/pay",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/booking._id.pay-BR6KO0y9.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/package.$id.pay": {
			"id": "routes/client/package.$id.pay",
			"parentId": "routes/client/_layout",
			"path": "package/:id/pay",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/package._id.pay-BiYyckyf.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/compra-package.$id.pay": {
			"id": "routes/client/compra-package.$id.pay",
			"parentId": "routes/client/_layout",
			"path": "compra-package/:id/pay",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/compra-package._id.pay-poVMicct.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/packages": {
			"id": "routes/client/packages",
			"parentId": "routes/client/_layout",
			"path": "packages",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/packages-DufKLb16.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/messages": {
			"id": "routes/client/messages",
			"parentId": "routes/client/_layout",
			"path": "messages",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/messages-CG6NMEM_.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/payments": {
			"id": "routes/client/payments",
			"parentId": "routes/client/_layout",
			"path": "payments",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/payments-BdvKjozo.js",
			"imports": [
				"/assets/jsx-runtime-B75Xqy3m.js",
				"/assets/AuthContext-NE5TAd_g.js",
				"/assets/ReactToastify-CH_hjN7z.js"
			],
			"css": ["/assets/ReactToastify-qcT314-W.css"],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/notifications": {
			"id": "routes/client/notifications",
			"parentId": "routes/client/_layout",
			"path": "notifications",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/notifications-BimVkBZI.js",
			"imports": [
				"/assets/jsx-runtime-B75Xqy3m.js",
				"/assets/NotificationContext-Bop2CCqz.js",
				"/assets/bell-B_0dwYTY.js",
				"/assets/AuthContext-NE5TAd_g.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/mis-reservas": {
			"id": "routes/client/mis-reservas",
			"parentId": "routes/client/_layout",
			"path": "reservas",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/mis-reservas-BbEP9JLZ.js",
			"imports": [
				"/assets/jsx-runtime-B75Xqy3m.js",
				"/assets/AuthContext-NE5TAd_g.js",
				"/assets/ReactToastify-CH_hjN7z.js"
			],
			"css": ["/assets/ReactToastify-qcT314-W.css"],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/client/profile": {
			"id": "routes/client/profile",
			"parentId": "routes/client/_layout",
			"path": "profile",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/profile-ADk_YCeL.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/_layout": {
			"id": "routes/professional/_layout",
			"parentId": "root",
			"path": "professional",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/_layout-C6BL7_YU.js",
			"imports": [
				"/assets/jsx-runtime-B75Xqy3m.js",
				"/assets/AuthContext-NE5TAd_g.js",
				"/assets/NotificationContext-Bop2CCqz.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/clients": {
			"id": "routes/professional/clients",
			"parentId": "routes/professional/_layout",
			"path": void 0,
			"index": true,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/clients-kr9Ruq1R.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/dashboard": {
			"id": "routes/professional/dashboard",
			"parentId": "routes/professional/_layout",
			"path": "dashboard",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/dashboard-B2bZDwoc.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/services": {
			"id": "routes/professional/services",
			"parentId": "routes/professional/_layout",
			"path": "services",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/services-BVCn45eV.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/service-packages": {
			"id": "routes/professional/service-packages",
			"parentId": "routes/professional/_layout",
			"path": "service-packages",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/service-packages-DLgNAinG.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/availability": {
			"id": "routes/professional/availability",
			"parentId": "routes/professional/_layout",
			"path": "availability",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/availability-G46YMYGq.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/payments": {
			"id": "routes/professional/payments",
			"parentId": "routes/professional/_layout",
			"path": "payments",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/payments-rzFqIB1H.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/messages": {
			"id": "routes/professional/messages",
			"parentId": "routes/professional/_layout",
			"path": "messages",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/messages-IiHBkZIg.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/profile": {
			"id": "routes/professional/profile",
			"parentId": "routes/professional/_layout",
			"path": "profile",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/profile-BCBnq8CS.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/notifications": {
			"id": "routes/professional/notifications",
			"parentId": "routes/professional/_layout",
			"path": "notifications",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/notifications-WdDElHmW.js",
			"imports": [
				"/assets/jsx-runtime-B75Xqy3m.js",
				"/assets/NotificationContext-Bop2CCqz.js",
				"/assets/bell-B_0dwYTY.js",
				"/assets/AuthContext-NE5TAd_g.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/admin/_layout": {
			"id": "routes/admin/_layout",
			"parentId": "root",
			"path": "admin",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/_layout-0BabZFh8.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/admin/dashboard": {
			"id": "routes/admin/dashboard",
			"parentId": "routes/admin/_layout",
			"path": void 0,
			"index": true,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/dashboard--3b9XTSK.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/admin/users": {
			"id": "routes/admin/users",
			"parentId": "routes/admin/_layout",
			"path": "users",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/users-BBq742c0.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/admin/payments": {
			"id": "routes/admin/payments",
			"parentId": "routes/admin/_layout",
			"path": "payments",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/payments-BZr3QybX.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/videollamada": {
			"id": "routes/videollamada",
			"parentId": "root",
			"path": "videollamada/:id",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/videollamada-CGbHxjVZ.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js", "/assets/AuthContext-NE5TAd_g.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/session.$id": {
			"id": "routes/session.$id",
			"parentId": "root",
			"path": "session/:id",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/session._id-B0kEyAGw.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/session.$id.rating": {
			"id": "routes/session.$id.rating",
			"parentId": "root",
			"path": "session/:id/rating",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/session._id.rating-BYfQyzIF.js",
			"imports": ["/assets/jsx-runtime-B75Xqy3m.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-c6109759.js",
	"version": "c6109759",
	"sri": void 0
};
//#endregion
//#region \0virtual:react-router/server-build
var assetsBuildDirectory = "build\\client";
var basename = "/";
var future = {
	"unstable_optimizeDeps": false,
	"v8_passThroughRequests": false,
	"unstable_trailingSlashAwareDataRequests": false,
	"unstable_previewServerPrerendering": false,
	"v8_middleware": false,
	"v8_splitRouteModules": false,
	"v8_viteEnvironmentApi": false
};
var ssr = true;
var isSpaMode = false;
var prerender = [];
var routeDiscovery = {
	"mode": "lazy",
	"manifestPath": "/__manifest"
};
var publicPath = "/";
var entry = { module: entry_server_node_exports };
var routes = {
	"root": {
		id: "root",
		parentId: void 0,
		path: "",
		index: void 0,
		caseSensitive: void 0,
		module: root_exports
	},
	"routes/home": {
		id: "routes/home",
		parentId: "root",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: home_exports
	},
	"routes/login": {
		id: "routes/login",
		parentId: "root",
		path: "login",
		index: void 0,
		caseSensitive: void 0,
		module: login_exports
	},
	"routes/register": {
		id: "routes/register",
		parentId: "root",
		path: "register",
		index: void 0,
		caseSensitive: void 0,
		module: register_exports
	},
	"routes/auth.google.callback": {
		id: "routes/auth.google.callback",
		parentId: "root",
		path: "auth/google/callback",
		index: void 0,
		caseSensitive: void 0,
		module: auth_google_callback_exports
	},
	"routes/client/_layout": {
		id: "routes/client/_layout",
		parentId: "root",
		path: "client",
		index: void 0,
		caseSensitive: void 0,
		module: _layout_exports$2
	},
	"routes/client/dashboard": {
		id: "routes/client/dashboard",
		parentId: "routes/client/_layout",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: dashboard_exports$2
	},
	"routes/client/discover": {
		id: "routes/client/discover",
		parentId: "routes/client/_layout",
		path: "discover",
		index: void 0,
		caseSensitive: void 0,
		module: discover_exports
	},
	"routes/client/professional.$id": {
		id: "routes/client/professional.$id",
		parentId: "routes/client/_layout",
		path: "professional/:id",
		index: void 0,
		caseSensitive: void 0,
		module: professional_$id_exports
	},
	"routes/client/booking.$id.pay": {
		id: "routes/client/booking.$id.pay",
		parentId: "routes/client/_layout",
		path: "booking/:id/pay",
		index: void 0,
		caseSensitive: void 0,
		module: booking_$id_pay_exports
	},
	"routes/client/package.$id.pay": {
		id: "routes/client/package.$id.pay",
		parentId: "routes/client/_layout",
		path: "package/:id/pay",
		index: void 0,
		caseSensitive: void 0,
		module: package_$id_pay_exports
	},
	"routes/client/compra-package.$id.pay": {
		id: "routes/client/compra-package.$id.pay",
		parentId: "routes/client/_layout",
		path: "compra-package/:id/pay",
		index: void 0,
		caseSensitive: void 0,
		module: compra_package_$id_pay_exports
	},
	"routes/client/packages": {
		id: "routes/client/packages",
		parentId: "routes/client/_layout",
		path: "packages",
		index: void 0,
		caseSensitive: void 0,
		module: packages_exports
	},
	"routes/client/messages": {
		id: "routes/client/messages",
		parentId: "routes/client/_layout",
		path: "messages",
		index: void 0,
		caseSensitive: void 0,
		module: messages_exports$1
	},
	"routes/client/payments": {
		id: "routes/client/payments",
		parentId: "routes/client/_layout",
		path: "payments",
		index: void 0,
		caseSensitive: void 0,
		module: payments_exports$2
	},
	"routes/client/notifications": {
		id: "routes/client/notifications",
		parentId: "routes/client/_layout",
		path: "notifications",
		index: void 0,
		caseSensitive: void 0,
		module: notifications_exports$1
	},
	"routes/client/mis-reservas": {
		id: "routes/client/mis-reservas",
		parentId: "routes/client/_layout",
		path: "reservas",
		index: void 0,
		caseSensitive: void 0,
		module: mis_reservas_exports
	},
	"routes/client/profile": {
		id: "routes/client/profile",
		parentId: "routes/client/_layout",
		path: "profile",
		index: void 0,
		caseSensitive: void 0,
		module: profile_exports$1
	},
	"routes/professional/_layout": {
		id: "routes/professional/_layout",
		parentId: "root",
		path: "professional",
		index: void 0,
		caseSensitive: void 0,
		module: _layout_exports$1
	},
	"routes/professional/clients": {
		id: "routes/professional/clients",
		parentId: "routes/professional/_layout",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: clients_exports
	},
	"routes/professional/dashboard": {
		id: "routes/professional/dashboard",
		parentId: "routes/professional/_layout",
		path: "dashboard",
		index: void 0,
		caseSensitive: void 0,
		module: dashboard_exports$1
	},
	"routes/professional/services": {
		id: "routes/professional/services",
		parentId: "routes/professional/_layout",
		path: "services",
		index: void 0,
		caseSensitive: void 0,
		module: services_exports
	},
	"routes/professional/service-packages": {
		id: "routes/professional/service-packages",
		parentId: "routes/professional/_layout",
		path: "service-packages",
		index: void 0,
		caseSensitive: void 0,
		module: service_packages_exports
	},
	"routes/professional/availability": {
		id: "routes/professional/availability",
		parentId: "routes/professional/_layout",
		path: "availability",
		index: void 0,
		caseSensitive: void 0,
		module: availability_exports
	},
	"routes/professional/payments": {
		id: "routes/professional/payments",
		parentId: "routes/professional/_layout",
		path: "payments",
		index: void 0,
		caseSensitive: void 0,
		module: payments_exports$1
	},
	"routes/professional/messages": {
		id: "routes/professional/messages",
		parentId: "routes/professional/_layout",
		path: "messages",
		index: void 0,
		caseSensitive: void 0,
		module: messages_exports
	},
	"routes/professional/profile": {
		id: "routes/professional/profile",
		parentId: "routes/professional/_layout",
		path: "profile",
		index: void 0,
		caseSensitive: void 0,
		module: profile_exports
	},
	"routes/professional/notifications": {
		id: "routes/professional/notifications",
		parentId: "routes/professional/_layout",
		path: "notifications",
		index: void 0,
		caseSensitive: void 0,
		module: notifications_exports
	},
	"routes/admin/_layout": {
		id: "routes/admin/_layout",
		parentId: "root",
		path: "admin",
		index: void 0,
		caseSensitive: void 0,
		module: _layout_exports
	},
	"routes/admin/dashboard": {
		id: "routes/admin/dashboard",
		parentId: "routes/admin/_layout",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: dashboard_exports
	},
	"routes/admin/users": {
		id: "routes/admin/users",
		parentId: "routes/admin/_layout",
		path: "users",
		index: void 0,
		caseSensitive: void 0,
		module: users_exports
	},
	"routes/admin/payments": {
		id: "routes/admin/payments",
		parentId: "routes/admin/_layout",
		path: "payments",
		index: void 0,
		caseSensitive: void 0,
		module: payments_exports
	},
	"routes/videollamada": {
		id: "routes/videollamada",
		parentId: "root",
		path: "videollamada/:id",
		index: void 0,
		caseSensitive: void 0,
		module: videollamada_exports
	},
	"routes/session.$id": {
		id: "routes/session.$id",
		parentId: "root",
		path: "session/:id",
		index: void 0,
		caseSensitive: void 0,
		module: session_$id_exports
	},
	"routes/session.$id.rating": {
		id: "routes/session.$id.rating",
		parentId: "root",
		path: "session/:id/rating",
		index: void 0,
		caseSensitive: void 0,
		module: session_$id_rating_exports
	}
};
var allowedActionOrigins = false;
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
