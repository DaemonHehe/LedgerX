// Tiny status indicator for the deck editor toolbar. Reads the saveStatus
// produced by useTemplate and shows idle/pending/saving/saved/error with a label.

import { Check, CloudOff, Loader, RefreshCw } from 'lucide-react';
import { SAVE_STATUS } from '../../hooks/useTemplate.js';

const STATE = {
  [SAVE_STATUS.IDLE]: { label: 'Saved', icon: Check, className: 'save-badge--saved' },
  [SAVE_STATUS.PENDING]: { label: 'Saving…', icon: RefreshCw, className: 'save-badge--pending' },
  [SAVE_STATUS.SAVING]: { label: 'Saving…', icon: Loader, className: 'save-badge--saving' },
  [SAVE_STATUS.SAVED]: { label: 'Saved', icon: Check, className: 'save-badge--saved' },
  [SAVE_STATUS.ERROR]: { label: 'Save failed', icon: CloudOff, className: 'save-badge--error' },
};

export default function SaveBadge({ status }) {
  const state = STATE[status] || STATE[SAVE_STATUS.IDLE];
  const Icon = state.icon;
  const spin = status === SAVE_STATUS.SAVING || status === SAVE_STATUS.PENDING;
  return (
    <span className={`save-badge ${state.className}`} role="status" aria-live="polite">
      <Icon size={13} className={spin ? 'animate-spin' : ''} />
      {state.label}
    </span>
  );
}
