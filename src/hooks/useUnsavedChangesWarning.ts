import { useEffect } from 'react';
import { selectUnsaved, useJawStore } from '../state/store';

/**
 * While there are unsaved changes, leaving the page (back button, another address, reload, closing the
 * tab) makes the browser ask first. Browsers show their own fixed wording; a custom message isn't allowed.
 */
export function useUnsavedChangesWarning() {
  const unsaved = useJawStore(selectUnsaved);
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
