import { AdjustmentsPanel } from './AdjustmentsPanel';
import { DisplayToggles } from './DisplayToggles';
import { SaveBar } from './SaveBar';
import { Section } from './Section';
import { StageControls } from './StageControls';
import { ToothChart } from './ToothChart';
import { ToothEditor } from './ToothEditor';
import { useJawStore } from '../../state/store';

export function Sidebar() {
  const viewOnly = useJawStore((s) => s.viewOnly);
  return (
    <aside className="sidebar">
      <h1>
        Jaw Editor{viewOnly && <span className="muted"> · view only</span>}
      </h1>
      <Section title="Treatment stage">
        <StageControls />
      </Section>
      <Section title="Show">
        <DisplayToggles />
      </Section>
      <Section title="Teeth">
        <ToothChart />
      </Section>
      <Section title="Selected tooth">
        <ToothEditor />
      </Section>
      {/* pinned to the bottom of the sidebar while the sections above scroll */}
      <div className="sidebar-footer">
        <Section title="Adjustments">
          <AdjustmentsPanel />
        </Section>
        {!viewOnly && <SaveBar />}
      </div>
    </aside>
  );
}
