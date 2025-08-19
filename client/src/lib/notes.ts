export async function fetchNotes(token: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<{
    notes: { id: number; content: string; created_at: string }[];
  }>;
}

export async function createNote(token: string, content: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  return res.json() as Promise<{
    note?: { id: number; content: string; created_at: string };
    error?: string;
  }>;
}
