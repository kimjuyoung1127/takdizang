/** 텍스트 인라인 편집 — 클릭→input 전환→Enter/blur 저장 */
"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  placeholder = "입력해주세요",
  maxLength = 50,
  className,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const save = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      // 호출부에서 토스트 처리
    } finally {
      setSaving(false);
    }
  }, [draft, value, onSave, cancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel],
  );

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={saving}
          className={cn(
            "rounded-xl border border-[rgb(214_199_184_/_0.84)] bg-[rgb(255_255_255_/_0.84)] px-3 py-1.5 text-sm outline-none transition-colors focus:border-[var(--takdi-accent)] focus:ring-2 focus:ring-[rgb(244_222_213_/_0.9)]",
            saving && "opacity-50",
            className,
          )}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={save}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--takdi-accent)] hover:bg-[rgb(248_231_226_/_0.6)]"
          title="저장"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          disabled={saving}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--takdi-text-subtle)] hover:bg-[rgb(248_241_232_/_0.72)]"
          title="취소"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        "group inline-flex items-center gap-2 text-left transition-colors hover:text-[var(--takdi-accent)]",
        className,
      )}
      title="클릭해서 수정"
    >
      <span>{value || placeholder}</span>
      <Pencil className="h-3.5 w-3.5 text-[var(--takdi-text-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
