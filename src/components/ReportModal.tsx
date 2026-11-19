import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ReportModalProps {
  target: { type: 'listing' | 'agent'; id: string; label: string } | null;
  onClose: () => void;
  onSubmit: (payload: {
    targetType: 'listing' | 'agent';
    targetId: string;
    reason: string;
    details: string;
  }) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({ target, onClose, onSubmit }) => {
  const [reason, setReason] = useState<string>('Annonce incohérente ou fausse disponibilité');
  const [details, setDetails] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        targetType: target.type,
        targetId: target.id,
        reason,
        details: details.trim(),
      });
      setDetails('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-red-700">Signalement de sécurité</p>
            <h2 id="report-modal-title" className="text-lg font-bold text-[var(--ink-primary)] mt-0.5">
              Signaler : {target.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-lg bg-[var(--surface-subtle)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Motif du signalement
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
            >
              <option>Annonce incohérente ou fausse disponibilité</option>
              <option>Demande de code PIN, OTP ou frais suspects</option>
              <option>Usurpation d'identité ou point de service inexistant</option>
              <option>Comportement inapproprié</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Précisions (facultatif)
            </label>
            <textarea
              rows={3}
              maxLength={400}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Décrivez brièvement l'incident pour la modération."
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-hairline)] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Envoi…' : 'Envoyer le signalement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
