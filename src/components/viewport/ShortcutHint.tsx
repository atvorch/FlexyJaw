import { useJawStore } from '../../state/store';

export function ShortcutHint() {
  const viewOnly = useJawStore((s) => s.viewOnly);
  if (viewOnly) {
    return (
      <div className="shortcut-hint">
        Shared view: you can look around, but not change anything
        <br />
        Drag to rotate · scroll to zoom · click a tooth for details · F front view
      </div>
    );
  }
  return (
    <div className="shortcut-hint">
      Click a tooth to select · drag the gizmo rings to rotate
      <br />R rotate / G move · F front view · A apply · H highlight · Esc deselect
    </div>
  );
}
