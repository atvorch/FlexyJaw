import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { REPORT_NOTES, buildReport, reportToText } from '../../domain/report';
import { useJawStore } from '../../state/store';

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Every requested change, worded for an orthodontist, with copy / download / print. */
export function ReportModal() {
  const open = useJawStore((s) => s.reportOpen);
  const model = useJawStore((s) => s.model);
  const adjustments = useJawStore((s) => s.adjustments);
  const close = () => useJawStore.getState().setReportOpen(false);
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => (open && model ? buildReport(model, adjustments) : null), [open, model, adjustments]);
  if (!report) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportToText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Copying is blocked here. Use "Download .txt" instead.');
    }
  };

  return createPortal(
    <div className="report-modal" onClick={(e) => e.target === e.currentTarget && close()}>
      <article className="report-card">
        <header className="report-header">
          <div>
            <h2>Summary for orthodontist</h2>
            <p className="muted">
              Requested changes to the final stage ({report.finalStage}) of the treatment plan · prepared{' '}
              {report.createdAt.toLocaleDateString()}
            </p>
          </div>
          <button className="close no-print" title="Close (Esc)" onClick={close}>
            ×
          </button>
        </header>

        {!report.teeth.length ? (
          <p>No changes requested yet. Adjust a tooth at the final stage and it will appear here.</p>
        ) : (
          <>
            <p className="report-overview">
              {report.teeth.length} {report.teeth.length === 1 ? 'tooth' : 'teeth'} changed:{' '}
              {report.teeth.map((t) => `${t.code} (${t.fdi})`).join(', ')}
            </p>
            {report.teeth.map((t) => (
              <section key={t.fdi} className="report-tooth">
                <h3>
                  {t.code} <span className="muted">· FDI {t.fdi} ·</span> <span className="report-name">{t.name}</span>
                </h3>
                {t.lines.length ? (
                  <table>
                    <tbody>
                      {t.lines.map((l) => (
                        <tr key={l.term}>
                          <td>
                            {l.term}
                            <span className="desc">{l.plain}</span>
                          </td>
                          <td className="value">{l.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="muted">Negligible change.</p>
                )}
              </section>
            ))}
          </>
        )}

        <footer className="report-notes">
          {REPORT_NOTES.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </footer>

        <div className="btns no-print">
          <button className="on" onClick={copy}>{copied ? 'Copied ✓' : 'Copy as text'}</button>
          <button onClick={() => downloadText(reportToText(report), 'orthodontist-summary.txt')}>Download .txt</button>
          <button onClick={() => window.print()}>Print / save as PDF</button>
        </div>
      </article>
    </div>,
    document.body,
  );
}
