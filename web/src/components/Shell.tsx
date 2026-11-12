import type { ReactNode } from "react";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "@/app/globals.css";
import { Footer, Nav } from "@/components/Nav";
import { Motion } from "@/components/Motion";
import { setLang } from "@/lib/lang-server";
import type { Lang } from "@/lib/lang";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

// Runs as soon as #app exists, before the first paint: marks that scripts work (entrance animations are enabled only then)
// and restores the chosen theme. If the page scripts have not started after 2.5 s (a file failed to load), the mark is removed
// and everything shows without animation, so the page can never stay blank. It writes on #app because React resets the attributes of <html> and <body>.
const boot = `(function(){var a=document.getElementById("app");a.dataset.js="1";setTimeout(function(){if(!a.dataset.motion)delete a.dataset.js},2500);try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")a.dataset.theme=t}catch(e){}})()`;

/** The page frame, shared by the Italian and the English side. */
export function Shell({ lang, children }: { lang: Lang; children: ReactNode }) {
  setLang(lang);
  return (
    <html lang={lang} className={`h-full antialiased ${display.variable} ${body.variable}`}>
      <body className="min-h-full flex flex-col">
        <div id="app" className="flex-1 flex flex-col" suppressHydrationWarning>
          <script dangerouslySetInnerHTML={{ __html: boot }} />
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        <Motion />
      </body>
    </html>
  );
}
