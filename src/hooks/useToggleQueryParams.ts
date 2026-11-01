import { useEffect } from 'react';
import { writeToggleParams, type ShareSettings } from '../state/shareLink';
import { useJawStore, type JawState } from '../state/store';

const togglesOf = (s: JawState): ShareSettings => ({
  gums: s.visibility.gums,
  upper: s.visibility.upper,
  lower: s.visibility.lower,
  highlightAdjusted: s.highlightAdjusted,
  showOriginal: s.showOriginal,
});

const sameToggles = (a: ShareSettings, b: ShareSettings) =>
  a.gums === b.gums &&
  a.upper === b.upper &&
  a.lower === b.lower &&
  a.highlightAdjusted === b.highlightAdjusted &&
  a.showOriginal === b.showOriginal;

/** Keep the address bar's toggle parameters in step with the display toggles, from load onwards. */
export function useToggleQueryParams() {
  useEffect(() => {
    writeToggleParams(togglesOf(useJawStore.getState()));
    return useJawStore.subscribe((state, prev) => {
      const next = togglesOf(state);
      if (!sameToggles(next, togglesOf(prev))) writeToggleParams(next);
    });
  }, []);
}
