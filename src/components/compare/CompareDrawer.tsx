import { useEffect, useMemo, useRef, useState } from 'react';
import { toothName } from '../../data/fdi';
import { isEdited } from '../../domain/adjustments';
import { summarizeChange } from '../../domain/analysis';
import { useJawStore } from '../../state/store';
import { ChangeTable } from './ChangeTable';
import { CompareModal } from './CompareModal';
import { CompareViewer } from './CompareViewer';
import { PRESETS, createOrbit, resetOrbit, type ComparePreset } from './compareView';
import { ToothEditor } from './ToothEditor';

/**
 * Side panel for the selected tooth, however it was picked (on the jaw, in the Teeth chart or from its card):
 * the editing controls, and once the tooth has been adjusted, its before / after comparison and the change in
 * plain words.
 */
export function CompareDrawer() {
  const model = useJawStore((s) => s.model);
  const fdi = useJawStore((s) => s.selected ?? s.compared);
  const adjustment = useJawStore((s) => {
    const f = s.selected ?? s.compared;
    return f != null ? s.adjustments[f] : undefined;
  });
  const expanded = useJawStore((s) => s.compareExpanded);
  const { closeCompare, setCompareExpanded } = useJawStore.getState();

  const [preset, setPreset] = useState<ComparePreset>('front');
  // false once the user rotates away; no preset button is lit until one is chosen again
  const [onPreset, setOnPreset] = useState(true);
  const [split, setSplit] = useState(0.5);
  const orbit = useRef(createOrbit()).current;
  useEffect(() => {
    resetOrbit(orbit);
    setOnPreset(true);
  }, [fdi, orbit]);

  const choosePreset = (p: ComparePreset) => {
    resetOrbit(orbit); // even re-clicking the same preset snaps the camera back
    setPreset(p);
    setOnPreset(true);
  };

  const tooth = model?.teeth.find((t) => t.fdi === fdi);
  const open = !!model && !!tooth;
  const adjusted = open && isEdited(adjustment);
  const summary = useMemo(
    () => (adjusted ? summarizeChange(model!, tooth!, adjustment!) : null),
    [adjusted, model, tooth, adjustment],
  );

  const viewer = adjusted && (
    <div className="compare-viewer">
      <CompareViewer
        model={model!}
        tooth={tooth!}
        preset={preset}
        split={split}
        onSplit={setSplit}
        orbit={orbit}
        onOrbitStart={() => setOnPreset(false)}
        onResetView={() => setOnPreset(true)}
        expanded={expanded}
        onToggleExpand={() => setCompareExpanded(!expanded)}
      />
      <div className="compare-help">Drag the line to compare · drag elsewhere to rotate · scroll to zoom · double-click to reset</div>
      <div className="btns centered">
        {PRESETS.map((p) => (
          <button key={p.id} className={onPreset && preset === p.id ? 'on' : undefined} onClick={() => choosePreset(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className={`compare-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        {/* fixed-width content, so the text doesn't reflow while the column animates its width */}
        <div className="compare-drawer-inner">
          {open && (
            <>
              <header>
                <div>
                  <h3>Tooth {fdi}</h3>
                  <div className="sub">{toothName(fdi!)}</div>
                </div>
                <button className="close" title="Close and deselect (Esc)" onClick={closeCompare}>
                  ×
                </button>
              </header>
              <ToothEditor />
              {adjusted ? (
                <>
                  <h4 className="drawer-section">Compared with the original plan</h4>
                  {!expanded && viewer}
                  {summary && <ChangeTable summary={summary} />}
                  <p className="muted">
                    Measured at the final stage, against the original plan. Directions are worked out from the curve of your
                    arch, so tiny values are approximate.
                  </p>
                </>
              ) : (
                <p className="muted">Not adjusted yet: rotate or move it with the handles on the jaw or the sliders above.</p>
              )}
            </>
          )}
        </div>
      </aside>
      {adjusted && expanded && (
        <CompareModal title={`Tooth ${fdi} · ${toothName(fdi!)}`} onClose={() => setCompareExpanded(false)}>
          {viewer}
        </CompareModal>
      )}
    </>
  );
}
