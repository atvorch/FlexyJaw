import { changedTeeth } from '../../state/history';
import { useJawStore } from '../../state/store';
import { ConfirmDialog } from '../common/ConfirmDialog';

const when = (t: number) =>
  new Date(t).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** On opening the app: offer back the unsaved changes left when the page last closed. */
export function RestoreDraftDialog() {
  const draft = useJawStore((s) => s.pendingDraft);
  const model = useJawStore((s) => s.model);
  const base = useJawStore((s) => s.versions.find((v) => v.id === draft?.baseVersionId));
  const { restoreDraft, discardDraft } = useJawStore.getState();
  if (!draft || !model) return null;

  // count what differs from the version they were made on, not every adjusted tooth
  const changed = changedTeeth(base?.adjustments ?? {}, draft.adjustments);
  const teeth = changed.length;
  return (
    <ConfirmDialog
      title="Restore unsaved changes?"
      confirmLabel="Restore"
      cancelLabel="Discard"
      // discarding throws work away, so only the button does it
      dismissible={false}
      onConfirm={restoreDraft}
      onCancel={discardDraft}
    >
      <p>
        The page was closed with changes that weren't saved{draft.at ? ` (${when(draft.at)})` : ''}: {teeth}{' '}
        {teeth === 1 ? 'tooth' : 'teeth'} changed ({changed.join(', ')})
        {base ? (
          <>
            {' '}
            on <strong>{base.name}</strong>
          </>
        ) : (
          ''
        )}
        .
      </p>
      <p>Restore brings them back as unsaved changes; you can then save them. Discard throws them away.</p>
    </ConfirmDialog>
  );
}
