"use client";
import { useEffect } from "react";

/** Adds the class "in" to every [data-reveal] element the first time it enters the screen, also for elements added later. */
export function Motion() {
  useEffect(() => {
    const app = document.getElementById("app");
    if (app) { app.dataset.motion = "1"; app.dataset.js = "1"; } // tells the start-up script that animations are running
    const theme = app?.dataset.theme;
    if (theme) document.documentElement.dataset.theme = theme; // page edges and scrollbars follow the chosen theme
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    const watch = (root: ParentNode) => root.querySelectorAll?.("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
    watch(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.matches("[data-reveal]:not(.in)")) io.observe(n);
        watch(n);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
