import { Component, type ReactNode } from 'react';

/** Shown in place of the 3D view after it stopped; everything else on the page keeps working. */
export function SceneStopped({ onRestart }: { onRestart(): void }) {
  return (
    <div className="viewport-loading">
      <div className="scene-stopped">
        <p>The 3D view stopped: the browser reset its graphics.</p>
        <p className="muted">Your changes are safe. Restarting the view picks up where you left off.</p>
        <button className="on" onClick={onRestart}>
          Restart 3D view
        </button>
      </div>
    </div>
  );
}

interface Props {
  onRestart(): void;
  children: ReactNode;
}

/**
 * Keeps a failure inside the 3D view from taking the whole app down with it (and with it the panels, Save and
 * any unsaved changes on screen).
 */
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <SceneStopped
        onRestart={() => {
          this.setState({ failed: false });
          this.props.onRestart();
        }}
      />
    );
  }
}
