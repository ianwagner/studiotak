if (!ready) {
  return <div style={{ padding: '2rem' }}>⏳ Loading...</div>;
}

console.log("✅ Ready is true");
console.log("👤 user:", user);
console.log("🔑 role:", role);
console.log("📍 defaultPath:", defaultPath);
console.log("📍 pathname:", window.location.pathname);

return (
  <div style={{ padding: '2rem', color: 'limegreen', background: '#111' }}>
    <h1>Campfire Render Check</h1>
    <p>React is mounted and ready.</p>
    <p><strong>user:</strong> {JSON.stringify(user)}</p>
    <p><strong>role:</strong> {role}</p>
    <p><strong>defaultPath:</strong> {defaultPath}</p>
    <p><strong>path:</strong> {window.location.pathname}</p>
  </div>
);