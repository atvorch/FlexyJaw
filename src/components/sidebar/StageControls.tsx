import { lastStage, useJawStore } from '../../state/store';

/** Play / pause and a stage scrubber; releasing the scrubber snaps to a whole stage. */
export function StageControls() {
  const stage = useJawStore((s) => s.stage);
  const playing = useJawStore((s) => s.playing);
  const last = useJawStore(lastStage);
  const { setStage, stopPlay, togglePlay } = useJawStore.getState();

  return (
    <div className="row">
      <button title="Play / pause" onClick={togglePlay}>
        {playing ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        min={0}
        max={last}
        step={0.01}
        value={stage}
        onChange={(e) => {
          stopPlay();
          setStage(+e.target.value);
        }}
        onPointerUp={() => setStage(Math.round(useJawStore.getState().stage))}
        onKeyUp={() => setStage(Math.round(useJawStore.getState().stage))}
      />
      <span className="stage-label">
        {Math.round(stage)} / {last}
      </span>
    </div>
  );
}
