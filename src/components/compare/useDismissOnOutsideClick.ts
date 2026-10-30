import { useEffect } from 'react';

const CLICK_SLOP_PX = 4;

/**
 * Calls `onDismiss` for a click (not a drag) whose target is outside every element matching `insideSelector`.
 * Listens in the capture phase so orbit controls can't swallow the events first.
 */
export function useDismissOnOutsideClick(active: boolean, insideSelector: string, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return;
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX;
      down = null;
      if (moved || (e.target as Element).closest?.(insideSelector)) return;
      onDismiss();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
    };
  }, [active, insideSelector, onDismiss]);
}
