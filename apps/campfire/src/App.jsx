import React, { useEffect, useState } from "react";

const App = () => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null); // placeholder
  const [role, setRole] = useState(null); // placeholder
  const defaultPath = "/dashboard/admin"; // placeholder

  useEffect(() => {
    document.body.classList.remove("pre-theme");
    document.documentElement.classList.remove("loading");

    // Simulate a "ready" state after 500ms
    setTimeout(() => {
      setReady(true);
    }, 500);
  }, []);

  if (!ready) {
    return <div style={{ padding: "2rem" }}>⏳ Loading...</div>;
  }

  console.log("✅ Ready is true");
  console.log("👤 user:", user);
  console.log("🔑 role:", role);
  console.log("📍 defaultPath:", defaultPath);
  console.log("📍 pathname:", window.location.pathname);

  return (
    <div style={{ padding: "2rem", color: "limegreen", background: "#111" }}>
      <h1>Campfire Render Check</h1>
      <p>React is mounted and working correctly.</p>
      <p><strong>user:</strong> {JSON.stringify(user)}</p>
      <p><strong>role:</strong> {role}</p>
      <p><strong>defaultPath:</strong> {defaultPath}</p>
      <p><strong>path:</strong> {window.location.pathname}</p>
    </div>
  );
};

export default App;
