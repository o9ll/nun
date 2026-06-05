/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// ─── Layer 3: UI (render ONLY — no scanning, no scoring) ─────────────────────

import "./styles.css";

import type { RenderModalProps } from "@vencord/discord-types";
import { saveFile } from "@utils/web";
import { Button, Modal, React, TextInput, useState } from "@webpack/common";

import type { ScoredPlugin } from "./scoring";

type SortKey = "name" | "hooks" | "listeners" | "patches" | "uiInjects" | "risk";

function exportJson(rows: ScoredPlugin[], heapMB: number | null) {
    const payload = {
        _nun: "diagnostics",
        version: 1,
        takenAt: new Date().toISOString(),
        heapMB,
        plugins: rows,
    };
    const date = new Date().toISOString().slice(0, 10);
    saveFile(new File([JSON.stringify(payload, null, 2)], `nun-diagnostics-${date}.json`, { type: "application/json" }));
}

export function DiagnosticsModal({ modalProps, initial, heapMB, rescan }: {
    modalProps: RenderModalProps;
    initial: ScoredPlugin[];
    heapMB: number | null;
    rescan: () => ScoredPlugin[];
}) {
    const [rows, setRows] = useState<ScoredPlugin[]>(initial);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("risk");
    const [asc, setAsc] = useState(false);
    const columns: { key: SortKey; label: string; tip: string; num: boolean; }[] = [
        { key: "name", label: "Plugin", tip: "Plugin name", num: false },
        { key: "hooks", label: "Hooks", tip: "Registered slash commands", num: true },
        { key: "listeners", label: "Listeners", tip: "Flux/Dispatcher subscriptions", num: true },
        { key: "patches", label: "Patches", tip: "Webpack code patches", num: true },
        { key: "uiInjects", label: "UI Injects", tip: "Context menus + UI render surfaces", num: true },
        { key: "risk", label: "Load", tip: "(patches×2)+(listeners×3)+(uiInjects×1.5)", num: true },
    ];

    function sortBy(key: SortKey) {
        if (key === sortKey) setAsc(!asc);
        else { setSortKey(key); setAsc(key === "name"); }
    }

    const q = search.trim().toLowerCase();
    const view = rows
        .filter(r => !q || r.name.toLowerCase().includes(q))
        .sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            const cmp = typeof av === "string"
                ? (av as string).localeCompare(bv as string)
                : (av as number) - (bv as number);
            return asc ? cmp : -cmp;
        });

    return (
        <Modal {...modalProps} size="lg" title="Nun Diagnostics">
            <div className="nun-diag">
                <div className="nun-diag-sub">
                    {"One-time plugin resource snapshot"}
                </div>

                <div className="nun-diag-toolbar">
                    <div className="nun-diag-searchwrap">
                        <TextInput
                            placeholder="Search..."
                            value={search}
                            onChange={setSearch}
                        />
                    </div>
                    <div className="nun-diag-actions">
                        {heapMB != null && (
                            <span className="nun-diag-heap" title="Current JS heap">
                                Heap: {heapMB} MB
                            </span>
                        )}
                        <Button size={Button.Sizes.SMALL} onClick={() => setRows(rescan())}>
                            {"Re-scan"}
                        </Button>
                        <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} onClick={() => exportJson(view, heapMB)}>
                            {"Export JSON"}
                        </Button>
                    </div>
                </div>

                <div className="nun-diag-tablewrap">
                    <table className="nun-diag-table">
                        <thead>
                            <tr>
                                {columns.map(c => (
                                    <th
                                        key={c.key}
                                        title={c.tip}
                                        className={c.num ? "num" : ""}
                                        onClick={() => sortBy(c.key)}
                                    >
                                        {c.label}{sortKey === c.key ? (asc ? " ▲" : " ▼") : ""}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {view.length === 0 ? (
                                <tr><td colSpan={6} className="nun-diag-empty">{"No results"}</td></tr>
                            ) : view.map(r => (
                                <tr key={r.name} className={`nun-diag-row lvl-${r.level}`}>
                                    <td>{r.name}</td>
                                    <td className="num">{r.hooks}</td>
                                    <td className="num">{r.listeners}</td>
                                    <td className="num">{r.patches}</td>
                                    <td className="num">{r.uiInjects}</td>
                                    <td className="num"><span className={`nun-diag-badge ${r.level}`}>{r.risk}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="nun-diag-foot">
                    {view.length} / {rows.length} {"plugins"}
                </div>
            </div>
        </Modal>
    );
}
