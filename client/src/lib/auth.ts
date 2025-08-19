export async function register(email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getSecret(token: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secret`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
