import { useEffect, useState, type RefObject } from 'react';
import { toothName } from '../../data/fdi';
import { useJawStore } from '../../state/store';

/** Name of the hovered tooth, following the pointer. */
export function ToothTooltip({ container }: { container: RefObject<HTMLElement> }) {
  const hovered = useJawStore((s) => s.hovered);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      if (e.buttons) return setPos(null);
      const r = el.getBoundingClientRect();
      setPos({ x: e.clientX - r.left + 14, y: e.clientY - r.top + 10 });
    };
    const onLeave = () => {
      setPos(null);
      useJawStore.getState().hover(null);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [container]);

  if (hovered == null || !pos) return null;
  return (
    <div className="tooth-tooltip" style={{ left: pos.x, top: pos.y }}>
      {hovered} · {toothName(hovered)}
    </div>
  );
}
