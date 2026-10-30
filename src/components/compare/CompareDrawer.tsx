import { useEffect, useMemo, useRef, useState } from 'react';
import { toothName } from '../../data/fdi';
import { isEdited } from '../../domain/adjustments';
import { summarizeChange } from '../../domain/analysis';
import { useJawStore } from '../../state/store';
import { ChangeTable } from './ChangeTable';
import { CompareModal } from './CompareModal';
import { CompareViewer } from './CompareViewer';
import { PRESETS, createOrbit, resetOrbit, type ComparePreset } from './compareView';
import { useDismissOnOutsideClick } from './useDismissOnOutsideClick';

/** Clicks inside these keep the drawer open. */
const INSIDE = '.compare-drawer, .changes-bar, .compare-modal';

/** Side drawer comparing one changed tooth with the original plan. */
export function CompareDrawer() {
  const model = useJawStore((s) => s.model);
  const fdi = useJawStore((s) => s.compared);
  const adjustment = useJawStore((s) => (s.compared != null ? s.adjustments[s.compared] : undefined));
  const expanded = useJawStore((s) => s.compareExpanded);
  const { closeCompare, setCompareExpanded, editTooth, resetTooth } = useJawStore.getState();

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
  const open = !!model && !!tooth && isEdited(adjustment);
  const summary = useMemo(() => (open ? summarizeChange(model!, tooth!, adjustment!) : null), [open, model, tooth, adjustment]);

  useDismissOnOutsideClick(open && !expanded, INSIDE, closeCompare);

  const viewer = open && (
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
      <aside className={`compare-drawer${open ? ' open' : ''}`}>
        {open && (
          <>
            <header>
              <div>
                <h3>Tooth {fdi}</h3>
                <div className="sub">{toothName(fdi!)}</div>
              </div>
              <button className="close" title="Close" onClick={closeCompare}>
                ×
              </button>
            </header>
            {!expanded && viewer}
            {summary && <ChangeTable summary={summary} />}
            <div className="btns" style={{ marginTop: 12 }}>
              <button onClick={() => editTooth(fdi!)}>Edit this tooth</button>
              <button onClick={() => resetTooth(fdi!)}>Reset this tooth</button>
            </div>
            <p className="muted">
              Measured at the final stage, against the original plan. Directions are worked out from the curve of your arch, so
              tiny values are approximate.
            </p>
          </>
        )}
      </aside>
      {open && expanded && (
        <CompareModal title={`Tooth ${fdi} · ${toothName(fdi!)}`} onClose={() => setCompareExpanded(false)}>
          {viewer}
        </CompareModal>
      )}
    </>
  );
}
