/** 에디터 하단 로그 패널 — 비동기 작업 상태 표시 (접힘/펼침) */
"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKSPACE_CONTROL, WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
}

interface BottomLoggerProps {
  logs?: LogEntry[];
}

const LEVEL_COLORS: Record<string, string> = {
  info: WORKSPACE_TEXT.body,
  warn: "text-[color:var(--takdi-gold)]",
  error: "text-[var(--takdi-accent-strong)]",
};

export function BottomLogger({ logs = [] }: BottomLoggerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 mx-4 mb-4 overflow-hidden rounded-[24px] transition-all ${WORKSPACE_SURFACE.panelStrong} ${
        expanded ? "h-48" : "h-10"
      }`}
    >
      <div className="flex h-10 items-center justify-between border-b border-[rgb(214_199_184_/_0.36)] px-4">
        <div className="flex items-center gap-2">
          <Terminal className={`h-3.5 w-3.5 ${WORKSPACE_TEXT.muted}`} />
          <span className={`text-xs font-medium ${WORKSPACE_TEXT.body}`}>작업 기록</span>
          {logs.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${WORKSPACE_SURFACE.softInset} ${WORKSPACE_TEXT.muted}`}>
              {logs.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${WORKSPACE_CONTROL.ghostButton}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto px-4 pb-3 pt-2 font-mono text-xs">
          {logs.length === 0 ? (
            <p className={`py-6 text-center ${WORKSPACE_TEXT.muted}`}>
              아직 작업 기록이 없어요. 생성을 실행하면 여기에 표시돼요.
            </p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex gap-3 rounded-2xl px-2 py-1 hover:bg-white/55">
                <span className={`shrink-0 ${WORKSPACE_TEXT.muted}`}>
                  {entry.timestamp}
                </span>
                <span className={LEVEL_COLORS[entry.level] ?? WORKSPACE_TEXT.body}>
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
