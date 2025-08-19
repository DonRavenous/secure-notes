import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchNotes, createNote } from "../lib/notes";

type Note = { id: number; content: string; created_at: string };

export default function Notes() {
  const { token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setStatus("Loading notes...");
      const data = await fetchNotes(token);
      if (!cancelled) {
        setNotes(data.notes || []);
        setStatus(data.notes?.length ? "" : "No notes yet. Create one!");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAdd() {
    if (!token) return setStatus("Not logged in");
    if (!content.trim()) return setStatus("Write something first");
    setStatus("Saving...");
    const data = await createNote(token, content.trim());
    if (data.error) {
      setStatus(`Error: ${data.error}`);
      return;
    }
    if (data.note) {
      setNotes((prev) => [data.note!, ...prev]);
      setContent("");
      setStatus("Saved!");
      setTimeout(() => setStatus(""), 800);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h2>Your Notes</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Write a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={handleAdd} disabled={!token}>
          Add
        </button>
      </div>

      {status && <p style={{ color: "#555" }}>{status}</p>}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
        {notes.map((n) => (
          <li
            key={n.id}
            style={{
              padding: 10,
              border: " 1px solid #eee",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ whiteSpace: "pre-wrap" }}>{n.content}</div>
            <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
              {new Date(n.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
