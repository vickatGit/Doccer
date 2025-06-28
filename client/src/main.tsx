import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import "@fontsource/montserrat/400.css"; // regular
import "@fontsource/montserrat/600.css"; // semi-bold
import "@fontsource/montserrat/700.css"; // bold
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Provider } from "react-redux";
import { store } from "./store/index.ts";
const GoogleOAuthClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <GoogleOAuthProvider clientId={GoogleOAuthClientId}>
          <App />
        </GoogleOAuthProvider>
      </ThemeProvider>
    </StrictMode>
  </Provider>
);
