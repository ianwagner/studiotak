import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    // ✅ Unhide app by removing theme-related classes
    document.body.classList.remove("pre-theme");
    document.documentElement.classList.remove("loading");
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Hello from Campfire</h1>
      <p>This means React and Vite are both working.</p>
    </div>
  );
};

export default App;
