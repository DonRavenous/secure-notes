import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState(null);
  const [greet, setGreet] = useState(null);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;
    fetch(`${API}/api/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(console.error);

    fetch(`${API}/api/greet?name=Dev`)
      .then((r) => r.json())
      .then(setGreet)
      .catch(console.error);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 720 }}>
      <h1>Secure Notes - Skeleton</h1>
      <p>React + Vite frontend talking to Node/Express backend.</p>

      <section style={{ marginTop: 24 }}>
        <h2>API Health</h2>
        <pre>{health ? JSON.stringify(health, null, 2) : "Loading..."}</pre>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Greeting</h2>
        <pre>{greet ? JSON.stringify(greet, null, 2) : "Loading..."}</pre>
      </section>
    </div>
  );
}

export default App;
