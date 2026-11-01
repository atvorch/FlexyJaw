import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useJawStore } from '../../state/store';

const defaultName = () =>
  `Changes ${new Date().toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;

type Mode = 'overwrite' | 'new';

/** Save the working adjustments: overwrite the current version, or save as a new named one. */
export function SaveDialog() {
  const open = useJawStore((s) => s.saveDialogOpen);
  if (!open) return null;
  return <SaveDialogBody />;
}

function SaveDialogBody() {
  const current = useJawStore((s) => s.versions.find((v) => v.id === s.currentVersionId));
  const { setSaveDialogOpen, saveVersion, overwriteCurrentVersion } = useJawStore.getState();
  const [mode, setMode] = useState<Mode>(current ? 'overwrite' : 'new');
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  // the name box is only in play when saving as new
  useEffect(() => {
    if (mode === 'new') nameInput.current?.select();
  }, [mode]);

  const close = () => setSaveDialogOpen(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'new' && !name.trim()) return setError('Give the changes a name.');
    const ok = mode === 'overwrite' ? overwriteCurrentVersion() : saveVersion(name);
    if (!ok) setError('The browser refused to store the changes (private mode or storage full?). Use Export JSON instead.');
  };

  return createPortal(
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <form
        className="dialog"
        onSubmit={submit}
        onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), close())}
        aria-labelledby="save-title"
      >
        <h2 id="save-title">Save changes</h2>

        <label className={`save-option${current ? '' : ' disabled'}`}>
          <input type="radio" name="save-mode" checked={mode === 'overwrite'} disabled={!current} onChange={() => setMode('overwrite')} />
          <span>
            Overwrite {current ? <strong>“{current.name}”</strong> : 'current version'}
            <span className="muted">{current ? 'Replaces the saved version with what you see now.' : 'Nothing saved or loaded yet.'}</span>
          </span>
        </label>

        <label className="save-option">
          <input type="radio" name="save-mode" checked={mode === 'new'} onChange={() => setMode('new')} />
          <span>
            Save as new
            <span className="muted">Keeps every earlier version.</span>
          </span>
        </label>

        <input
          ref={nameInput}
          className="save-name"
          type="text"
          value={name}
          maxLength={80}
          disabled={mode !== 'new'}
          aria-label="Name for the new version"
          placeholder="Name for these changes"
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
        {error && <p className="dialog-error">{error}</p>}

        <div className="btns dialog-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="on">
            {mode === 'overwrite' ? 'Overwrite' : 'Save'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
