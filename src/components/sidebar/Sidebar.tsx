import { AdjustmentsPanel } from './AdjustmentsPanel';
import { DisplayToggles } from './DisplayToggles';
import { Section } from './Section';
import { StageControls } from './StageControls';
import { ToothChart } from './ToothChart';
import { ToothEditor } from './ToothEditor';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h1>Jaw Editor</h1>
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
      <Section title="Adjustments">
        <AdjustmentsPanel />
      </Section>
    </aside>
  );
}
