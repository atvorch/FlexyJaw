import { useJawStore } from '../../state/store';

export function FrontViewButton() {
  const requestFrontView = useJawStore((s) => s.requestFrontView);
  return (
    <button className="front-view" title="Reset camera to the front of the jaw (F)" onClick={requestFrontView}>
      ⟲ Front view
    </button>
  );
}
