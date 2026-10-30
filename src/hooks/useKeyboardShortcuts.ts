import { useEffect } from 'react';
import { useJawStore } from '../state/store';

/** Typing into these must not trigger shortcuts. */
const isTextInput = (el: EventTarget | null) =>
  el instanceof HTMLInputElement ? !['range', 'checkbox', 'button'].includes(el.type) : el instanceof HTMLTextAreaElement;

/** Ctrl+Z / Ctrl+Y undo-redo · R rotate · G move · F front view · A apply · H highlight · Esc closes the innermost thing. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // text fields keep their own native undo
      if (isTextInput(e.target)) return;
      const s = useJawStore.getState();
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'z' && !e.shiftKey) s.undo();
        else if (key === 'y' || (key === 'z' && e.shiftKey)) s.redo();
        else return;
        e.preventDefault();
        return;
      }
      if (e.altKey) return;
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
