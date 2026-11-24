import React, { useState } from 'react';
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react';

import { Modal } from './Modal';
import { Button } from '../common/Button';

export interface OneTimePasswordModalProps {
  /** The plaintext temporary password. `null` closes the modal. */
  password: string | null;
  accountName: string;
  accountEmail?: string;
  /** e.g. "Admin account created" or "Password reset". */
  title: string;
  /** Called when the dialog closes. The parent MUST drop the password from state. */
  onClose: () => void;
  /** True for a password reset, where the server revoked existing sessions. */
  sessionsRevoked?: boolean;
}

/**
 * Shows a server-issued temporary password exactly once.
 *
 * Security contract:
 * - the password exists only in the parent's React state for as long as this
 *   dialog is open; the parent clears it in `onClose`;
 * - it is never written to localStorage/sessionStorage, never logged and never
 *   placed in a toast;
 * - the server stores only its hash and will not return it again.
 */
export const OneTimePasswordModal: React.FC<OneTimePasswordModalProps> = ({
  password,
  accountName,
  accountEmail,
  title,
  onClose,
  sessionsRevoked = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleClose = () => {
    setCopied(false);
    setCopyFailed(false);
    onClose();
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Clipboard can be blocked (permissions / insecure context); the value
      // is still selectable in the field.
      setCopyFailed(true);
    }
  };

  return (
    <Modal isOpen={password !== null} onClose={handleClose} title={title} size="md">
      <div className="space-y-4 text-sm">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-950 leading-relaxed">
            This temporary password for <strong>{accountName}</strong>
            {accountEmail ? <> ({accountEmail})</> : null} is shown <strong>only once</strong>. It is not stored
            in readable form and cannot be retrieved later. Share it with the account holder through a secure
            channel before closing this dialog.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="one-time-password" className="text-slate-600 font-semibold flex items-center gap-1.5">
            <KeyRound className="h-4 w-4" /> Temporary password
          </label>
          <div className="flex items-center gap-2">
            <input
              id="one-time-password"
              type="text"
              readOnly
              autoComplete="off"
              spellCheck={false}
              value={password ?? ''}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {copyFailed && (
            <p className="text-xs text-rose-600">Copy was blocked by the browser. Select the password and copy it manually.</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          {sessionsRevoked ? 'All existing sessions for this account were signed out. ' : ''}
          If this password is lost, issue a new one with password reset.
        </p>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={handleClose}>
            I have shared it securely
          </Button>
        </div>
      </div>
    </Modal>
  );
};
