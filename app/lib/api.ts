const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Simple in-memory GET cache with 60s TTL
const cache = new Map<string, { data: unknown; expires: number }>();
const TTL = 60_000;

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
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    // Laravel validation: { message, errors: { field: [msg] } }
    if (err?.errors) {
      const first = Object.values(err.errors as Record<string, string[]>)[0];
      throw new Error(Array.isArray(first) ? first[0] : err.message ?? `Error ${res.status}`);
    }
    throw new Error(err?.message ?? err?.error ?? `Error ${res.status}: ${res.statusText || "Request failed"}`);
  }
  const data = await res.json();

  if (method === "GET") setCached(cacheKey, data);
  // Bust cache on mutations — invalidate the base resource path
  if (method !== "GET") {
    const base = "/" + path.split("/").slice(1, 3).join("/");
    invalidateCache(base);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET" }, token),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, token),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE" }, token),
};
