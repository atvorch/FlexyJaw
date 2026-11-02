import { useJawStore } from '../../state/store';

/** Top right, beside Share: opens the plain-language summary of the changes, written for the orthodontist. */
export function SummaryButton() {
  const setReportOpen = useJawStore((s) => s.setReportOpen);
  const changed = useJawStore((s) => Object.keys(s.adjustments).length);

  return (
    <button
      className="share-button"
      title={changed ? 'Summary of the changes for the orthodontist' : 'Nothing adjusted yet'}
      disabled={!changed}
      onClick={() => setReportOpen(true)}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 2.5h6.5l3.5 3.5v11.5h-10z" />
        <path d="M12 2.5V6h3.5M8 10h5M8 13h5" />
      </svg>
      Summary
    </button>
  );
}
