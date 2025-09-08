const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function register(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getSecret(token: string) {
  const res = await fetch(`${API_BASE}/secret`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
