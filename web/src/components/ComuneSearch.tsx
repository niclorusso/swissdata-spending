"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useL } from "@/lib/useLang";

export type SearchItem = { id: string; name: string; kt: string; alt?: string[]; hint?: string; href?: string };
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const keys = (i: SearchItem) => [i.name, ...(i.alt ?? [])].map(norm);

/** Type a municipality, get its page. Arrow keys move, Enter opens. */
export function ComuneSearch({ items, placeholder }: { items: SearchItem[]; placeholder?: string }) {
  const router = useRouter();
  const { T, h, link } = useL();
  const pathOf = (i: SearchItem) => i.href ?? `/comuni/${i.id}/`;
  const hrefOf = (i: SearchItem) => h(pathOf(i));
  const ph = placeholder ?? T("Cerca il tuo Comune…", "Find your municipality…");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const hits = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    const starts = items.filter((i) => keys(i).some((k) => k.startsWith(n)));
    const rest = items.filter((i) => !keys(i).some((k) => k.startsWith(n)) && keys(i).some((k) => k.includes(n)));
    return [...starts, ...rest].slice(0, 8);
  }, [q, items]);
  return (
    <div className="relative max-w-md">
      <input type="search" value={q} placeholder={ph} aria-label={ph} role="combobox" aria-expanded={hits.length > 0} aria-controls="comune-hits" autoComplete="off"
        className="field w-full px-4 py-3 text-base"
        onChange={(e) => { setQ(e.target.value); setSel(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          if (e.key === "Enter" && hits[sel]) router.push(link(pathOf(hits[sel])));
          if (e.key === "Escape") setQ("");
        }} />
      {q.trim().length >= 2 && (
        <ul id="comune-hits" role="listbox" className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg text-sm overflow-hidden">
          {hits.map((h, i) => (
            <li key={h.id} role="option" aria-selected={i === sel}>
              <a href={hrefOf(h)} className={`flex justify-between gap-3 px-3 py-2 ${i === sel ? "bg-surface-2" : "hover:bg-surface-2"}`} onMouseEnter={() => setSel(i)}>
                <span>{h.name}{h.alt?.length ? <span className="text-muted"> · {h.alt[0]}</span> : null}{h.hint ? <span className="text-muted"> → {h.hint}</span> : null}</span><span className="text-faint">{h.kt.toUpperCase()}</span>
              </a>
            </li>
          ))}
          {hits.length === 0 && <li className="px-3 py-2 text-muted">{T("Nessun Comune trovato con questo nome. Hanno una scheda i Comuni sopra i 5 000 abitanti e tutti quelli di Ticino e Zurigo.", "No municipality found with this name. There is a page for municipalities above 5,000 inhabitants and for all those in Ticino and Zurich.")}</li>}
        </ul>
      )}
    </div>
  );
}
