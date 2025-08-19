import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { login, register, getSecret } from "./lib/auth";
import Notes from "./components/Notes";

function App() {
  const { token, setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister() {
    setMessage("Registering...");
    const res = await register(email, password);
    setMessage(JSON.stringify(res, null, 2));
  }

  async function handleLogin() {
    setMessage("Logging in...");
    const res = await login(email, password);
    if (res?.token) {
      setToken(res.token);
      //persist for safety
      localStorage.setItem("auth_token", res.token);
      setMessage("Logged in!");
    } else {
      setMessage(JSON.stringify(res, null, 2));
    }
  }

  async function handleSecret() {
    console.log("handleSecret -> token =", token);
    if (!token) return setMessage("Not logged in");
    setMessage("Calling secret...");
    const res = await getSecret(token);
    setMessage(JSON.stringify(res, null, 2));
  }

  function handleLogout() {
    setToken(null);
    localStorage.removeItem("auth_token");
    setMessage("Logged out");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Secure Notes</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={handleRegister}>
          Register
        </button>
        <button type="button" onClick={handleLogin}>
          Login
        </button>
        <button type="button" onClick={handleSecret} disabled={!token}>
          Call Secret API
        </button>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {token ? (
        <>
          <p>
            <strong>Token:</strong> {token.substring(0, 24)}...
          </p>
          <Notes />
        </>
      ) : (
        <p>
          <strong>Token:</strong> (none)
        </p>
      )}

      <pre style={{ marginTop: 10, background: "#f5f5f5", padding: 10 }}>
        {message || "-"}
      </pre>
    </div>
  );
}

export default App;
