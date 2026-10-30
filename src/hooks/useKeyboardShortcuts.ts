import { useEffect } from 'react';
import { useJawStore } from '../state/store';

/** Typing into these must not trigger letter shortcuts. */
const isTextInput = (el: EventTarget | null) =>
  el instanceof HTMLInputElement ? !['range', 'checkbox', 'button'].includes(el.type) : el instanceof HTMLTextAreaElement;

/**
 * Free-text fields keep the browser's own undo. The sidebar's number boxes don't: their values are
 * tooth adjustments, so Ctrl+Z there should step the history like everywhere else.
 */
const keepsNativeUndo = (el: EventTarget | null) =>
  isTextInput(el) && !(el instanceof HTMLInputElement && el.type === 'number');

/**
 * Ctrl+Z undo · Ctrl+Shift+Z / Ctrl+Y redo (Cmd on macOS) · R rotate · G move · F front view · A apply ·
 * H highlight · Esc closes the innermost thing.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useJawStore.getState();
      if (e.ctrlKey || e.metaKey) {
        if (keepsNativeUndo(e.target)) return;
        const key = e.key.toLowerCase();
        if (key === 'z' && !e.shiftKey) s.undo();
        else if (key === 'y' || (key === 'z' && e.shiftKey)) s.redo();
        else return;
        e.preventDefault();
        return;
      }
      if (e.altKey || isTextInput(e.target)) return;
      switch (e.key.toLowerCase()) {
        case 'r':
          return s.setGizmoMode('rotate');
        case 'g':
          return s.setGizmoMode('translate');
        case 'f':
          return s.requestFrontView();
        case 'a':
          return s.setApplyAdjustments(!s.applyAdjustments);
        case 'h':
          return s.setHighlightAdjusted(!s.highlightAdjusted);
        case 'escape':
          if (s.reportOpen) return s.setReportOpen(false);
          if (s.compareExpanded) return s.setCompareExpanded(false);
          if (s.compared != null) return s.closeCompare();
          return s.select(null);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
}
