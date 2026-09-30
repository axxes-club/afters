"use client";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
export function OrganizerSwitcher({ compact = false }: { compact?: boolean }) {
  const [workspaces, setWorkspaces] = useState<{ id: string; displayName: string; role: string }[]>([]);
  const [currentId, setCurrentId] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/organizer/workspaces").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setWorkspaces(d.workspaces); setCurrentId(d.currentId); }).catch(() => setError("Could not load workspaces")); }, []);
  const current = workspaces.find(w => w.id === currentId);
  return <details className="relative border-t border-white/5 p-2 font-mono text-xs">
    <summary aria-label="Switch organizer workspace" title={current?.displayName ?? "Workspaces"} className={`flex cursor-pointer list-none items-center gap-2 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white ${compact ? "justify-center" : ""}`}><Building2 className="h-5 w-5 shrink-0" />{!compact && <span className="truncate">{current?.displayName ?? "WORKSPACES"}</span>}</summary>
    <div className="absolute bottom-full right-0 md:right-auto md:left-2 z-50 mb-2 w-64 rounded-lg border border-white/10 bg-zinc-950 p-2 shadow-xl">
      <p className="p-2 text-white/40">ORGANIZER WORKSPACES</p>
      {workspaces.map(w => <button key={w.id} disabled={busy} className="block w-full rounded p-2 text-left text-white/70 hover:bg-white/10 disabled:opacity-50" onClick={async () => { setBusy(true); setError(""); try { const r = await fetch("/api/organizer/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: w.id }) }); if (!r.ok) throw Error(); window.location.assign("/b"); } catch { setError("Could not switch workspace"); setBusy(false); } }}>{w.id === currentId ? "✓ " : ""}{w.displayName}<span className="ml-2 text-white/30">{w.role}</span></button>)}
      {!workspaces.length && !error && <p className="p-2 text-white/40">No organizer workspaces</p>}
      {error && <p role="alert" className="p-2 text-red-400">{error}</p>}
    </div>
  </details>;
}
