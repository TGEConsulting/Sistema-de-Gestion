import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import "@/index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function Root() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );

  // Sin Client ID configurado, se omite el provider en vez de romper la app:
  // el botón de Google simplemente no se muestra (ver Login.tsx).
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId} locale="es-419">
      {app}
    </GoogleOAuthProvider>
  ) : (
    app
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
