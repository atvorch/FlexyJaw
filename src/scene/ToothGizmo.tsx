import { TransformControls } from '@react-three/drei';
import { adjustmentFromPivot } from '../domain/adjustments';
import { selectCanEdit, useJawStore } from '../state/store';
import { scene } from './registry';

/** Rotate / move handles on the selected tooth, writing straight back into its adjustment. */
export function ToothGizmo() {
  const selected = useJawStore((s) => s.selected);
  const canEdit = useJawStore(selectCanEdit);
  const mode = useJawStore((s) => s.gizmoMode);
  const model = useJawStore((s) => s.model);

  const tooth = model?.teeth.find((t) => t.fdi === selected);
  const pivot = selected != null ? scene.pivots.get(selected) : undefined;
  if (!canEdit || !tooth || !pivot) return null;

  return (
    <TransformControls
      ref={(c) => void (scene.gizmo = c as unknown as { axis: string | null } | null)}
      object={pivot}
      mode={mode}
      space="local"
      size={0.7}
      onObjectChange={() => useJawStore.getState().setAdjustment(tooth.fdi, adjustmentFromPivot(pivot, tooth))}
    />
  );
}
