import { useEffect } from 'react';
import { selectAnyUnsaved, useJawStore } from '../state/store';

/**
 * While there are unsaved changes (in the open version or left in another), leaving the page (back button,
 * another address, reload, closing the tab) makes the browser ask first. Browsers show their own fixed wording; a custom message isn't allowed.
 */
export function useUnsavedChangesWarning() {
  const unsaved = useJawStore(selectAnyUnsaved);
  useEffect(() => {
    if (!unsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // still required by Chrome / Edge to show the prompt
    };
    addEventListener('beforeunload', onBeforeUnload);
    return () => removeEventListener('beforeunload', onBeforeUnload);
  }, [unsaved]);
}
