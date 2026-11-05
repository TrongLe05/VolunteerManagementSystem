import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "@/context/AuthContext.tsx";
import { Toaster } from "@/components/ui/toaster.tsx";
import { UiProvider } from "./lib/ui-config.tsx";
import { ConfirmProvider } from "@/components/ui/alert-dialog.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UiProvider>
          <ConfirmProvider>
            <App />
            <Toaster />
          </ConfirmProvider>
        </UiProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
