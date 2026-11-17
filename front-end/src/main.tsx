import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "@/context/AuthContext.tsx";
import { Toaster } from "@/components/ui/toaster.tsx";
import { UiProvider } from "./lib/ui-config.tsx";
import { ConfirmProvider } from "@/components/ui/alert-dialog.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <UiProvider>
            <ConfirmProvider>
              <App />
              <Toaster />
            </ConfirmProvider>
          </UiProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
