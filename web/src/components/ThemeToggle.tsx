"use client";
import { useL } from "@/lib/useLang";

/** Light / dark switch. The choice is kept in the browser; without a choice the system setting applies. */
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
  return (
    <button type="button" onClick={flip} aria-label={T("Cambia tema chiaro o scuro", "Switch between light and dark theme")} title={T("Tema chiaro / scuro", "Light / dark theme")} data-theme-toggle
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:text-foreground hover:border-foreground transition-colors">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </svg>
    </button>
  );
}
