import { useRef } from 'react';
import { downloadAdjustments, readAdjustmentsFile } from '../../state/persistence';
import { useJawStore } from '../../state/store';

export function AdjustmentsPanel() {
  const fileInput = useRef<HTMLInputElement>(null);
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
      <button onClick={() => fileInput.current?.click()}>Import JSON</button>
      <button onClick={() => confirm('Reset every tooth adjustment?') && s.resetAll()}>Reset all</button>
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
