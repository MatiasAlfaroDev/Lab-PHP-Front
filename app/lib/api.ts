const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Error de API que conserva el body completo de la respuesta, para que los
// callers puedan inspeccionar flags adicionales (ej. email_not_verified).
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Root URL of the backend (without the /api suffix), for non-API routes
// like OAuth redirects and broadcasting auth.
export const APP_BASE_URL = BASE_URL.replace(/\/api\/?$/, "");

// Simple in-memory GET cache with 60s TTL
const cache = new Map<string, { data: unknown; expires: number }>();
const TTL = 60_000;
// php artisan serve es single-threaded: varios fetches en paralelo se encolan
// y pueden tardar bastante en dev local — el timeout solo está para evitar
// un hang infinito real, no para cortar requests lentas pero válidas.
const REQUEST_TIMEOUT = 30_000;

// Dedup concurrent identical GET requests
const inFlight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.data as T;
}

function setCached(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + TTL });
}

// Invalidate all cached GET entries whose path starts with the given prefix
export function invalidateCache(pathPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) cache.delete(key);
  }
}

async function doRequest<T>(
  path: string,
  options: RequestInit,
  token: string | null | undefined,
  method: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT);

  const callerSignal = options.signal;
  if (callerSignal) {
    if (callerSignal.aborted) timeoutController.abort();
    else callerSignal.addEventListener("abort", () => timeoutController.abort());
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: timeoutController.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      // Laravel validation: { message, errors: { field: [msg] } }
      if (err?.errors) {
        const first = Object.values(err.errors as Record<string, string[]>)[0];
        throw new ApiError(Array.isArray(first) ? first[0] : err.message ?? `Error ${res.status}`, res.status, err);
      }
      throw new ApiError(err?.message ?? err?.error ?? `Error ${res.status}: ${res.statusText || "Request failed"}`, res.status, err);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError" && !callerSignal?.aborted) {
      throw new Error("La solicitud tardó demasiado. Intentá de nuevo.");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const cacheKey = `${path}::${token ?? ""}`;

  if (method === "GET") {
    const hit = getCached<T>(cacheKey);
    if (hit !== null) return hit;

    const pending = inFlight.get(cacheKey);
    if (pending) return pending as Promise<T>;

    const promise = doRequest<T>(path, options, token, method)
      .then((data) => {
        setCached(cacheKey, data);
        return data;
      })
      .finally(() => inFlight.delete(cacheKey));
    inFlight.set(cacheKey, promise);
    return promise;
  }

  const data = await doRequest<T>(path, options, token, method);
  // Bust cache on mutations — invalidate the base resource path
  const base = "/" + path.split("/").slice(1, 3).join("/");
  invalidateCache(base);
  return data;
}

export const api = {
  get: <T>(path: string, token?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", signal }, token),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, token),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE" }, token),
};
