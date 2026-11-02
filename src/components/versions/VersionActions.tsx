import { useRef, useState } from 'react';
import { downloadAdjustments, readAdjustmentsFile } from '../../state/persistence';
import { useJawStore } from '../../state/store';
import { ConfirmDialog } from '../common/ConfirmDialog';

/** Export / import the open adjustments as JSON, or reset them all. At the bottom of the Versions panel. */
export function VersionActions() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const changedCount = useJawStore((st) => Object.keys(st.adjustments).length);
  const s = useJawStore.getState();

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      s.replaceAdjustments(await readAdjustmentsFile(file));
    } catch (e) {
      alert(`Could not read that file: ${(e as Error).message}`);
    }
  };

  return (
    <div className="version-actions">
      <button title="Download the adjustments as a JSON file" onClick={() => downloadAdjustments(useJawStore.getState().adjustments)}>
        Export
      </button>
      <button title="Load adjustments from a JSON file" onClick={() => fileInput.current?.click()}>
        Import
      </button>
      <button className="danger" title="Remove the changes to every tooth" disabled={!changedCount} onClick={() => setConfirmReset(true)}>
        Reset all
      </button>
      {confirmReset && (
        <ConfirmDialog
          title="Reset all teeth?"
          confirmLabel="Reset all"
          danger
          onConfirm={() => {
            s.resetAll();
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        >
          <p>
            This removes the changes to all {changedCount} adjusted {changedCount === 1 ? 'tooth' : 'teeth'}. Saved versions aren't
            touched, and you can get the changes back with Undo.
          </p>
        </ConfirmDialog>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          void onImport(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
