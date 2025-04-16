import React from "react";

function App({ children }) {
  return (
    <div>
      <h1>Welcome to Swamp Kings</h1>
      {/* Render children */}
      {children}
    </div>
  );
}

export default App;
