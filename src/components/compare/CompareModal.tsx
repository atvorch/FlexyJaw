import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Centred overlay; portalled to <body> so the drawer's transform doesn't trap it. */
export function CompareModal({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  return createPortal(
    <div className="compare-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="compare-modal-card">
        <header>
          <h3>{title}</h3>
          <button className="close" title="Close (Esc)" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
