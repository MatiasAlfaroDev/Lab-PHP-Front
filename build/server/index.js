import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { Link, Links, Meta, NavLink, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, useNavigate, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
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
//#region app/context/AuthContext.tsx
var AuthContext = createContext({
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: true,
	login: () => {},
	logout: () => {}
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
	const logout = () => {
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
			logout
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
	}
];
function Layout({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "es",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
			/* @__PURE__ */ jsx("meta", {
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			}),
			/* @__PURE__ */ jsx(Meta, {}),
			/* @__PURE__ */ jsx(Links, {})
		] }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsx(AuthProvider, { children }),
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
//#region app/lib/api.ts
var BASE_URL = "http://localhost:8000/api";
async function request(path, options = {}, token) {
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
		const err = await res.json().catch(() => ({ message: res.statusText }));
		throw new Error(err.message ?? "Request failed");
	}
	return res.json();
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
			const data = await api.post("/auth/login", {
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
	const handleDemo = (demoRole) => {
		login("demo-token-" + demoRole, {
			client: {
				id: 1,
				name: "Lucía Pérez",
				email: "lucia@gmail.com",
				role: "client",
				initials: "LP"
			},
			professional: {
				id: 2,
				name: "María Ortiz",
				email: "maria.ortiz@cita.pro",
				role: "professional",
				initials: "MO"
			}
		}[demoRole]);
		if (demoRole === "professional") navigate("/professional");
		else navigate("/client");
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
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-3 mb-6",
						children: [/* @__PURE__ */ jsxs("button", {
							className: "flex-1 flex items-center justify-center gap-2 border border-border rounded py-3 bg-surface hover:bg-bg transition-colors text-sm font-semibold text-ink",
							children: [/* @__PURE__ */ jsx(GoogleIcon, {}), " Google"]
						}), /* @__PURE__ */ jsx("button", {
							className: "flex-1 flex items-center justify-center gap-2 border border-border rounded py-3 bg-surface hover:bg-bg transition-colors text-sm font-semibold text-ink",
							children: "Apple"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "border border-dashed border-border rounded p-4 space-y-2",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted text-center font-semibold uppercase tracking-widest",
							children: "Acceso rápido (Demo)"
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ jsx("button", {
								onClick: () => handleDemo("client"),
								className: "flex-1 text-xs bg-primary-soft text-ink rounded py-2 font-semibold hover:bg-ink hover:text-white transition-colors",
								children: "Demo Cliente"
							}), /* @__PURE__ */ jsx("button", {
								onClick: () => handleDemo("professional"),
								className: "flex-1 text-xs bg-accent text-ink rounded py-2 font-semibold hover:bg-ink hover:text-white transition-colors",
								children: "Demo Profesional"
							})]
						})]
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
			const data = await api.post("/auth/register", {
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
//#region app/components/ClientSidebar.tsx
var navItems$2 = [
	{
		to: "/client/discover",
		label: "Descubrir",
		icon: SearchIcon
	},
	{
		to: "/client",
		label: "Mis reservas",
		icon: CalendarIcon$1,
		end: true
	},
	{
		to: "/client/packages",
		label: "Mis paquetes",
		icon: PackageIcon$2
	},
	{
		to: "/client/messages",
		label: "Mensajes",
		icon: MessageIcon$1,
		badge: 2
	},
	{
		to: "/client/payments",
		label: "Pagos",
		icon: CardIcon$1
	}
];
function ClientSidebar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	return /* @__PURE__ */ jsxs("aside", {
		className: "w-56 min-h-screen bg-sidebar flex flex-col",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "p-5 border-b border-white/10",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "w-5 h-5 rounded-sm bg-surface flex items-center justify-center",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-ink font-bold text-xs",
							children: "+"
						})
					}), /* @__PURE__ */ jsx("span", {
						className: "font-display text-sidebar-text text-lg tracking-tight",
						children: "Cita.Pro"
					})]
				})
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "flex-1 p-3 space-y-0.5",
				children: navItems$2.map(({ to, label, icon: Icon, badge, end }) => /* @__PURE__ */ jsxs(NavLink, {
					to,
					end,
					className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`,
					children: [
						/* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 shrink-0" }),
						/* @__PURE__ */ jsx("span", {
							className: "flex-1",
							children: label
						}),
						badge && /* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold",
							children: badge
						})
					]
				}, to))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "p-3 border-t border-white/10",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 px-3 py-2",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-ink text-xs font-bold shrink-0",
							children: user?.initials ?? "LP"
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
							onClick: () => {
								logout();
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
function MessageIcon$1({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
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
//#endregion
//#region app/routes/client/_layout.tsx
var _layout_exports$2 = /* @__PURE__ */ __exportAll({ default: () => _layout_default$2 });
var _layout_default$2 = UNSAFE_withComponentProps(function ClientLayout() {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
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
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-screen bg-bg",
		children: [/* @__PURE__ */ jsx(ClientSidebar, {}), /* @__PURE__ */ jsx("main", {
			className: "flex-1 overflow-auto",
			children: /* @__PURE__ */ jsx(Outlet, {})
		})]
	});
});
//#endregion
//#region app/routes/client/dashboard.tsx
var dashboard_exports$2 = /* @__PURE__ */ __exportAll({ default: () => dashboard_default$2 });
var upcomingBookings = [
	{
		id: 1,
		date: "MAY",
		day: "20",
		initials: "MO",
		name: "María Ortiz",
		status: "Confirmada",
		statusKey: "confirmada",
		detail: "Sesión individual · 16:30 · 50 min · Virtual"
	},
	{
		id: 2,
		date: "MAY",
		day: "24",
		initials: "AC",
		name: "Andrés Calleja",
		status: "Pagada",
		statusKey: "pagada",
		detail: "Entrenamiento personalizado · Lun 09:00 · 60 min · Presencial"
	},
	{
		id: 3,
		date: "MAY",
		day: "28",
		initials: "LS",
		name: "Liana Souza",
		status: "Pendiente",
		statusKey: "pendiente",
		detail: "Asesoría nutricional · Vie 11:00 · 45 min · Virtual"
	}
];
var badgeClass = {
	confirmada: "badge-confirmada",
	pendiente: "badge-pendiente",
	pagada: "badge-pagada"
};
var avatarColors = {
	MO: "bg-violet-400",
	AC: "bg-orange-400",
	LS: "bg-teal-500"
};
var dashboard_default$2 = UNSAFE_withComponentProps(function ClientDashboard() {
	const { user } = useAuth();
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between mb-8",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h1", {
					className: "font-display italic text-3xl text-ink",
					children: ["Hola, ", user?.name?.split(" ")[0] ?? "Lucía"]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Tenés 2 reservas próximas y 1 paquete activo."
				})] }), /* @__PURE__ */ jsx(Link, {
					to: "/client/discover",
					className: "flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors",
					children: "+ Nueva reserva"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-primary-soft rounded-2xl p-6 mb-8 flex items-start justify-between",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("span", {
						className: "inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2",
						children: [/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-accent inline-block" }), "Hoy · en 2h 14min"]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "font-display italic text-2xl text-ink mb-2",
						children: "Sesión con María Ortiz"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-4 text-sm text-ink-muted",
						children: [
							/* @__PURE__ */ jsx("span", { children: "16:30 — 17:20" }),
							/* @__PURE__ */ jsx("span", { children: "Virtual" }),
							/* @__PURE__ */ jsx("span", { children: "Paquete · sesión 5/8" })
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-3 mt-4",
						children: [/* @__PURE__ */ jsx(Link, {
							to: "/session/1",
							className: "flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors",
							children: "Entrar a la sesión"
						}), /* @__PURE__ */ jsx("button", {
							className: "text-sm font-medium text-ink border border-border bg-white hover:bg-bg px-4 py-2 rounded-xl transition-colors",
							children: "Reprogramar"
						})]
					})
				] }), /* @__PURE__ */ jsx("div", {
					className: "w-40 h-28 rounded-xl opacity-60 shrink-0 hidden md:block",
					style: { background: "linear-gradient(135deg, #e07055, #c8ddd2)" }
				})]
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
						}), /* @__PURE__ */ jsx("div", {
							className: "flex gap-1",
							children: [
								"Próximas",
								"Pasadas",
								"Canceladas"
							].map((tab) => /* @__PURE__ */ jsx("button", {
								className: `text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${tab === "Próximas" ? "bg-surface border border-border text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`,
								children: tab
							}, tab))
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-3",
						children: upcomingBookings.map((b) => /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl p-4 flex items-center gap-4",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "text-center min-w-10",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted uppercase font-medium",
										children: b.date
									}), /* @__PURE__ */ jsx("p", {
										className: "font-display italic text-2xl text-ink",
										children: b.day
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: `w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${avatarColors[b.initials] ?? "bg-primary"}`,
									children: b.initials
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 mb-0.5",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-sm font-medium text-ink",
											children: b.name
										}), /* @__PURE__ */ jsx("span", {
											className: `badge ${badgeClass[b.statusKey]}`,
											children: b.status
										})]
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted truncate",
										children: b.detail
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("button", {
										className: "text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-bg transition-colors",
										children: "Ver"
									}), /* @__PURE__ */ jsx("button", {
										className: "text-ink-muted hover:text-ink",
										children: /* @__PURE__ */ jsx(DotsIcon, {})
									})]
								})
							]
						}, b.id))
					})]
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between mb-4",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "font-display italic text-xl text-ink",
						children: "Paquetes"
					}), /* @__PURE__ */ jsx(Link, {
						to: "/client/packages",
						className: "text-sm text-primary underline",
						children: "Ver todos"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl p-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-1.5 text-xs text-primary font-medium mb-2",
								children: [/* @__PURE__ */ jsx(PackageIcon$1, {}), "Activo"]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "font-display italic text-lg text-ink mb-3",
								children: "Paquete 8 sesiones · M. Ortiz"
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-ink-muted text-sm mb-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-3xl font-bold text-ink",
									children: "5"
								}), " de 8 sesiones restantes"]
							}),
							/* @__PURE__ */ jsx("div", {
								className: "h-1.5 bg-border rounded-full mb-3",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full bg-primary rounded-full",
									style: { width: "62.5%" }
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between text-xs text-ink-muted",
								children: [/* @__PURE__ */ jsx("span", { children: "Vence 12 ago 2026" }), /* @__PURE__ */ jsx("span", { children: "€320 · pagado" })]
							})
						]
					}), /* @__PURE__ */ jsxs(Link, {
						to: "/client/packages",
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
					})]
				})] })]
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
var professionals = [
	{
		id: 1,
		initials: "MO",
		name: "María Ortiz",
		specialty: "Psicología clínica",
		rating: 4.9,
		reviews: 234,
		modalities: ["Presencial", "Virtual"],
		next: "Hoy 16:30",
		price: 48,
		top: true,
		color: "from-orange-200 to-rose-200",
		avatarColor: "bg-violet-400"
	},
	{
		id: 2,
		initials: "AC",
		name: "Andrés Calleja",
		specialty: "Entrenamiento personalizado",
		rating: 4.7,
		reviews: 88,
		modalities: ["Presencial", "Híbrida"],
		next: "Mañana 09:00",
		price: 35,
		top: false,
		color: "from-orange-100 to-amber-100",
		avatarColor: "bg-orange-400"
	},
	{
		id: 3,
		initials: "LS",
		name: "Liana Souza",
		specialty: "Nutrición · Asesoría",
		rating: 5,
		reviews: 56,
		modalities: ["Virtual"],
		next: "Jueves 11:00",
		price: 42,
		top: true,
		color: "from-teal-100 to-green-100",
		avatarColor: "bg-teal-500"
	},
	{
		id: 4,
		initials: "TR",
		name: "Tomás Riveiro",
		specialty: "Coaching ejecutivo",
		rating: 4.8,
		reviews: 142,
		modalities: ["Virtual", "Híbrida"],
		next: "Hoy 18:00",
		price: 80,
		top: false,
		color: "from-purple-100 to-violet-100",
		avatarColor: "bg-purple-500"
	},
	{
		id: 5,
		initials: "NA",
		name: "Nora Aguilar",
		specialty: "Fisioterapia",
		rating: 4.6,
		reviews: 73,
		modalities: ["Presencial"],
		next: "Sáb 10:30",
		price: 55,
		top: false,
		color: "from-pink-100 to-rose-100",
		avatarColor: "bg-pink-500"
	},
	{
		id: 6,
		initials: "JM",
		name: "Julián Marín",
		specialty: "Asesoría financiera",
		rating: 4.9,
		reviews: 31,
		modalities: ["Virtual"],
		next: "Mañana 14:00",
		price: 95,
		top: true,
		color: "from-sky-100 to-blue-100",
		avatarColor: "bg-blue-500"
	}
];
var serviceTypes = [
	{
		label: "Salud y bienestar",
		count: 42,
		key: "salud"
	},
	{
		label: "Consultoría",
		count: 28,
		key: "consultoria"
	},
	{
		label: "Entrenamiento",
		count: 17,
		key: "entrenamiento"
	},
	{
		label: "Educación",
		count: 24,
		key: "educacion"
	},
	{
		label: "Servicios técnicos",
		count: 13,
		key: "tecnicos"
	}
];
var modalities = [
	"Todas",
	"Presencial",
	"Virtual",
	"Híbrida"
];
var discover_default = UNSAFE_withComponentProps(function Discover() {
	const [selectedTypes, setSelectedTypes] = useState(["salud", "consultoria"]);
	const [selectedModality, setSelectedModality] = useState("Todas");
	const [priceRange, setPriceRange] = useState(120);
	const [minRating, setMinRating] = useState(4);
	const [availability, setAvailability] = useState("Esta semana");
	const toggleType = (key) => {
		setSelectedTypes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen overflow-hidden",
		children: [/* @__PURE__ */ jsxs("aside", {
			className: "w-64 bg-surface border-r border-border overflow-y-auto p-5 shrink-0",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between mb-4",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-sm font-semibold text-ink uppercase tracking-wide",
						children: "Filtros"
					}), /* @__PURE__ */ jsx("button", {
						className: "text-xs text-primary underline",
						children: "Limpiar"
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mb-5",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Tipo de servicio"
					}), /* @__PURE__ */ jsx("div", {
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
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mb-5",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Modalidad"
					}), /* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap gap-1.5",
						children: modalities.map((m) => /* @__PURE__ */ jsx("button", {
							onClick: () => setSelectedModality(m),
							className: `text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedModality === m ? "bg-ink text-white border-ink" : "border-border text-ink-muted hover:border-ink hover:text-ink"}`,
							children: m
						}, m))
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mb-5",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
							children: "Precio por sesión"
						}),
						/* @__PURE__ */ jsx("input", {
							type: "range",
							min: 20,
							max: 150,
							value: priceRange,
							onChange: (e) => setPriceRange(Number(e.target.value)),
							className: "w-full accent-primary"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between text-xs text-ink-muted mt-1",
							children: [/* @__PURE__ */ jsx("span", { children: "€20" }), /* @__PURE__ */ jsxs("span", { children: ["€", priceRange] })]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mb-5",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Calificación mínima"
					}), /* @__PURE__ */ jsx("div", {
						className: "flex gap-1.5",
						children: [
							5,
							4,
							3
						].map((r) => /* @__PURE__ */ jsxs("button", {
							onClick: () => setMinRating(r),
							className: `text-xs px-3 py-1.5 rounded-full border transition-colors ${minRating === r ? "bg-ink text-white border-ink" : "border-border text-ink-muted hover:border-ink hover:text-ink"}`,
							children: [
								"★ ",
								r,
								"+"
							]
						}, r))
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mb-5",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
						children: "Disponibilidad"
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-2",
						children: [
							"Hoy",
							"Esta semana",
							"Próximos 30 días"
						].map((a) => /* @__PURE__ */ jsxs("label", {
							className: "flex items-center gap-2 cursor-pointer",
							children: [/* @__PURE__ */ jsx("input", {
								type: "radio",
								name: "availability",
								checked: availability === a,
								onChange: () => setAvailability(a),
								className: "accent-primary"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink",
								children: a
							})]
						}, a))
					})]
				}),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
					className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
					children: "Ubicación"
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-bg",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-ink-muted text-sm",
						children: "📍"
					}), /* @__PURE__ */ jsx("input", {
						className: "flex-1 bg-transparent text-sm text-ink placeholder-ink-muted outline-none",
						placeholder: "Palermo, CABA"
					})]
				})] })
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 overflow-y-auto p-6",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between mb-6",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
						className: "font-display italic text-3xl text-ink mb-1",
						children: "Encontrá a tu profesional"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-ink-muted text-sm",
						children: "124 profesionales disponibles esta semana"
					})] }), /* @__PURE__ */ jsx("button", {
						className: "relative p-2 rounded-xl border border-border bg-surface hover:bg-bg",
						children: /* @__PURE__ */ jsx(BellIcon$2, {})
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 mb-6 flex-wrap",
					children: [
						selectedTypes.includes("salud") && /* @__PURE__ */ jsx("span", {
							className: "flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium",
							children: "✓ Salud y bienestar"
						}),
						selectedTypes.includes("consultoria") && /* @__PURE__ */ jsx("span", {
							className: "flex items-center gap-1 text-xs bg-primary-soft text-primary px-3 py-1 rounded-full font-medium",
							children: "✓ Consultoría"
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "text-xs bg-bg border border-border text-ink-muted px-3 py-1 rounded-full",
							children: [
								"★ ",
								minRating,
								"+ estrellas"
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ml-auto flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx("button", {
									className: "text-sm text-ink px-3 py-1.5 rounded-lg border border-border bg-surface font-medium",
									children: "Grilla"
								}),
								/* @__PURE__ */ jsx("button", {
									className: "text-sm text-ink-muted px-3 py-1.5 rounded-lg hover:bg-bg",
									children: "Lista"
								}),
								/* @__PURE__ */ jsx("button", {
									className: "text-sm text-ink-muted px-3 py-1.5 rounded-lg hover:bg-bg",
									children: "Mapa"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-ink-muted",
									children: "|"
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "text-sm text-ink-muted",
									children: ["Ordenar: ", /* @__PURE__ */ jsx("strong", {
										className: "text-ink",
										children: "Mejor valorados"
									})]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",
					children: professionals.map((pro) => /* @__PURE__ */ jsx(Link, {
						to: `/client/professional/${pro.id}`,
						children: /* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group",
							children: [/* @__PURE__ */ jsxs("div", {
								className: `h-28 bg-gradient-to-br ${pro.color} relative`,
								children: [pro.top && /* @__PURE__ */ jsx("span", {
									className: "absolute top-3 left-3 text-xs bg-ink text-white px-2.5 py-1 rounded-full font-medium",
									children: "★ Top valorado"
								}), /* @__PURE__ */ jsx("button", {
									className: "absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-ink-muted hover:text-accent transition-colors",
									children: "♡"
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "p-4",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-start gap-3 mb-3",
										children: [/* @__PURE__ */ jsx("div", {
											className: `w-9 h-9 rounded-full ${pro.avatarColor} flex items-center justify-center text-white text-xs font-semibold shrink-0 -mt-7 border-2 border-white`,
											children: pro.initials
										}), /* @__PURE__ */ jsxs("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ jsx("p", {
												className: "text-sm font-semibold text-ink",
												children: pro.name
											}), /* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted",
												children: pro.specialty
											})]
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-1 mb-3",
										children: [
											/* @__PURE__ */ jsx("span", {
												className: "text-xs text-amber-500",
												children: "★★★★★"
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-xs text-ink font-medium",
												children: pro.rating
											}),
											/* @__PURE__ */ jsxs("span", {
												className: "text-xs text-ink-muted",
												children: [
													"(",
													pro.reviews,
													")"
												]
											})
										]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "flex flex-wrap gap-1.5 mb-3",
										children: pro.modalities.map((m) => /* @__PURE__ */ jsxs("span", {
											className: `text-xs px-2 py-0.5 rounded-full border ${m === "Virtual" ? "border-primary/30 text-primary bg-primary-soft/40" : m === "Presencial" ? "border-border text-ink-muted bg-bg" : "border-border text-ink-muted bg-bg"}`,
											children: [m === "Virtual" ? "⬜ " : "📍 ", m]
										}, m))
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex items-end justify-between",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: "Próximo"
										}), /* @__PURE__ */ jsx("p", {
											className: "text-sm font-medium text-ink",
											children: pro.next
										})] }), /* @__PURE__ */ jsxs("div", {
											className: "text-right",
											children: [/* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted",
												children: "desde"
											}), /* @__PURE__ */ jsxs("p", {
												className: "text-lg font-bold text-ink",
												children: ["€", pro.price]
											})]
										})]
									})
								]
							})]
						})
					}, pro.id))
				})
			]
		})]
	});
});
function BellIcon$2() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })]
	});
}
//#endregion
//#region app/routes/client/professional.$id.tsx
var professional_$id_exports = /* @__PURE__ */ __exportAll({ default: () => professional_$id_default });
var DAYS$1 = [
	"L",
	"M",
	"X",
	"J",
	"V",
	"S",
	"D"
];
var TIMES = [
	"09:00",
	"10:00",
	"11:30",
	"14:00",
	"15:00",
	"16:30"
];
var professional_$id_default = UNSAFE_withComponentProps(function ProfessionalDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("Servicios · 6");
	const [selectedTime, setSelectedTime] = useState("15:00");
	const [selectedDate, setSelectedDate] = useState(22);
	const calendarDays = [
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
	const availableDays = [
		5,
		8,
		12,
		14,
		15,
		19,
		22,
		26,
		28
	];
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
					/* @__PURE__ */ jsx("span", { children: "Salud y bienestar" })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display italic text-3xl text-ink",
					children: "María Ortiz"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted",
					children: "Psicología clínica · Palermo · CABA"
				})] }), /* @__PURE__ */ jsxs("button", {
					className: "relative p-2 rounded-xl border border-border bg-surface hover:bg-bg",
					children: [/* @__PURE__ */ jsx(BellIcon$1, {}), /* @__PURE__ */ jsx("span", {
						className: "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center",
						children: "3"
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "lg:col-span-2 space-y-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl overflow-hidden",
						children: [/* @__PURE__ */ jsx("div", {
							className: "h-40 w-full",
							style: { background: "linear-gradient(135deg, #e8c4b8, #d4a89a)" }
						}), /* @__PURE__ */ jsx("div", {
							className: "px-6 pb-6",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-4 -mt-6 mb-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-16 h-16 rounded-full bg-violet-400 flex items-center justify-center text-white text-xl font-semibold border-4 border-white",
									children: "MO"
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex-1 mt-7",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h2", {
											className: "font-display italic text-xl text-ink flex items-center gap-2",
											children: ["María Ortiz", /* @__PURE__ */ jsx("span", {
												className: "text-ink-muted text-base",
												children: "○"
											})]
										}), /* @__PURE__ */ jsx("p", {
											className: "text-sm text-ink-muted",
											children: "Psicología clínica · 8 años de experiencia"
										})] }), /* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ jsx("button", {
												className: "flex items-center gap-1.5 border border-border px-3 py-2 rounded-xl text-sm text-ink hover:bg-bg transition-colors",
												children: "💬 Mensaje"
											}), /* @__PURE__ */ jsx("button", {
												className: "w-9 h-9 border border-border rounded-xl flex items-center justify-center text-ink-muted hover:text-accent transition-colors",
												children: "♡"
											})]
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-4 mt-2 text-sm",
										children: [
											/* @__PURE__ */ jsxs("span", {
												className: "text-amber-500",
												children: [
													"★★★★★ ",
													/* @__PURE__ */ jsx("span", {
														className: "text-ink font-medium",
														children: "4.9"
													}),
													" ",
													/* @__PURE__ */ jsx("span", {
														className: "text-ink-muted",
														children: "(234 reseñas)"
													})
												]
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-ink-muted",
												children: "📍 Palermo · CABA"
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-ink-muted",
												children: "🌐 Habla ES · EN"
											})
										]
									})]
								})]
							})
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded-2xl overflow-hidden",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex border-b border-border px-2 pt-2",
							children: [
								"Acerca de",
								"Servicios · 6",
								"Paquetes · 3",
								"Reseñas · 234"
							].map((tab) => /* @__PURE__ */ jsx("button", {
								onClick: () => setActiveTab(tab),
								className: `px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? "border border-border border-b-surface -mb-px bg-surface text-ink" : "text-ink-muted hover:text-ink"}`,
								children: tab
							}, tab))
						}), /* @__PURE__ */ jsxs("div", {
							className: "p-6",
							children: [
								activeTab.startsWith("Acerca") && /* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink leading-relaxed",
									children: "Psicóloga clínica con enfoque cognitivo-conductual. Trabajo con adultos en procesos de ansiedad, transiciones vitales y vínculos. Sesiones cálidas y enfocadas, con un seguimiento entre encuentros si lo necesitás."
								}),
								activeTab.startsWith("Servicios") && /* @__PURE__ */ jsxs("div", {
									className: "space-y-3",
									children: [/* @__PURE__ */ jsx("h4", {
										className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3",
										children: "Servicios individuales"
									}), [
										{
											name: "Sesión individual",
											badge: "Más reservada",
											duration: "50 min",
											modalities: "Presencial · Virtual",
											price: 48
										},
										{
											name: "Primera consulta · diagnóstica",
											badge: null,
											duration: "60 min",
											modalities: "Presencial · Virtual",
											price: 55
										},
										{
											name: "Sesión de pareja",
											badge: null,
											duration: "75 min",
											modalities: "Presencial",
											price: 78
										},
										{
											name: "Seguimiento breve",
											badge: null,
											duration: "25 min",
											modalities: "Virtual",
											price: 28
										}
									].map((s) => /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-4 p-4 bg-bg rounded-xl border border-border",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex-1",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "flex items-center gap-2 mb-0.5",
													children: [/* @__PURE__ */ jsx("span", {
														className: "text-sm font-medium text-ink",
														children: s.name
													}), s.badge && /* @__PURE__ */ jsx("span", {
														className: "text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full",
														children: s.badge
													})]
												}), /* @__PURE__ */ jsxs("p", {
													className: "text-xs text-ink-muted",
													children: [
														"⏱ ",
														s.duration,
														" · ",
														s.modalities
													]
												})]
											}),
											/* @__PURE__ */ jsxs("span", {
												className: "text-lg font-bold text-ink",
												children: ["€", s.price]
											}),
											/* @__PURE__ */ jsx("button", {
												onClick: () => navigate(`/client/booking/${id}/pay`),
												className: "bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors",
												children: "Reservar"
											})
										]
									}, s.name))]
								}),
								activeTab.startsWith("Paquetes") && /* @__PURE__ */ jsx("div", {
									className: "grid grid-cols-3 gap-4",
									children: [
										{
											sessions: 4,
											discount: 5,
											price: 180,
											perSession: 45,
											sold: 28
										},
										{
											sessions: 8,
											discount: 12,
											price: 320,
											perSession: 40,
											sold: 41,
											popular: true
										},
										{
											sessions: 12,
											discount: 20,
											price: 460,
											perSession: 38,
											sold: 14
										}
									].map((p) => /* @__PURE__ */ jsxs("div", {
										className: `p-4 rounded-xl border ${p.popular ? "border-primary bg-primary-soft/30" : "border-border bg-bg"}`,
										children: [
											p.popular && /* @__PURE__ */ jsx("span", {
												className: "text-xs bg-primary text-white px-2 py-0.5 rounded-full mb-2 inline-block",
												children: "Más popular"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "text-xs text-accent font-medium",
												children: [
													"−",
													p.discount,
													"%"
												]
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "font-display italic text-2xl text-ink",
												children: [p.sessions, " sesiones"]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xs text-ink-muted mb-2",
												children: "Sesión individual"
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "text-2xl font-bold text-ink",
												children: ["€", p.price]
											}),
											/* @__PURE__ */ jsxs("p", {
												className: "text-xs text-ink-muted",
												children: [
													"€",
													p.perSession,
													" por sesión"
												]
											})
										]
									}, p.sessions))
								}),
								activeTab.startsWith("Reseñas") && /* @__PURE__ */ jsx("div", {
									className: "space-y-4",
									children: [{
										name: "Lucía P.",
										stars: 5,
										text: "Súper contenida y profesional. Cada sesión siento que avanzo un poco más.",
										date: "hace 2 días"
									}, {
										name: "Carlos R.",
										stars: 5,
										text: "Excelente profesional, muy empática y puntual. La recomiendo.",
										date: "hace 1 semana"
									}].map((r) => /* @__PURE__ */ jsxs("div", {
										className: "p-4 bg-bg rounded-xl border border-border",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center justify-between mb-1",
												children: [/* @__PURE__ */ jsx("span", {
													className: "text-sm font-medium text-ink",
													children: r.name
												}), /* @__PURE__ */ jsx("span", {
													className: "text-xs text-ink-muted",
													children: r.date
												})]
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-amber-500 text-xs mb-1",
												children: "★".repeat(r.stars)
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-sm text-ink",
												children: r.text
											})
										]
									}, r.name))
								})
							]
						})]
					})]
				}), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded-2xl p-5 sticky top-6",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1",
							children: "Reservar turno"
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "font-display italic text-xl text-ink mb-3",
							children: "Sesión individual"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex gap-2 mb-4",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs bg-bg border border-border px-3 py-1 rounded-full text-ink",
								children: "📍 Presencial"
							}), /* @__PURE__ */ jsx("span", {
								className: "text-xs bg-primary-soft text-primary border border-primary/20 px-3 py-1 rounded-full",
								children: "⬜ Virtual"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mb-4",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between mb-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-sm font-medium text-ink",
									children: "Mayo 2026"
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex gap-1",
									children: [/* @__PURE__ */ jsx("button", {
										className: "w-6 h-6 rounded border border-border text-ink-muted hover:bg-bg text-xs",
										children: "‹"
									}), /* @__PURE__ */ jsx("button", {
										className: "w-6 h-6 rounded border border-border text-ink-muted hover:bg-bg text-xs",
										children: "›"
									})]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-7 gap-0.5",
								children: [DAYS$1.map((d) => /* @__PURE__ */ jsx("div", {
									className: "text-center text-xs text-ink-muted py-1 font-medium",
									children: d
								}, d)), calendarDays.flat().map((day, i) => {
									const isAvailable = availableDays.includes(day);
									const isSelected = day === selectedDate;
									return /* @__PURE__ */ jsxs("button", {
										onClick: () => isAvailable && setSelectedDate(day),
										className: `text-xs py-1.5 rounded-lg transition-colors ${isSelected ? "bg-primary text-white font-semibold" : isAvailable ? "hover:bg-primary-soft text-ink relative" : "text-ink-muted"}`,
										children: [day, isAvailable && !isSelected && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" })]
									}, i);
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mb-4",
							children: [/* @__PURE__ */ jsxs("p", {
								className: "text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2",
								children: [
									"VIE ",
									selectedDate,
									" · HORARIOS LIBRES"
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "grid grid-cols-3 gap-1.5",
								children: TIMES.map((t) => /* @__PURE__ */ jsx("button", {
									onClick: () => setSelectedTime(t),
									className: `text-sm py-2 rounded-xl border transition-colors ${selectedTime === t ? "bg-primary text-white border-primary" : "border-border text-ink hover:bg-bg"}`,
									children: t
								}, t))
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between text-sm mb-4",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-ink-muted",
								children: "Sesión de 50 min"
							}), /* @__PURE__ */ jsx("span", {
								className: "font-display italic text-2xl text-ink",
								children: "€48"
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => navigate(`/client/booking/${id}/pay`),
							className: "w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors",
							children: "Confirmar reserva →"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted text-center mt-2",
							children: "Cancelación gratuita hasta 24h antes"
						})
					]
				}) })]
			})
		]
	});
});
function BellIcon$1() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })]
	});
}
//#endregion
//#region app/routes/client/booking.$id.pay.tsx
var booking_$id_pay_exports = /* @__PURE__ */ __exportAll({ default: () => booking_$id_pay_default });
var STEPS = [
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
		className: "p-8 max-w-5xl mx-auto",
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
//#region app/routes/client/packages.tsx
var packages_exports = /* @__PURE__ */ __exportAll({ default: () => packages_default });
var activePackages = [{
	id: 1,
	initials: "MO",
	name: "María Ortiz",
	title: "Paquete 8 sesiones",
	used: 5,
	total: 8,
	expires: "12 ago 2026",
	paid: 320,
	color: "bg-violet-500"
}];
var availablePackages = [
	{
		sessions: 4,
		discount: 5,
		price: 180,
		perSession: 45
	},
	{
		sessions: 8,
		discount: 12,
		price: 320,
		perSession: 40,
		popular: true
	},
	{
		sessions: 12,
		discount: 20,
		price: 460,
		perSession: 38
	}
];
var packages_default = UNSAFE_withComponentProps(function Packages() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-4xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink mb-6",
				children: "Mis paquetes"
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mb-10",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-4",
					children: "ACTIVOS"
				}), activePackages.map((p) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-6 flex items-center gap-6",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: `w-14 h-14 rounded-lg ${p.color} flex items-center justify-center text-white font-bold text-lg`,
							children: p.initials
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ jsxs("h3", {
									className: "font-display text-xl text-ink mb-1",
									children: [
										p.title,
										" · ",
										p.name
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-4 text-sm text-ink-muted mb-3",
									children: [/* @__PURE__ */ jsxs("span", { children: ["Vence ", p.expires] }), /* @__PURE__ */ jsxs("span", { children: [
										"€",
										p.paid,
										" · pagado"
									] })]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ jsx("div", {
										className: "flex-1 h-2 bg-border rounded-full",
										children: /* @__PURE__ */ jsx("div", {
											className: "h-full bg-ink rounded-full",
											style: { width: `${(p.total - p.used) / p.total * 100}%` }
										})
									}), /* @__PURE__ */ jsxs("span", {
										className: "text-sm font-semibold text-ink whitespace-nowrap",
										children: [
											p.total - p.used,
											" de ",
											p.total,
											" sesiones restantes"
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ jsx("span", {
							className: "badge badge-confirmada",
							children: "ACTIVO"
						})
					]
				}, p.id))]
			}),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-4",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xs font-bold text-ink-muted uppercase tracking-widest",
					children: "COMPRAR PAQUETE"
				}), /* @__PURE__ */ jsx("span", {
					className: "text-xs text-ink-muted",
					children: "Hasta 20% off en sesiones múltiples"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-3 gap-5",
				children: availablePackages.map((p) => /* @__PURE__ */ jsxs("div", {
					className: `rounded border p-5 ${p.popular ? "border-ink bg-surface shadow-md" : "border-border bg-surface"}`,
					children: [
						p.popular && /* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold bg-ink text-white px-2 py-0.5 rounded mb-3 inline-block",
							children: "MÁS POPULAR"
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "text-xs font-bold bg-accent text-ink px-2 py-0.5 rounded mb-2 inline-block",
							children: [
								"−",
								p.discount,
								"%"
							]
						}),
						/* @__PURE__ */ jsxs("h3", {
							className: "font-display text-3xl text-ink mb-1",
							children: [p.sessions, " sesiones"]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted mb-3",
							children: "Sesión individual"
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "font-display text-4xl text-ink font-bold mb-1",
							children: ["€", p.price]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-ink-muted mb-4",
							children: [
								"€",
								p.perSession,
								" por sesión"
							]
						}),
						/* @__PURE__ */ jsx("button", {
							className: "w-full bg-ink text-white py-2.5 rounded hover:bg-primary font-semibold text-sm transition-colors",
							children: "Comprar →"
						})
					]
				}, p.sessions))
			})] })
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
var transactions$2 = [
	{
		date: "22 may",
		pro: "María Ortiz",
		service: "Sesión individual · paquete",
		amount: 40,
		status: "pagada"
	},
	{
		date: "15 may",
		pro: "Andrés Calleja",
		service: "Entrenamiento personalizado",
		amount: 35,
		status: "pagada"
	},
	{
		date: "10 may",
		pro: "María Ortiz",
		service: "Paquete 8 sesiones",
		amount: 320,
		status: "pagada"
	},
	{
		date: "5 may",
		pro: "Liana Souza",
		service: "Asesoría nutricional",
		amount: 42,
		status: "reembolsada"
	}
];
var badgeCls$3 = {
	pagada: "badge badge-pagada",
	reembolsada: "badge badge-cancelada"
};
var payments_default$2 = UNSAFE_withComponentProps(function ClientPayments() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-4xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink mb-6",
				children: "Pagos"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-2 gap-4 mb-8",
				children: [{
					label: "TOTAL ESTE MES",
					value: "€395"
				}, {
					label: "TRANSACCIONES",
					value: "4"
				}].map((c) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-5",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
						children: c.label
					}), /* @__PURE__ */ jsx("p", {
						className: "font-display text-3xl text-ink font-bold",
						children: c.value
					})]
				}, c.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded overflow-hidden",
				children: [/* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
					children: [
						"FECHA",
						"PROFESIONAL",
						"SERVICIO",
						"MONTO",
						"ESTADO"
					].map((h, i) => /* @__PURE__ */ jsx("div", {
						className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 2 ? "col-span-4" : i === 3 ? "col-span-2" : "col-span-2"}`,
						children: h
					}, i))
				}), transactions$2.map((t, i) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "col-span-1",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink-muted",
								children: t.date
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-3",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-ink",
								children: t.pro
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-4",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink-muted",
								children: t.service
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsxs("span", {
								className: "font-display text-lg font-bold text-ink",
								children: ["€", t.amount]
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsx("span", {
								className: badgeCls$3[t.status],
								children: t.status.toUpperCase()
							})
						})
					]
				}, i))]
			})
		]
	});
});
//#endregion
//#region app/routes/client/notifications.tsx
var notifications_exports = /* @__PURE__ */ __exportAll({ default: () => notifications_default });
var notifications = [
	{
		id: 1,
		icon: "✓",
		title: "Tu reserva fue confirmada",
		body: "María Ortiz confirmó tu sesión del vie 22 may a las 15:00.",
		time: "hace 12 min",
		unread: true,
		actions: ["Ver detalle", "Agregar a calendario"],
		category: "reservas"
	},
	{
		id: 2,
		icon: "💬",
		title: "Nuevo mensaje de María Ortiz",
		body: "\"Antes de la sesión, completá el formulario que te envié por mail. ¡Nos vemos!\"",
		time: "hace 1 h",
		unread: true,
		actions: ["Responder"],
		category: "mensajes"
	},
	{
		id: 3,
		icon: "🔔",
		title: "Recordatorio: sesión en 24h",
		body: "Sesión con María Ortiz mañana 16:30 · Virtual. El enlace estará disponible 15 min antes.",
		time: "hace 2 h",
		unread: true,
		actions: ["Reprogramar"],
		category: "reservas"
	},
	{
		id: 4,
		icon: "$",
		title: "Pago confirmado",
		body: "Pago de €48 procesado para tu sesión del 22 may. Comprobante enviado.",
		time: "ayer",
		unread: false,
		actions: [],
		category: "pagos"
	},
	{
		id: 5,
		icon: "📦",
		title: "Tu paquete bajó a 5 sesiones",
		body: "Te quedan 5 de 8 sesiones · vence el 12 ago 2026.",
		time: "lunes",
		unread: false,
		actions: [],
		category: "sistema"
	},
	{
		id: 6,
		icon: "✕",
		title: "Sesión reprogramada",
		body: "Andrés Calleja propuso mover la sesión del 24 may a las 11:00 (antes 09:00).",
		time: "lunes",
		unread: false,
		actions: [],
		category: "reservas"
	}
];
var TABS = [
	"Todas · 24",
	"Reservas · 9",
	"Pagos · 4",
	"Mensajes · 7",
	"Sistema · 4"
];
var channels = [
	"Email",
	"Push (móvil)",
	"WhatsApp",
	"SMS"
];
var channelSubs = [
	"lucia@gmail.com",
	"iPhone · Chrome",
	"+54 11 5······",
	"Solo recordatorios"
];
var channelEnabled = [
	true,
	true,
	false,
	false
];
var topicToggles = [
	{
		label: "Confirmaciones de reserva",
		enabled: true
	},
	{
		label: "Recordatorios 24h y 1h",
		enabled: true
	},
	{
		label: "Mensajes nuevos",
		enabled: true
	},
	{
		label: "Cambios y cancelaciones",
		enabled: true
	},
	{
		label: "Promos y novedades",
		enabled: false
	}
];
var Toggle$2 = ({ checked }) => /* @__PURE__ */ jsx("div", {
	className: `relative w-10 h-5 rounded-full cursor-pointer ${checked ? "bg-ink" : "bg-border"}`,
	children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}` })
});
var notifications_default = UNSAFE_withComponentProps(function Notifications() {
	const [activeTab, setActiveTab] = useState("Todas · 24");
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Notificaciones"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "14 nuevas · 3 sin leer"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("button", {
						className: "flex items-center gap-2 text-sm font-semibold text-ink border border-border px-4 py-2 rounded bg-surface hover:bg-bg transition-colors",
						children: "✓ Marcar todo como leído"
					}), /* @__PURE__ */ jsx("button", {
						className: "p-2 border border-border rounded bg-surface hover:bg-bg",
						children: "⚙"
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex gap-2 mb-6 border-b border-border pb-2 overflow-x-auto",
				children: TABS.map((tab) => /* @__PURE__ */ jsx("button", {
					onClick: () => setActiveTab(tab),
					className: `text-sm font-semibold px-4 py-2 rounded whitespace-nowrap transition-colors ${activeTab === tab ? "bg-ink text-white" : "text-ink-muted hover:text-ink hover:bg-bg"}`,
					children: tab
				}, tab))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-3 gap-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "col-span-2 space-y-3",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest",
							children: "HOY"
						}),
						notifications.slice(0, 3).map((n) => /* @__PURE__ */ jsx("div", {
							className: `bg-surface border rounded p-4 ${n.unread ? "border-ink/20" : "border-border"}`,
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: `w-8 h-8 rounded flex items-center justify-center text-sm shrink-0 ${n.unread ? "bg-accent text-ink" : "bg-bg text-ink-muted"}`,
									children: n.icon
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between mb-1",
											children: [/* @__PURE__ */ jsxs("p", {
												className: "text-sm font-semibold text-ink flex items-center gap-2",
												children: [n.title, n.unread && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-accent inline-block" })]
											}), /* @__PURE__ */ jsx("span", {
												className: "text-xs text-ink-muted whitespace-nowrap ml-2",
												children: n.time
											})]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted mb-2",
											children: n.body
										}),
										n.actions.length > 0 && /* @__PURE__ */ jsx("div", {
											className: "flex gap-2",
											children: n.actions.map((a) => /* @__PURE__ */ jsx("button", {
												className: "text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded hover:bg-primary transition-colors",
												children: a
											}, a))
										})
									]
								})]
							})
						}, n.id)),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest pt-2",
							children: "ESTA SEMANA"
						}),
						notifications.slice(3).map((n) => /* @__PURE__ */ jsx("div", {
							className: "bg-surface border border-border rounded p-4",
							children: /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "w-8 h-8 rounded bg-bg text-ink-muted flex items-center justify-center text-sm shrink-0",
									children: n.icon
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between mb-1",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-semibold text-ink",
											children: n.title
										}), /* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted whitespace-nowrap ml-2",
											children: n.time
										})]
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: n.body
									})]
								})]
							})
						}, n.id))
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-sm font-semibold text-ink mb-1",
								children: "Canales"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted mb-4",
								children: "Cómo querés enterarte"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-3",
								children: channels.map((ch, i) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm font-semibold text-ink",
										children: ch
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: channelSubs[i]
									})] }), /* @__PURE__ */ jsx(Toggle$2, { checked: channelEnabled[i] })]
								}, ch))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "border-t border-border mt-4 pt-4",
								children: [/* @__PURE__ */ jsx("p", {
									className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-3",
									children: "Avisame sobre"
								}), /* @__PURE__ */ jsx("div", {
									className: "space-y-3",
									children: topicToggles.map((t) => /* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-sm text-ink",
											children: t.label
										}), /* @__PURE__ */ jsx(Toggle$2, { checked: t.enabled })]
									}, t.label))
								})]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-3",
							children: "VISTA PREVIA · DROPDOWN"
						}), /* @__PURE__ */ jsxs("div", {
							className: "border border-border rounded overflow-hidden",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between px-4 py-3 border-b border-border bg-bg",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-sm font-semibold text-ink",
									children: "Notificaciones"
								}), /* @__PURE__ */ jsx("span", {
									className: "badge badge-en-curso",
									children: "3 SIN LEER"
								})]
							}), [
								{
									icon: "✓",
									title: "Reserva confirmada",
									sub: "María Ortiz · vie 22 may",
									time: "12m"
								},
								{
									icon: "💬",
									title: "Nuevo mensaje",
									sub: "María: \"Antes de la sesión…\"",
									time: "1h"
								},
								{
									icon: "🔔",
									title: "Recordatorio en 24h",
									sub: "Sesión virtual con María",
									time: "2h"
								}
							].map((item, i) => /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg cursor-pointer",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "w-6 h-6 rounded bg-accent/30 flex items-center justify-center text-xs shrink-0",
										children: item.icon
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-xs font-semibold text-ink truncate",
											children: item.title
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted truncate",
											children: item.sub
										})]
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-xs text-ink-muted whitespace-nowrap",
										children: item.time
									})
								]
							}, i))]
						})]
					})]
				})]
			})
		]
	});
});
//#endregion
//#region app/components/ProfessionalSidebar.tsx
var navItems$1 = [
	{
		to: "/professional",
		label: "Resumen",
		icon: HomeIcon,
		end: true
	},
	{
		to: "/professional/agenda",
		label: "Agenda",
		icon: CalendarIcon
	},
	{
		to: "/professional/clients",
		label: "Clientes",
		icon: UsersIcon
	},
	{
		to: "/professional/services",
		label: "Servicios",
		icon: PackageIcon
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
		to: "/professional/messages",
		label: "Mensajes",
		icon: MessageIcon,
		badge: 4
	}
];
function ProfessionalSidebar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	return /* @__PURE__ */ jsxs("aside", {
		className: "w-56 min-h-screen bg-sidebar flex flex-col",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "p-5 border-b border-white/10",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "w-5 h-5 rounded-sm bg-surface flex items-center justify-center",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-ink font-bold text-xs",
							children: "+"
						})
					}), /* @__PURE__ */ jsx("span", {
						className: "font-display text-sidebar-text text-lg tracking-tight",
						children: "Cita.Pro"
					})]
				})
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "flex-1 p-3 space-y-0.5",
				children: navItems$1.map(({ to, label, icon: Icon, badge, end }) => /* @__PURE__ */ jsxs(NavLink, {
					to,
					end,
					className: ({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-white text-ink" : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"}`,
					children: [
						/* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 shrink-0" }),
						/* @__PURE__ */ jsx("span", {
							className: "flex-1",
							children: label
						}),
						badge && /* @__PURE__ */ jsx("span", {
							className: "w-5 h-5 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold",
							children: badge
						})
					]
				}, to))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "p-3 border-t border-white/10",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3 px-3 py-2",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-ink text-xs font-bold shrink-0",
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
							onClick: () => {
								logout();
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
	});
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
function UsersIcon({ className }) {
	return /* @__PURE__ */ jsxs("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [
			/* @__PURE__ */ jsx("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
			/* @__PURE__ */ jsx("circle", {
				cx: "9",
				cy: "7",
				r: "4"
			}),
			/* @__PURE__ */ jsx("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
			/* @__PURE__ */ jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
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
function MessageIcon({ className }) {
	return /* @__PURE__ */ jsx("svg", {
		className,
		fill: "none",
		viewBox: "0 0 24 24",
		stroke: "currentColor",
		strokeWidth: 2,
		children: /* @__PURE__ */ jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
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
//#endregion
//#region app/routes/professional/_layout.tsx
var _layout_exports$1 = /* @__PURE__ */ __exportAll({ default: () => _layout_default$1 });
var _layout_default$1 = UNSAFE_withComponentProps(function ProfessionalLayout() {
	const { user, isLoading } = useAuth();
	const navigate = useNavigate();
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
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-screen bg-bg",
		children: [/* @__PURE__ */ jsx(ProfessionalSidebar, {}), /* @__PURE__ */ jsx("main", {
			className: "flex-1 overflow-auto",
			children: /* @__PURE__ */ jsx(Outlet, {})
		})]
	});
});
//#endregion
//#region app/routes/professional/dashboard.tsx
var dashboard_exports$1 = /* @__PURE__ */ __exportAll({ default: () => dashboard_default$1 });
var agenda = [
	{
		time: "09:00",
		duration: "50min",
		initials: "LP",
		name: "Lucía Pérez",
		type: "Sesión individual · Virtual",
		status: "finalizada",
		color: "bg-violet-500"
	},
	{
		time: "10:30",
		duration: "50min",
		initials: "CR",
		name: "Carlos Ruiz",
		type: "Primera consulta · Presencial",
		status: "finalizada",
		color: "bg-purple-400"
	},
	{
		time: "12:00",
		duration: "60min",
		initials: "ML",
		name: "Marta López",
		type: "Sesión de pareja · Presencial",
		status: "en-vivo",
		color: "bg-orange-400",
		action: "Entrar"
	},
	{
		time: "14:00",
		duration: "50min",
		initials: "JV",
		name: "Joaquín Vega",
		type: "Sesión individual · Virtual",
		status: "confirmada",
		color: "bg-teal-500"
	},
	{
		time: "15:00",
		duration: "25min",
		initials: "SM",
		name: "Sol Méndez",
		type: "Seguimiento breve · Virtual",
		status: "confirmada",
		color: "bg-amber-500"
	},
	{
		time: "16:30",
		duration: "50min",
		initials: "LP",
		name: "Lucía Pérez",
		type: "Sesión individual · paquete · Virtual",
		status: "pagada",
		color: "bg-violet-500"
	},
	{
		time: "18:00",
		duration: "50min",
		initials: null,
		name: "— Slot libre —",
		type: "",
		status: "libre",
		color: ""
	}
];
var statusLabel = {
	finalizada: {
		label: "FINALIZADA",
		cls: "text-ink-muted text-xs font-bold uppercase"
	},
	"en-vivo": {
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
	libre: {
		label: "",
		cls: ""
	}
};
var kpis$1 = [
	{
		label: "SESIONES ESTA SEMANA",
		value: "24",
		delta: "+12%",
		sub: "vs. semana anterior"
	},
	{
		label: "INGRESOS DEL MES",
		value: "€2.840",
		delta: "+8%",
		sub: "meta: €3.500"
	},
	{
		label: "TASA DE OCUPACIÓN",
		value: "78%",
		delta: null,
		sub: "32 de 41 slots"
	},
	{
		label: "CALIFICACIÓN",
		value: "4.9",
		delta: null,
		sub: "234 reseñas · top 5%"
	}
];
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
var busyDays = [
	2,
	5,
	8,
	12,
	14,
	15,
	19,
	22,
	26,
	27,
	28
];
var dashboard_default$1 = UNSAFE_withComponentProps(function ProfessionalDashboard() {
	const { user } = useAuth();
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between mb-8",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h1", {
					className: "font-display text-3xl text-ink",
					children: ["Buenos días, ", user?.name?.split(" ")[0] ?? "María"]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Tenés 6 sesiones hoy · €312 estimados"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ jsxs("button", {
							className: "relative p-2 border border-border rounded bg-surface hover:bg-bg",
							children: [/* @__PURE__ */ jsx(BellIcon, {}), /* @__PURE__ */ jsx("span", {
								className: "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold",
								children: "4"
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							className: "flex items-center gap-2 border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink",
							children: "+ Nuevo servicio"
						}),
						/* @__PURE__ */ jsx("button", {
							className: "flex items-center gap-2 bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors",
							children: "📅 Bloquear agenda"
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-4 gap-4 mb-8",
				children: kpis$1.map((k) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-5",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: k.label
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-display text-3xl text-ink",
								children: k.value
							}), k.delta && /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold bg-accent text-ink px-1.5 py-0.5 rounded",
								children: k.delta
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted mt-1",
							children: k.sub
						})
					]
				}, k.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "col-span-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between mb-4",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "font-display text-xl text-ink",
							children: "Agenda de hoy · Miércoles 20 may"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex gap-1",
							children: [
								"Día",
								"Semana",
								"Mes"
							].map((v) => /* @__PURE__ */ jsx("button", {
								className: `text-sm px-3 py-1.5 rounded font-semibold transition-colors ${v === "Día" ? "bg-ink text-white" : "text-ink-muted hover:bg-bg border border-border"}`,
								children: v
							}, v))
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "bg-surface border border-border rounded overflow-hidden",
						children: agenda.map((item, i) => /* @__PURE__ */ jsxs("div", {
							className: `flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 ${item.status === "en-vivo" ? "bg-accent/10" : ""}`,
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "w-16 shrink-0",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm font-semibold text-ink",
										children: item.time
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: item.duration
									})]
								}),
								item.initials ? /* @__PURE__ */ jsx("div", {
									className: `w-8 h-8 rounded shrink-0 flex items-center justify-center text-white text-xs font-bold ${item.color}`,
									children: item.initials
								}) : /* @__PURE__ */ jsx("div", { className: "w-8 h-8" }),
								/* @__PURE__ */ jsxs("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ jsx("p", {
											className: `text-sm font-semibold ${item.status === "libre" ? "text-ink-muted italic" : "text-ink"}`,
											children: item.name
										}), item.status === "en-vivo" && /* @__PURE__ */ jsx("span", {
											className: "badge badge-en-vivo",
											children: "● EN VIVO"
										})]
									}), item.type && /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: item.type
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3",
									children: [
										item.status !== "libre" && item.status !== "en-vivo" && item.status !== "finalizada" && /* @__PURE__ */ jsx("span", {
											className: statusLabel[item.status]?.cls,
											children: statusLabel[item.status]?.label
										}),
										item.status === "finalizada" && /* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted font-bold uppercase",
											children: "Finalizada"
										}),
										item.status === "en-vivo" && /* @__PURE__ */ jsx(Link, {
											to: "/session/1",
											className: "flex items-center gap-2 bg-ink text-white text-sm font-semibold px-4 py-2 rounded hover:bg-primary transition-colors",
											children: "⬜ Entrar"
										}),
										item.status === "libre" && /* @__PURE__ */ jsx("button", {
											className: "text-sm text-ink-muted border border-border px-3 py-1.5 rounded hover:bg-bg transition-colors font-semibold",
											children: "Bloquear"
										})
									]
								})
							]
						}, i))
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-3",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-ink",
								children: "Mayo 2026"
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
								const busy = busyDays.includes(day);
								const today = day === 20;
								return /* @__PURE__ */ jsxs("button", {
									className: `relative text-xs py-1.5 rounded transition-colors ${today ? "bg-ink text-white font-bold" : busy ? "hover:bg-bg text-ink" : "text-ink-muted"}`,
									children: [day, busy && !today && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" })]
								}, i);
							})]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-4",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-sm font-semibold text-ink mb-3",
							children: "Por revisar"
						}), /* @__PURE__ */ jsx("div", {
							className: "space-y-2",
							children: [
								{
									icon: "📅",
									text: "3 solicitudes de reserva",
									sub: "Esperan tu confirmación"
								},
								{
									icon: "$",
									text: "€890 pendientes de liquidación",
									sub: "Se acreditan el viernes"
								},
								{
									icon: "★",
									text: "2 reseñas nuevas",
									sub: "4.8 ★ promedio"
								}
							].map((item) => /* @__PURE__ */ jsxs("div", {
								className: "flex items-start gap-3 p-3 bg-bg rounded border border-border hover:bg-border/50 cursor-pointer transition-colors",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-sm shrink-0",
										children: item.icon
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-sm font-semibold text-ink",
											children: item.text
										}), /* @__PURE__ */ jsx("p", {
											className: "text-xs text-ink-muted",
											children: item.sub
										})]
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-ink-muted",
										children: "›"
									})
								]
							}, item.text))
						})]
					})]
				})]
			})
		]
	});
});
function BellIcon() {
	return /* @__PURE__ */ jsxs("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		children: [/* @__PURE__ */ jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })]
	});
}
//#endregion
//#region app/routes/professional/agenda.tsx
var agenda_exports = /* @__PURE__ */ __exportAll({ default: () => agenda_default });
var agenda_default = UNSAFE_withComponentProps(function Agenda() {
	const hours = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
	const days = [
		"LUN 19",
		"MAR 20",
		"MIÉ 21",
		"JUE 22",
		"VIE 23",
		"SÁB 24",
		"DOM 25"
	];
	const events = [
		{
			day: 1,
			start: 1,
			duration: 1,
			label: "Lucía Pérez",
			sub: "Sesión individual",
			color: "bg-accent/50"
		},
		{
			day: 1,
			start: 2.5,
			duration: 1,
			label: "Carlos Ruiz",
			sub: "Primera consulta",
			color: "bg-primary-soft"
		},
		{
			day: 1,
			start: 4,
			duration: 1.2,
			label: "Marta López",
			sub: "Sesión de pareja",
			color: "bg-accent/30 border-2 border-accent"
		},
		{
			day: 2,
			start: 1,
			duration: 1,
			label: "Joaquín Vega",
			sub: "Sesión individual",
			color: "bg-primary-soft"
		},
		{
			day: 3,
			start: 3,
			duration: .5,
			label: "Sol Méndez",
			sub: "Seguimiento breve",
			color: "bg-accent/50"
		},
		{
			day: 4,
			start: 5,
			duration: 1,
			label: "Lucía Pérez",
			sub: "Sesión individual · paquete",
			color: "bg-accent/30"
		}
	];
	const CELL = 48;
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-6xl mx-auto",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between mb-6",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink",
				children: "Agenda"
			}), /* @__PURE__ */ jsx("div", {
				className: "flex gap-2",
				children: [
					"Día",
					"Semana",
					"Mes"
				].map((v) => /* @__PURE__ */ jsx("button", {
					className: `text-sm px-3 py-1.5 rounded font-semibold transition-colors ${v === "Semana" ? "bg-ink text-white" : "border border-border text-ink-muted hover:bg-bg"}`,
					children: v
				}, v))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "bg-surface border border-border rounded overflow-auto",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid border-b border-border",
				style: { gridTemplateColumns: "4rem repeat(7, 1fr)" },
				children: [/* @__PURE__ */ jsx("div", { className: "p-3 border-r border-border" }), days.map((d) => /* @__PURE__ */ jsx("div", {
					className: "p-3 border-r border-border last:border-r-0 text-center",
					children: /* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold text-ink-muted uppercase tracking-wide",
						children: d
					})
				}, d))]
			}), /* @__PURE__ */ jsxs("div", {
				className: "relative grid",
				style: { gridTemplateColumns: "4rem repeat(7, 1fr)" },
				children: [/* @__PURE__ */ jsx("div", {
					className: "border-r border-border",
					children: hours.map((h) => /* @__PURE__ */ jsx("div", {
						className: "border-b border-border/30 flex items-center px-2",
						style: { height: CELL },
						children: /* @__PURE__ */ jsx("span", {
							className: "text-xs text-ink-muted",
							children: h
						})
					}, h))
				}), days.map((_, di) => /* @__PURE__ */ jsxs("div", {
					className: "relative border-r border-border last:border-r-0",
					children: [hours.map((_, hi) => /* @__PURE__ */ jsx("div", {
						className: "border-b border-border/20",
						style: { height: CELL }
					}, hi)), events.filter((e) => e.day === di).map((e, ei) => /* @__PURE__ */ jsxs("div", {
						className: `absolute left-1 right-1 ${e.color} rounded px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity`,
						style: {
							top: e.start * CELL,
							height: e.duration * CELL - 2
						},
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink truncate",
							children: e.label
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted truncate",
							children: e.sub
						})]
					}, ei))]
				}, di))]
			})]
		})]
	});
});
//#endregion
//#region app/routes/professional/clients.tsx
var clients_exports = /* @__PURE__ */ __exportAll({ default: () => clients_default });
var clients = [
	{
		initials: "LP",
		name: "Lucía Pérez",
		email: "lucia@gmail.com",
		sessions: 14,
		nextSession: "Hoy 16:30",
		status: "Activa",
		color: "bg-violet-500"
	},
	{
		initials: "CR",
		name: "Carlos Ruiz",
		email: "carlos@gmail.com",
		sessions: 3,
		nextSession: "Mañana 10:30",
		status: "Activa",
		color: "bg-purple-400"
	},
	{
		initials: "ML",
		name: "Marta López",
		email: "marta@gmail.com",
		sessions: 8,
		nextSession: "Hoy 12:00",
		status: "En sesión",
		color: "bg-orange-400"
	},
	{
		initials: "JV",
		name: "Joaquín Vega",
		email: "jv@gmail.com",
		sessions: 5,
		nextSession: "Hoy 14:00",
		status: "Activa",
		color: "bg-teal-500"
	},
	{
		initials: "SM",
		name: "Sol Méndez",
		email: "sol@gmail.com",
		sessions: 2,
		nextSession: "Hoy 15:00",
		status: "Activa",
		color: "bg-amber-500"
	}
];
var clients_default = UNSAFE_withComponentProps(function Clients() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-4xl mx-auto",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between mb-6",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink",
				children: "Clientes"
			}), /* @__PURE__ */ jsxs("p", {
				className: "text-ink-muted mt-1",
				children: [clients.length, " clientes activos"]
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ jsx("input", {
					className: "border border-border rounded px-4 py-2 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink w-56",
					placeholder: "Buscar cliente..."
				}), /* @__PURE__ */ jsx("button", {
					className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors",
					children: "+ Agregar cliente"
				})]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "bg-surface border border-border rounded overflow-hidden",
			children: [/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
				children: [
					"CLIENTE",
					"EMAIL",
					"SESIONES",
					"PRÓXIMA SESIÓN",
					"ESTADO",
					""
				].map((h, i) => /* @__PURE__ */ jsx("div", {
					className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-3" : i === 1 ? "col-span-3" : i === 2 ? "col-span-1" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"}`,
					children: h
				}, i))
			}), clients.map((c) => /* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "col-span-3 flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: `w-9 h-9 rounded-lg ${c.color} flex items-center justify-center text-white text-xs font-bold shrink-0`,
							children: c.initials
						}), /* @__PURE__ */ jsx("span", {
							className: "text-sm font-semibold text-ink",
							children: c.name
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-3",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-sm text-ink-muted",
							children: c.email
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-1",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-sm font-semibold text-ink",
							children: c.sessions
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-2",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-sm text-ink",
							children: c.nextSession
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-2",
						children: /* @__PURE__ */ jsx("span", {
							className: `badge ${c.status === "En sesión" ? "badge-en-vivo" : "badge-confirmada"}`,
							children: c.status.toUpperCase()
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-1 flex items-center gap-2",
						children: /* @__PURE__ */ jsx("button", {
							className: "text-ink-muted hover:text-ink p-1",
							children: "›"
						})
					})
				]
			}, c.name))]
		})]
	});
});
//#endregion
//#region app/routes/professional/services.tsx
var services_exports = /* @__PURE__ */ __exportAll({ default: () => services_default });
var services = [
	{
		id: 1,
		active: true,
		name: "Sesión individual",
		sub: "Atención individual estándar",
		duration: "50 min",
		modalities: ["PRESENCIAL", "VIRTUAL"],
		price: 48,
		count: 142
	},
	{
		id: 2,
		active: true,
		name: "Primera consulta",
		sub: "Evaluación inicial · diagnóstica",
		duration: "60 min",
		modalities: ["PRESENCIAL", "VIRTUAL"],
		price: 55,
		count: 28
	},
	{
		id: 3,
		active: true,
		name: "Sesión de pareja",
		sub: "Para dos participantes",
		duration: "75 min",
		modalities: ["PRESENCIAL"],
		price: 78,
		count: 34
	},
	{
		id: 4,
		active: true,
		name: "Seguimiento breve",
		sub: "Check-in entre sesiones",
		duration: "25 min",
		modalities: ["VIRTUAL"],
		price: 28,
		count: 67
	},
	{
		id: 5,
		active: false,
		name: "Sesión familiar",
		sub: "Hasta 4 participantes",
		duration: "90 min",
		modalities: ["PRESENCIAL"],
		price: 110,
		count: 12
	}
];
var packages = [
	{
		sessions: 4,
		discount: 5,
		price: 180,
		perSession: 45,
		sold: 28
	},
	{
		sessions: 8,
		discount: 12,
		price: 320,
		perSession: 40,
		sold: 41,
		popular: true
	},
	{
		sessions: 12,
		discount: 20,
		price: 460,
		perSession: 38,
		sold: 14
	}
];
var Toggle$1 = ({ checked }) => /* @__PURE__ */ jsx("div", {
	className: `relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-ink" : "bg-border"}`,
	children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}` })
});
var services_default = UNSAFE_withComponentProps(function Services() {
	const [activeTab, setActiveTab] = useState("Servicios individuales");
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Servicios y paquetes"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "6 servicios activos · 3 paquetes"
				})] }), /* @__PURE__ */ jsx("button", {
					className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors",
					children: "+ Nuevo servicio"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex gap-0 border-b border-border mb-6",
				children: [
					"Servicios individuales",
					"Paquetes",
					"Precios y promociones"
				].map((tab) => /* @__PURE__ */ jsx("button", {
					onClick: () => setActiveTab(tab),
					className: `px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`,
					children: tab
				}, tab))
			}),
			activeTab === "Servicios individuales" && /* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded overflow-hidden",
				children: [/* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
					children: [
						"",
						"SERVICIO",
						"DURACIÓN",
						"MODALIDAD",
						"PRECIO",
						"RESERVAS",
						""
					].map((h, i) => /* @__PURE__ */ jsx("div", {
						className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 5 ? "col-span-2" : i === 6 ? "col-span-1" : "col-span-2"}`,
						children: h
					}, i))
				}), services.map((s) => /* @__PURE__ */ jsxs("div", {
					className: `grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center ${!s.active ? "opacity-50" : ""}`,
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "col-span-1",
							children: /* @__PURE__ */ jsx(Toggle$1, { checked: s.active })
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-3",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-sm font-semibold text-ink",
								children: s.name
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted",
								children: s.sub
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink",
								children: s.duration
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2 flex flex-wrap gap-1",
							children: s.modalities.map((m) => /* @__PURE__ */ jsx("span", {
								className: `text-xs font-bold px-2 py-0.5 rounded ${m === "VIRTUAL" ? "bg-accent text-ink" : "bg-primary-soft text-ink-muted"}`,
								children: m
							}, m))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsxs("span", {
								className: "font-display text-xl text-ink font-bold",
								children: ["€", s.price]
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsxs("span", {
								className: "text-sm text-ink-muted",
								children: [s.count, " este año"]
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-1 flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("button", {
								className: "text-ink-muted hover:text-ink p-1",
								children: "✏️"
							}), /* @__PURE__ */ jsx("button", {
								className: "text-ink-muted hover:text-ink p-1",
								children: "⋯"
							})]
						})
					]
				}, s.id))]
			}),
			activeTab === "Paquetes" && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
				className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-4",
				children: "PAQUETES OFRECIDOS"
			}), /* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-3 gap-5",
				children: packages.map((p) => /* @__PURE__ */ jsxs("div", {
					className: `rounded border p-5 ${p.popular ? "border-ink bg-surface shadow-md" : "border-border bg-surface"}`,
					children: [
						p.popular && /* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold bg-ink text-white px-2 py-0.5 rounded mb-3 inline-block",
							children: "MÁS POPULAR"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex items-center gap-2 mb-1",
							children: /* @__PURE__ */ jsxs("span", {
								className: "text-xs font-bold bg-accent text-ink px-2 py-0.5 rounded",
								children: [
									"−",
									p.discount,
									"%"
								]
							})
						}),
						/* @__PURE__ */ jsxs("h3", {
							className: "font-display text-3xl text-ink mb-1",
							children: [p.sessions, " sesiones"]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "text-xs text-ink-muted mb-3",
							children: [
								"Sesión individual · ",
								p.sessions * 50,
								" min en total"
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "font-display text-4xl text-ink font-bold mb-1",
							children: ["€", p.price]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between text-xs text-ink-muted mt-2",
							children: [/* @__PURE__ */ jsxs("span", { children: [
								"€",
								p.perSession,
								" por sesión"
							] }), /* @__PURE__ */ jsxs("span", { children: [p.sold, " vendidos"] })]
						})
					]
				}, p.sessions))
			})] }),
			activeTab === "Precios y promociones" && /* @__PURE__ */ jsx("div", {
				className: "bg-surface border border-border rounded p-8 text-center",
				children: /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted",
					children: "Configura descuentos y promociones especiales aquí."
				})
			})
		]
	});
});
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
var HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
var initialSlots = {
	LUN: {
		active: true,
		blocks: [{
			start: 9,
			end: 13,
			label: "Mañana"
		}, {
			start: 15,
			end: 19,
			label: "Tarde"
		}]
	},
	MAR: {
		active: true,
		blocks: [{
			start: 9,
			end: 13,
			label: "Mañana"
		}, {
			start: 15,
			end: 19,
			label: "Tarde"
		}]
	},
	MIÉ: {
		active: true,
		blocks: [{
			start: 9,
			end: 13,
			label: "Mañana"
		}, {
			start: 14,
			end: 18,
			label: "Tarde"
		}]
	},
	JUE: {
		active: true,
		blocks: [{
			start: 10,
			end: 14,
			label: "Mañana"
		}, {
			start: 16,
			end: 20,
			label: "Tarde"
		}]
	},
	VIE: {
		active: true,
		blocks: [{
			start: 9,
			end: 13,
			label: "Mañana"
		}]
	},
	SÁB: {
		active: false,
		blocks: []
	},
	DOM: {
		active: false,
		blocks: []
	}
};
var Toggle = ({ checked, onChange }) => /* @__PURE__ */ jsx("button", {
	onClick: onChange,
	className: `relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-ink" : "bg-border"}`,
	children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}` })
});
var availability_default = UNSAFE_withComponentProps(function Availability() {
	const [slots, setSlots] = useState(initialSlots);
	const [activeTab, setActiveTab] = useState("Horario semanal");
	const toggleDay = (day) => {
		setSlots((prev) => ({
			...prev,
			[day]: {
				...prev[day],
				active: !prev[day].active
			}
		}));
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsx("nav", {
				className: "text-xs text-ink-muted mb-2 uppercase tracking-widest font-semibold",
				children: "Configuración"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Disponibilidad"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Definí cuándo aceptás reservas y tus reglas de agenda."
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ jsx("button", {
						className: "flex items-center gap-2 border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink",
						children: "📋 Copiar semana"
					}), /* @__PURE__ */ jsx("button", {
						className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors",
						children: "Guardar cambios"
					})]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex gap-0 border-b border-border mb-6",
				children: [
					"Horario semanal",
					"Excepciones",
					"Reglas avanzadas"
				].map((tab) => /* @__PURE__ */ jsx("button", {
					onClick: () => setActiveTab(tab),
					className: `px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`,
					children: tab
				}, tab))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "col-span-2 bg-surface border border-border rounded overflow-hidden",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-8 border-b border-border",
							children: [/* @__PURE__ */ jsx("div", { className: "p-3 border-r border-border" }), DAYS.map((day) => /* @__PURE__ */ jsxs("div", {
								className: "p-3 border-r border-border last:border-r-0",
								children: [
									/* @__PURE__ */ jsx("p", {
										className: "text-xs font-bold text-ink-muted uppercase tracking-wide mb-1",
										children: day
									}),
									/* @__PURE__ */ jsx(Toggle, {
										checked: slots[day].active,
										onChange: () => toggleDay(day)
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted mt-1",
										children: slots[day].active ? "Activo" : "Off"
									})
								]
							}, day))]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-8",
							children: [/* @__PURE__ */ jsx("div", {
								className: "border-r border-border",
								children: HOURS.map((h) => /* @__PURE__ */ jsx("div", {
									className: "h-10 border-b border-border/50 flex items-center px-2",
									children: /* @__PURE__ */ jsx("span", {
										className: "text-xs text-ink-muted",
										children: h
									})
								}, h))
							}), DAYS.map((day) => /* @__PURE__ */ jsxs("div", {
								className: "relative border-r border-border last:border-r-0",
								children: [HOURS.map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-10 border-b border-border/30" }, i)), slots[day].active && slots[day].blocks.map((block, bi) => {
									return /* @__PURE__ */ jsxs("div", {
										className: "absolute left-1 right-1 bg-accent/40 border border-accent rounded flex flex-col items-center justify-center cursor-pointer hover:bg-accent/60 transition-colors",
										style: {
											top: (block.start - 8) * 40,
											height: (block.end - block.start) * 40
										},
										children: [/* @__PURE__ */ jsxs("span", {
											className: "text-xs font-bold text-ink",
											children: [
												block.start.toString().padStart(2, "0"),
												":00 —",
												" ",
												block.end.toString().padStart(2, "0"),
												":00"
											]
										}), /* @__PURE__ */ jsx("span", {
											className: "text-xs text-ink-muted",
											children: block.label
										})]
									}, bi);
								})]
							}, day))]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "p-3 border-t border-border bg-bg",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-xs font-bold text-ink-muted uppercase tracking-wide",
								children: "EXCEPCIONES · 4"
							})
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "bg-surface border border-border rounded p-5",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-sm font-semibold text-ink mb-4",
								children: "Reglas de la agenda"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "space-y-4",
								children: [
									{
										label: "Duración mínima de aviso",
										sub: "¿Con cuánta anticipación pueden reservar?",
										value: "24 horas"
									},
									{
										label: "Buffer entre sesiones",
										sub: "Margen automático para preparar la siguiente",
										value: "15 min"
									},
									{
										label: "Pausa para almorzar",
										sub: "13:00 a 14:00",
										value: "Activa"
									},
									{
										label: "Reservas anticipadas",
										sub: "Máximo en el futuro",
										value: "60 días"
									},
									{
										label: "Política de cancelación",
										sub: "Tiempo mínimo sin cargo",
										value: "24 horas"
									}
								].map((rule) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm font-semibold text-ink",
										children: rule.label
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-ink-muted",
										children: rule.sub
									})] }), /* @__PURE__ */ jsx("select", {
										className: "text-xs border border-border rounded px-2 py-1.5 bg-bg text-ink font-semibold shrink-0",
										children: /* @__PURE__ */ jsx("option", { children: rule.value })
									})]
								}, rule.label))
							}),
							/* @__PURE__ */ jsx("div", {
								className: "border-t border-border mt-4 pt-4 space-y-3",
								children: [
									{
										label: "Aceptación automática",
										checked: true
									},
									{
										label: "Permitir reservas en feriados",
										checked: false
									},
									{
										label: "Mostrar slots en hora completa",
										checked: true
									}
								].map((opt) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-sm text-ink",
										children: opt.label
									}), /* @__PURE__ */ jsx(Toggle, {
										checked: opt.checked,
										onChange: () => {}
									})]
								}, opt.label))
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "bg-accent border border-accent/50 rounded p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-bold text-ink mb-1",
							children: "El sistema evita conflictos"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink",
							children: "Si dos servicios se superponen, solo uno se ofrece como disponible."
						})]
					})]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/professional/payments.tsx
var payments_exports$1 = /* @__PURE__ */ __exportAll({ default: () => payments_default$1 });
var transactions$1 = [
	{
		date: "22 may",
		client: "Lucía Pérez",
		service: "Sesión individual · paquete",
		amount: 40,
		status: "liquidado"
	},
	{
		date: "21 may",
		client: "Carlos Ruiz",
		service: "Primera consulta",
		amount: 55,
		status: "pendiente"
	},
	{
		date: "20 may",
		client: "Marta López",
		service: "Sesión de pareja",
		amount: 78,
		status: "liquidado"
	},
	{
		date: "19 may",
		client: "Joaquín Vega",
		service: "Sesión individual",
		amount: 48,
		status: "liquidado"
	},
	{
		date: "18 may",
		client: "Sol Méndez",
		service: "Seguimiento breve",
		amount: 28,
		status: "pendiente"
	}
];
var badgeCls$2 = {
	liquidado: "badge badge-confirmada",
	pendiente: "badge badge-pendiente"
};
var payments_default$1 = UNSAFE_withComponentProps(function Payments() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-5xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Cobros"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Historial de pagos y liquidaciones"
				})] }), /* @__PURE__ */ jsx("button", {
					className: "border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink",
					children: "Exportar"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-3 gap-4 mb-8",
				children: [
					{
						label: "INGRESOS DEL MES",
						value: "€2.840",
						sub: "38 sesiones"
					},
					{
						label: "PENDIENTE LIQUIDACIÓN",
						value: "€890",
						sub: "Se acreditan el viernes"
					},
					{
						label: "PRÓXIMA LIQUIDACIÓN",
						value: "24 may",
						sub: "€420 estimados"
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
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded overflow-hidden",
				children: [/* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
					children: [
						"FECHA",
						"CLIENTE",
						"SERVICIO",
						"MONTO",
						"ESTADO"
					].map((h, i) => /* @__PURE__ */ jsx("div", {
						className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-1" : i === 1 ? "col-span-3" : i === 2 ? "col-span-4" : i === 3 ? "col-span-2" : "col-span-2"}`,
						children: h
					}, i))
				}), transactions$1.map((t, i) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "col-span-1",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink-muted",
								children: t.date
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-3",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-ink",
								children: t.client
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-4",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-sm text-ink-muted",
								children: t.service
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsxs("span", {
								className: "font-display text-lg font-bold text-ink",
								children: ["€", t.amount]
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ jsx("span", {
								className: badgeCls$2[t.status],
								children: t.status.toUpperCase()
							})
						})
					]
				}, i))]
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
		children: [/* @__PURE__ */ jsxs("aside", {
			className: "w-56 min-h-screen bg-sidebar flex flex-col",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "p-5 border-b border-white/10",
					children: /* @__PURE__ */ jsxs("div", {
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
					})
				}),
				/* @__PURE__ */ jsx("nav", {
					className: "flex-1 p-3 space-y-0.5",
					children: navItems.map(({ to, label, icon, end }) => /* @__PURE__ */ jsxs(NavLink, {
						to,
						end,
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
		}), /* @__PURE__ */ jsx("main", {
			className: "flex-1 overflow-auto",
			children: /* @__PURE__ */ jsx(Outlet, {})
		})]
	});
});
//#endregion
//#region app/routes/admin/dashboard.tsx
var dashboard_exports = /* @__PURE__ */ __exportAll({ default: () => dashboard_default });
var kpis = [
	{
		label: "USUARIOS TOTALES",
		value: "14.328",
		delta: "+3.2%",
		sub: "↑ 442 esta semana"
	},
	{
		label: "PROFESIONALES ACTIVOS",
		value: "2.187",
		delta: "+18",
		sub: "91% verificados"
	},
	{
		label: "RESERVAS (MES)",
		value: "38.412",
		delta: "+11%",
		sub: "€1.84M en GMV"
	},
	{
		label: "TASA DE CANCELACIÓN",
		value: "4.2%",
		delta: "-0.6%",
		sub: "bajo el target de 5%"
	},
	{
		label: "REPORTES ABIERTOS",
		value: "3",
		delta: "−2",
		sub: "2 alta prioridad"
	}
];
var recentActivity = [
	{
		time: "09:42",
		text: "Pedro Yáñez creó cuenta de profesional",
		status: "PENDIENTE VERIFICACIÓN",
		cls: "badge badge-pendiente"
	},
	{
		time: "09:38",
		text: "Carolina A. reportó a Roberto M. por no presentarse",
		status: "ALTA PRIORIDAD",
		cls: "badge badge-cancelada"
	},
	{
		time: "09:21",
		text: "Sistema liquidó €38.420 a 142 profesionales",
		status: "PROCESADO",
		cls: "badge badge-confirmada"
	},
	{
		time: "09:14",
		text: "Tomás Riveiro editó su perfil y agregó 2 servicios",
		status: "OK",
		cls: "text-xs text-ink-muted font-semibold"
	}
];
var pending = [
	{
		initials: "PY",
		name: "Pedro Yáñez",
		sub: "Consultoría legal · Hoy 09:42",
		dot: false,
		color: "bg-orange-500"
	},
	{
		initials: "SM",
		name: "Sofía Mendiluce",
		sub: "Coaching · Ayer",
		dot: true,
		color: "bg-purple-500"
	},
	{
		initials: "LC",
		name: "Luis Carmona",
		sub: "Fisioterapia · Hace 2 días",
		dot: false,
		color: "bg-teal-500"
	}
];
var categories = [
	{
		name: "Salud y bienestar",
		count: 842
	},
	{
		name: "Consultoría",
		count: 487
	},
	{
		name: "Entrenamiento",
		count: 364
	},
	{
		name: "Educación",
		count: 268
	},
	{
		name: "Otros",
		count: 226
	}
];
var maxCat = 842;
var barData = Array.from({ length: 30 }, (_, i) => ({
	confirmed: Math.floor(80 + Math.random() * 120),
	paid: Math.floor(70 + Math.random() * 110),
	cancelled: Math.floor(5 + Math.random() * 15)
}));
var dashboard_default = UNSAFE_withComponentProps(function AdminDashboard() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-7xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Panel administrativo"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Última actualización: hace 2 min · 1.247 usuarios activos hoy"
				})] }), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 border border-border rounded bg-surface px-4 py-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-ink-muted text-sm",
								children: "🔍"
							}), /* @__PURE__ */ jsx("input", {
								className: "bg-transparent text-sm text-ink placeholder-ink-muted outline-none w-52",
								placeholder: "Buscar usuarios, reservas..."
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "relative p-2 border border-border rounded bg-surface hover:bg-bg",
							children: ["🔔", /* @__PURE__ */ jsx("span", {
								className: "absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-ink text-xs flex items-center justify-center font-bold",
								children: "3"
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							className: "border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink",
							children: "Exportar"
						}),
						/* @__PURE__ */ jsx("button", {
							className: "bg-ink text-white px-4 py-2 rounded hover:bg-primary text-sm font-semibold transition-colors",
							children: "Reporte mensual"
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-5 gap-4 mb-8",
				children: kpis.map((k) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-4",
					children: [
						/* @__PURE__ */ jsx("p", {
							className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
							children: k.label
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-display text-2xl text-ink font-bold",
								children: k.value
							}), /* @__PURE__ */ jsx("span", {
								className: `text-xs font-bold px-1.5 py-0.5 rounded ${k.delta.startsWith("-") ? "bg-red-100 text-red-700" : "bg-accent text-ink"}`,
								children: k.delta
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-xs text-ink-muted mt-1",
							children: k.sub
						})
					]
				}, k.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-3 gap-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "col-span-2 bg-surface border border-border rounded p-6",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
								className: "font-display text-xl text-ink",
								children: "Volumen de reservas"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-ink-muted",
								children: "Últimos 30 días · todas las modalidades"
							})] }), /* @__PURE__ */ jsx("div", {
								className: "flex gap-1",
								children: [
									"7d",
									"30d",
									"90d",
									"YTD"
								].map((v) => /* @__PURE__ */ jsx("button", {
									className: `text-xs px-3 py-1.5 rounded font-semibold transition-colors ${v === "30d" ? "bg-ink text-white" : "border border-border text-ink-muted hover:bg-bg"}`,
									children: v
								}, v))
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "h-48 flex items-end gap-0.5",
							children: barData.map((d, i) => {
								const total = d.confirmed + d.paid + d.cancelled;
								return /* @__PURE__ */ jsxs("div", {
									className: "flex-1 flex flex-col justify-end gap-0.5",
									style: { height: `${total / 250 * 100}%` },
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "bg-red-400",
											style: {
												height: `${d.cancelled / total * 100}%`,
												minHeight: 2
											}
										}),
										/* @__PURE__ */ jsx("div", {
											className: "bg-accent",
											style: { height: `${d.paid / total * 100}%` }
										}),
										/* @__PURE__ */ jsx("div", {
											className: "bg-ink",
											style: { height: `${d.confirmed / total * 100}%` }
										})
									]
								}, i);
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-6 mt-3 text-xs",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-ink rounded-sm" }), "Confirmadas 34.812"]
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-accent rounded-sm" }), "Pagadas 32.144"]
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ jsx("span", { className: "w-3 h-3 bg-red-400 rounded-sm" }), "Canceladas 1.612"]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-6 border-t border-border pt-4",
							children: [/* @__PURE__ */ jsx("p", {
								className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-3",
								children: "ACTIVIDAD RECIENTE DEL SISTEMA"
							}), /* @__PURE__ */ jsx("div", {
								className: "space-y-2",
								children: recentActivity.map((a, i) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-4 text-sm",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "text-ink-muted w-12 shrink-0",
											children: a.time
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-ink flex-1",
											children: a.text
										}),
										/* @__PURE__ */ jsx("span", {
											className: a.cls,
											children: a.status
										})
									]
								}, i))
							})]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded p-5",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between mb-4",
									children: [/* @__PURE__ */ jsx("h3", {
										className: "font-display text-lg text-ink",
										children: "Verificaciones pendientes"
									}), /* @__PURE__ */ jsx("span", {
										className: "w-7 h-7 rounded-full bg-accent flex items-center justify-center text-ink text-sm font-bold",
										children: "7"
									})]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "space-y-3",
									children: pending.map((p) => /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-3 hover:bg-bg rounded p-2 -mx-2 cursor-pointer transition-colors",
										children: [
											/* @__PURE__ */ jsx("div", {
												className: `w-9 h-9 rounded-lg ${p.color} flex items-center justify-center text-white text-xs font-bold shrink-0`,
												children: p.initials
											}),
											/* @__PURE__ */ jsxs("div", {
												className: "flex-1 min-w-0",
												children: [/* @__PURE__ */ jsxs("div", {
													className: "flex items-center gap-1.5",
													children: [/* @__PURE__ */ jsx("p", {
														className: "text-sm font-semibold text-ink",
														children: p.name
													}), p.dot && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-red-500" })]
												}), /* @__PURE__ */ jsx("p", {
													className: "text-xs text-ink-muted",
													children: p.sub
												})]
											}),
											/* @__PURE__ */ jsx("span", {
												className: "text-ink-muted",
												children: "›"
											})
										]
									}, p.name))
								}),
								/* @__PURE__ */ jsx("button", {
									className: "w-full text-sm text-ink-muted font-semibold text-center mt-3 hover:text-ink transition-colors",
									children: "Ver todos →"
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded p-5",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "font-display text-lg text-ink mb-4",
								children: "Top categorías"
							}), /* @__PURE__ */ jsx("div", {
								className: "space-y-3",
								children: categories.map((c) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center justify-between mb-1",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-sm text-ink",
										children: c.name
									}), /* @__PURE__ */ jsx("span", {
										className: "text-sm font-semibold text-ink",
										children: c.count
									})]
								}), /* @__PURE__ */ jsx("div", {
									className: "h-1.5 bg-border rounded-full",
									children: /* @__PURE__ */ jsx("div", {
										className: "h-full bg-ink rounded-full",
										style: { width: `${c.count / maxCat * 100}%` }
									})
								})] }, c.name))
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-surface border border-border rounded p-4 flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-ink",
								children: "Estado del sistema"
							}), /* @__PURE__ */ jsx("span", {
								className: "badge badge-confirmada",
								children: "OPERATIVO"
							})]
						})
					]
				})]
			})
		]
	});
});
//#endregion
//#region app/routes/admin/users.tsx
var users_exports = /* @__PURE__ */ __exportAll({ default: () => users_default });
var users = [
	{
		initials: "LP",
		name: "Lucía Pérez",
		email: "lucia@gmail.com",
		role: "Cliente",
		sessions: 14,
		joined: "15 mar 2026",
		status: "activo",
		color: "bg-violet-500"
	},
	{
		initials: "MO",
		name: "María Ortiz",
		email: "maria.ortiz@cita.pro",
		role: "Profesional",
		sessions: 234,
		joined: "10 ene 2025",
		status: "verificado",
		color: "bg-orange-400"
	},
	{
		initials: "PY",
		name: "Pedro Yáñez",
		email: "pedro@gmail.com",
		role: "Profesional",
		sessions: 0,
		joined: "hoy",
		status: "pendiente",
		color: "bg-teal-500"
	},
	{
		initials: "CR",
		name: "Carlos Ruiz",
		email: "carlos@gmail.com",
		role: "Cliente",
		sessions: 3,
		joined: "20 abr 2026",
		status: "activo",
		color: "bg-purple-400"
	}
];
var badgeCls$1 = {
	activo: "badge badge-confirmada",
	verificado: "badge badge-pagada",
	pendiente: "badge badge-pendiente"
};
var users_default = UNSAFE_withComponentProps(function AdminUsers() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-5xl mx-auto",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between mb-6",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "font-display text-3xl text-ink",
				children: "Usuarios"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-ink-muted mt-1",
				children: "14.328 usuarios totales"
			})] }), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ jsx("input", {
					className: "border border-border rounded px-4 py-2 text-sm bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink w-56",
					placeholder: "Buscar usuario..."
				}), /* @__PURE__ */ jsxs("select", {
					className: "border border-border rounded px-4 py-2 text-sm bg-surface text-ink focus:outline-none",
					children: [
						/* @__PURE__ */ jsx("option", { children: "Todos los roles" }),
						/* @__PURE__ */ jsx("option", { children: "Cliente" }),
						/* @__PURE__ */ jsx("option", { children: "Profesional" })
					]
				})]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "bg-surface border border-border rounded overflow-hidden",
			children: [/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
				children: [
					"USUARIO",
					"EMAIL",
					"ROL",
					"SESIONES",
					"DESDE",
					"ESTADO",
					""
				].map((h, i) => /* @__PURE__ */ jsx("div", {
					className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-3" : i === 1 ? "col-span-3" : i === 2 ? "col-span-1" : i === 3 ? "col-span-1" : i === 4 ? "col-span-2" : i === 5 ? "col-span-1" : "col-span-1"}`,
					children: h
				}, i))
			}), users.map((u) => /* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "col-span-3 flex items-center gap-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: `w-9 h-9 rounded-lg ${u.color} flex items-center justify-center text-white text-xs font-bold shrink-0`,
							children: u.initials
						}), /* @__PURE__ */ jsx("span", {
							className: "text-sm font-semibold text-ink",
							children: u.name
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-3",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-sm text-ink-muted",
							children: u.email
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-1",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-xs font-bold text-ink-muted uppercase",
							children: u.role
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-1",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-sm text-ink",
							children: u.sessions
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-2",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-sm text-ink-muted",
							children: u.joined
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-1",
						children: /* @__PURE__ */ jsx("span", {
							className: badgeCls$1[u.status],
							children: u.status.toUpperCase()
						})
					}),
					/* @__PURE__ */ jsx("div", {
						className: "col-span-1",
						children: /* @__PURE__ */ jsx("button", {
							className: "text-ink-muted hover:text-ink p-1",
							children: "⋯"
						})
					})
				]
			}, u.name))]
		})]
	});
});
//#endregion
//#region app/routes/admin/payments.tsx
var payments_exports = /* @__PURE__ */ __exportAll({ default: () => payments_default });
var transactions = [
	{
		date: "22 may",
		from: "Lucía Pérez",
		to: "María Ortiz",
		service: "Sesión individual",
		amount: 48,
		fee: 4.8,
		net: 43.2,
		status: "liquidado"
	},
	{
		date: "21 may",
		from: "Carlos Ruiz",
		to: "Andrés Calleja",
		service: "Entrenamiento",
		amount: 35,
		fee: 3.5,
		net: 31.5,
		status: "pendiente"
	},
	{
		date: "20 may",
		from: "Lucía Pérez",
		to: "Liana Souza",
		service: "Paquete 8 sesiones",
		amount: 320,
		fee: 32,
		net: 288,
		status: "liquidado"
	}
];
var badgeCls = {
	liquidado: "badge badge-confirmada",
	pendiente: "badge badge-pendiente"
};
var payments_default = UNSAFE_withComponentProps(function AdminPayments() {
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 max-w-6xl mx-auto",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl text-ink",
					children: "Pagos"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-ink-muted mt-1",
					children: "Todas las transacciones de la plataforma"
				})] }), /* @__PURE__ */ jsx("button", {
					className: "border border-border px-4 py-2 rounded bg-surface hover:bg-bg text-sm font-semibold text-ink",
					children: "Exportar CSV"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-4 gap-4 mb-8",
				children: [
					{
						label: "GMV DEL MES",
						value: "€1.84M"
					},
					{
						label: "COMISIONES",
						value: "€184K"
					},
					{
						label: "LIQUIDACIONES PENDIENTES",
						value: "€890"
					},
					{
						label: "DISPUTAS ABIERTAS",
						value: "3"
					}
				].map((c) => /* @__PURE__ */ jsxs("div", {
					className: "bg-surface border border-border rounded p-5",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-xs font-bold text-ink-muted uppercase tracking-widest mb-2",
						children: c.label
					}), /* @__PURE__ */ jsx("p", {
						className: "font-display text-2xl text-ink font-bold",
						children: c.value
					})]
				}, c.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "bg-surface border border-border rounded overflow-hidden",
				children: [/* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-12 px-5 py-3 border-b border-border bg-bg",
					children: [
						"FECHA",
						"DE",
						"PARA",
						"SERVICIO",
						"TOTAL",
						"COMISIÓN",
						"NETO",
						"ESTADO"
					].map((h, i) => /* @__PURE__ */ jsx("div", {
						className: `text-xs font-bold text-ink-muted uppercase tracking-widest ${i === 0 ? "col-span-1" : i === 1 ? "col-span-2" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-1"}`,
						children: h
					}, i))
				}), transactions.map((t, i) => /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-12 px-5 py-4 border-b border-border last:border-b-0 items-center hover:bg-bg transition-colors text-sm",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "col-span-1 text-ink-muted",
							children: t.date
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2 text-ink font-semibold",
							children: t.from
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2 text-ink font-semibold",
							children: t.to
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-2 text-ink-muted",
							children: t.service
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-1 font-bold text-ink",
							children: ["€", t.amount]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-1 text-ink-muted",
							children: ["€", t.fee]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "col-span-1 font-bold text-ink",
							children: ["€", t.net]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "col-span-1",
							children: /* @__PURE__ */ jsx("span", {
								className: badgeCls[t.status],
								children: t.status.toUpperCase()
							})
						})
					]
				}, i))]
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
		"module": "/assets/entry.client-CVBu3iKv.js",
		"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/root-Co6kOsXw.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
			"css": ["/assets/root-B48QDjfQ.css"],
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
			"module": "/assets/home-CnaJhKhg.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
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
			"module": "/assets/login-BULUCpQ4.js",
			"imports": [
				"/assets/jsx-runtime-CZvXndDS.js",
				"/assets/AuthContext-WkRhrdR5.js",
				"/assets/api-Co7r1ZK9.js"
			],
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
			"module": "/assets/register-z6zigE5K.js",
			"imports": [
				"/assets/jsx-runtime-CZvXndDS.js",
				"/assets/AuthContext-WkRhrdR5.js",
				"/assets/api-Co7r1ZK9.js"
			],
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
			"module": "/assets/_layout-AXNj-OtX.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
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
			"module": "/assets/dashboard-CNOBq_lE.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
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
			"module": "/assets/discover-BDG6D-kE.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/professional._id-B8UiEtGR.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/booking._id.pay-DvFjRynM.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/packages-B4ePkGfK.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/messages-CQi_S5L9.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/payments-CQ70DpQf.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
			"css": [],
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
			"module": "/assets/notifications-JPhDx_Tr.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/_layout-BCbIy96u.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/dashboard": {
			"id": "routes/professional/dashboard",
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
			"module": "/assets/dashboard-DZqZO4eK.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/agenda": {
			"id": "routes/professional/agenda",
			"parentId": "routes/professional/_layout",
			"path": "agenda",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/agenda-DIrYn4Dv.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"routes/professional/clients": {
			"id": "routes/professional/clients",
			"parentId": "routes/professional/_layout",
			"path": "clients",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/clients-dONcFyK1.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/services-CrcXEMkj.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/availability-kvlTbhIq.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/payments-DP5LvQlu.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/messages-BsvQ25Bm.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/_layout-OT9M5IPM.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js", "/assets/AuthContext-WkRhrdR5.js"],
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
			"module": "/assets/dashboard-COJgpEyD.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/users-BANbTAq-.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/payments-Sgeqy3jH.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/session._id-3iQmH2Yl.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
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
			"module": "/assets/session._id.rating-CJDfOPMM.js",
			"imports": ["/assets/jsx-runtime-CZvXndDS.js"],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-b01a2026.js",
	"version": "b01a2026",
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
		module: notifications_exports
	},
	"routes/professional/_layout": {
		id: "routes/professional/_layout",
		parentId: "root",
		path: "professional",
		index: void 0,
		caseSensitive: void 0,
		module: _layout_exports$1
	},
	"routes/professional/dashboard": {
		id: "routes/professional/dashboard",
		parentId: "routes/professional/_layout",
		path: void 0,
		index: true,
		caseSensitive: void 0,
		module: dashboard_exports$1
	},
	"routes/professional/agenda": {
		id: "routes/professional/agenda",
		parentId: "routes/professional/_layout",
		path: "agenda",
		index: void 0,
		caseSensitive: void 0,
		module: agenda_exports
	},
	"routes/professional/clients": {
		id: "routes/professional/clients",
		parentId: "routes/professional/_layout",
		path: "clients",
		index: void 0,
		caseSensitive: void 0,
		module: clients_exports
	},
	"routes/professional/services": {
		id: "routes/professional/services",
		parentId: "routes/professional/_layout",
		path: "services",
		index: void 0,
		caseSensitive: void 0,
		module: services_exports
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
