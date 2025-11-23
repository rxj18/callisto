import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/theme-context";
import { listenForConfig } from "./events/config";

listenForConfig();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
