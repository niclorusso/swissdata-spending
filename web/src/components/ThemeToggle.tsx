"use client";
import { useL } from "@/lib/useLang";

/** Light / dark switch, a line of text in the footer. The choice is kept in the browser; without a choice the system setting applies. */
export function ThemeToggle() {
  const { T } = useL();
  const flip = () => {
    const app = document.getElementById("app")!;
    const dark = app.dataset.theme ? app.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    app.dataset.theme = next;
    document.documentElement.dataset.theme = next; // page edges and scrollbars follow
    try { localStorage.setItem("theme", next); } catch {}
  };
  return <button type="button" onClick={flip} data-theme-toggle>{T("Tema chiaro / scuro", "Light / dark theme")}</button>;
}
