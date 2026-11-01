import { useEffect, useRef, useState } from 'react';
import type { SavedVersion } from '../../state/persistence';
import { selectHasParkedEdits, selectUnsaved, useJawStore, versionAfterDeleting } from '../../state/store';
import { ConfirmDialog } from '../common/ConfirmDialog';

const when = (t: number) =>
  new Date(t).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const teethCount = (v: SavedVersion) => {
  const n = Object.keys(v.adjustments).length;
  return `${n} ${n === 1 ? 'tooth' : 'teeth'} changed`;
};


/** Text box that replaces a version's name while renaming. Enter / blur keeps the new name, Esc cancels. */
function RenameField({ version, onDone }: { version: SavedVersion; onDone(): void }) {
  const [draft, setDraft] = useState(version.name);
  const input = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  useEffect(() => input.current?.select(), []);

  const finish = (keep: boolean) => {
    if (finished.current) return; // Enter followed by the blur it causes
    finished.current = true;
    if (keep && draft.trim() && draft.trim() !== version.name) useJawStore.getState().renameVersion(version.id, draft);
    onDone();
  };

  return (
    <input
      ref={input}
      className="version-rename"
      value={draft}
      maxLength={80}
      aria-label={`New name for “${version.name}”`}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()} // typing in the box must not switch versions
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
      onBlur={() => finish(true)}
    />
  );
}

/** In the delete dialog for the open version: say which version opens instead, or that nothing will be saved. */
function DeleteCurrentNote({ versions, id, unsaved }: { versions: SavedVersion[]; id: string; unsaved: boolean }) {
  const next = versionAfterDeleting(versions, id);
  if (!next) {
    return <p>It's your only saved version. The adjustments on screen stay, but they won't be saved anywhere until you save again.</p>;
  }
  return (
    <p>
      You'll switch to <strong>{next.name}</strong>.
      {unsaved && ' The unsaved changes in this version go with it.'}
    </p>
  );
}

/**
 * Every saved version by save date, oldest first. Click a card to switch to it; rename or delete from its footer.
 * Switching never asks: unsaved edits stay with their version and are there again when it is reopened.
 */
export function VersionList() {
  const versions = useJawStore((s) => s.versions);
  const currentId = useJawStore((s) => s.currentVersionId);
  const unsaved = useJawStore(selectUnsaved);
  // versions switched away from with unsaved edits still in them, as one string so unrelated updates don't re-render
  const parkedIds = useJawStore((s) => s.versions.filter((v) => selectHasParkedEdits(s, v.id)).map((v) => v.id).join(' '));
  const parked = (id: string) => parkedIds.split(' ').includes(id);
  const { loadVersion, deleteVersion } = useJawStore.getState();
  // the version waiting for the user to confirm deleting it
  const [deleting, setDeleting] = useState<SavedVersion | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  return (
    <>
      {!versions.length ? (
        <p className="muted versions-empty">Nothing saved yet. Use Save at the bottom of the right panel.</p>
      ) : (
        <ul className="versions">
          {[...versions].sort((a, b) => a.savedAt - b.savedAt).map((v) => {
            const current = v.id === currentId;
            const renaming = v.id === renamingId;
            // the open version, or one being renamed: nothing to switch to (Undo / history step back edits)
            const idle = current || renaming;
            const edited = current ? unsaved : parked(v.id);
            return (
              <li
                key={v.id}
                className={`version-card${current ? ' current' : ''}${idle ? '' : ' switchable'}`}
                role="button"
                tabIndex={0}
                aria-current={current ? 'true' : undefined}
                aria-disabled={idle || undefined}
                title={renaming ? undefined : idle ? 'This version is open' : `Switch to “${v.name}”`}
                onClick={() => !idle && loadVersion(v.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
                  e.preventDefault();
                  if (!idle) loadVersion(v.id);
                }}
              >
                <div className="version-head">
                  {renaming ? (
                    <RenameField version={v} onDone={() => setRenamingId(null)} />
                  ) : (
                    <span className="version-name">{v.name}</span>
                  )}
                  {!renaming && (current || edited) && (
                    <span
                      className={`version-badge${edited ? ' unsaved' : ''}`}
                      title={edited ? 'Has changes that are not saved yet' : undefined}
                    >
                      {edited ? 'edited' : 'current'}
                    </span>
                  )}
                </div>
                <span className="muted">{when(v.savedAt)}</span>
                <div className="version-foot">
                  <span className="muted">{teethCount(v)}</span>
                  <span className="version-buttons">
                    <button
                      title="Rename this version"
                      // mousedown would blur an open rename box first; keep this click about this card
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(renaming ? null : v.id);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      Rename
                    </button>
                    <button
                      className="danger"
                      title="Delete this version"
                      onClick={(e) => {
                        e.stopPropagation(); // deleting must not also switch to it
                        setDeleting(v);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete saved version?"
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteVersion(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        >
          <p className="confirm-target">
            <strong>{deleting.name}</strong>
            <span className="muted">
              {when(deleting.savedAt)} · {teethCount(deleting)}
            </span>
          </p>
          <p>This removes the saved version for good. It can't be undone.</p>
          {deleting.id === currentId && <DeleteCurrentNote versions={versions} id={deleting.id} unsaved={unsaved} />}
        </ConfirmDialog>
      )}
    </>
  );
}
