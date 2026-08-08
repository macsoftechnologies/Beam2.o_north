import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { SSOHandler } from "./components/common/SSOHandler";

function App() {
  return (
    <SSOHandler>
      <AppRoutes />
    </SSOHandler>
  );
}

export default App;