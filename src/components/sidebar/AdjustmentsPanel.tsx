import { useRef, useState } from 'react';
import { downloadAdjustments, readAdjustmentsFile } from '../../state/persistence';
import { useJawStore } from '../../state/store';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function AdjustmentsPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const changedCount = useJawStore((st) => Object.keys(st.adjustments).length);
  // shared links can be looked at, not changed
  const readOnly = useJawStore((st) => st.viewOnly);
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
    <div className="btns">
      <button className="on wide" onClick={() => s.setReportOpen(true)}>
        Summary for orthodontist
      </button>
      <button onClick={() => downloadAdjustments(useJawStore.getState().adjustments)}>Export JSON</button>
      {!readOnly && (
        <>
          <button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <button disabled={!changedCount} onClick={() => setConfirmReset(true)}>
            Reset all
          </button>
        </>
      )}
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
