import React, { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, ShieldAlert, X, XCircle } from 'lucide-react';
import {
  BENIN_COMMUNES,
  FIELD_LIMITS,
  VERIFICATION_LABELS,
  containsSensitiveSecret,
  normalizeBeninWhatsapp,
} from '../data/beninGeo';
import {
  AgentPrivateContact,
  AgentPublic,
  OperatorName,
  ReportItem,
  VerificationRequest,
} from '../types';
import { BeninFlag, MtnMomoEmblem } from './MtnBrandMarks';

interface AgentProfileModalProps {
  isOpen: boolean;
  userEmail: string;
  agentProfile: AgentPublic | null;
  privateContact: AgentPrivateContact | null;
  isAdmin: boolean;
  myVerificationRequests: VerificationRequest[];
  adminVerificationRequests: VerificationRequest[];
  adminReports: ReportItem[];
  onClose: () => void;
  onSaveProfile: (payload: {
    businessName: string;
    commune: string;
    quartier: string;
    operators: OperatorName[];
    isAvailable: boolean;
    bio: string;
    whatsapp: string;
  }) => Promise<void>;
  onRequestVerification: (payload: {
    requestedLevel: 'community' | 'certified';
    referenceNote: string;
  }) => Promise<void>;
  onModerateVerification: (
    req: VerificationRequest,
    decision: 'approved' | 'rejected',
  ) => Promise<void>;
  onResolveReport: (reportId: string) => Promise<void>;
}

export const AgentProfileModal: React.FC<AgentProfileModalProps> = ({
  isOpen,
  userEmail,
  agentProfile,
  privateContact,
  isAdmin,
  myVerificationRequests,
  adminVerificationRequests,
  adminReports,
  onClose,
  onSaveProfile,
  onRequestVerification,
  onModerateVerification,
  onResolveReport,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'verify' | 'admin'>('profile');
  const [businessName, setBusinessName] = useState<string>('');
  const [commune, setCommune] = useState<string>('Cotonou');
  const [quartier, setQuartier] = useState<string>('Dantokpa');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [bio, setBio] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('+229');

  const [requestedLevel, setRequestedLevel] = useState<'community' | 'certified'>('community');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setBusinessName(agentProfile?.businessName || '');
      setCommune(agentProfile?.commune || 'Cotonou');
      setQuartier(agentProfile?.quartier || 'Dantokpa');
      setIsAvailable(agentProfile ? agentProfile.isAvailable : true);
      setBio(agentProfile?.bio || '');
      setWhatsapp(privateContact?.whatsapp || '+229');
      setError('');
    }
  }, [isOpen, agentProfile, privateContact]);

  if (!isOpen) return null;

  const communeObj = BENIN_COMMUNES.find((c) => c.name === commune);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = businessName.trim();
    const cleanQuartier = quartier.trim();
    const cleanBio = bio.trim();
    const normalizedWa = normalizeBeninWhatsapp(whatsapp);

    if (
      cleanName.length < FIELD_LIMITS.businessNameMin ||
      cleanName.length > FIELD_LIMITS.businessNameMax
    ) {
      setError('Le nom commercial doit contenir entre 2 et 60 caractères.');
      return;
    }
    if (
      cleanQuartier.length < FIELD_LIMITS.quartierMin ||
      cleanQuartier.length > FIELD_LIMITS.quartierMax
    ) {
      setError('Précisez votre quartier au Bénin (2 à 60 caractères).');
      return;
    }
    if (!FIELD_LIMITS.whatsappRegex.test(normalizedWa)) {
      setError('Saisissez un numéro WhatsApp béninois valide (ex. +2290197000000 ou +22997000000).');
      return;
    }
    if (containsSensitiveSecret(cleanBio) || containsSensitiveSecret(cleanName)) {
      setError('Sécurité : ne mentionnez jamais de PIN, OTP ou mot de passe.');
      return;
    }

    setSaving(true);
    try {
      await onSaveProfile({
        businessName: cleanName,
        commune,
        quartier: cleanQuartier,
        operators: ['MTN MoMo'],
        isAvailable,
        bio: cleanBio,
        whatsapp: normalizedWa,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const note = referenceNote.trim();
    if (note.length < 5 || note.length > 300) {
      setError('Décrivez votre point de service ou référence en 5 à 300 caractères.');
      return;
    }
    if (containsSensitiveSecret(note)) {
      setError('Sécurité : ne fournissez aucun PIN, OTP ou mot de passe.');
      return;
    }
    setSaving(true);
    try {
      await onRequestVerification({ requestedLevel, referenceNote: note });
      setReferenceNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’envoyer la demande.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xl">
        <div className="bg-[#004F71] text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MtnMomoEmblem size="sm" />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FFCB05]">
                <BeninFlag className="w-4 h-3" />
                <span>{userEmail}</span>
              </div>
              <h2 id="profile-modal-title" className="text-lg font-extrabold font-display">
                {agentProfile ? 'Mon profil agent MTN MoMo' : 'Activer mon compte agent MTN MoMo'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#FFCB05] text-[#111111]'
                  : 'text-gray-600 hover:text-[#111111]'
              }`}
            >
              Informations & WhatsApp
            </button>
            {agentProfile && (
              <button
                type="button"
                onClick={() => setActiveTab('verify')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'verify'
                    ? 'bg-[#FFCB05] text-[#111111]'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                Vérification agent
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#FFCB05] text-[#111111]'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                Modération (
                {adminVerificationRequests.filter((r) => r.status === 'pending').length +
                  adminReports.filter((r) => r.status !== 'resolved').length}
                )
              </button>
            )}
          </div>

          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nom du kiosque / point MTN MoMo
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.businessNameMax}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex. Kiosque Kossi MoMo"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    WhatsApp privé (+229)
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+2290197000000"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Commune (Bénin)
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCommune(next);
                      const found = BENIN_COMMUNES.find((c) => c.name === next);
                      if (found && found.quartiers.length > 0) setQuartier(found.quartiers[0]);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                  >
                    {BENIN_COMMUNES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Quartier / Marché
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.quartierMax}
                    list="profile-quartier-list"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                  />
                  <datalist id="profile-quartier-list">
                    {(communeObj ? communeObj.quartiers : []).map((q) => (
                      <option key={q} value={q} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Présentation du point de service ({bio.length}/{FIELD_LIMITS.bioMax})
                </label>
                <textarea
                  rows={2}
                  maxLength={FIELD_LIMITS.bioMax}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex. Kiosque MTN MoMo face au carrefour, ouvert de 7h30 à 20h."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#111111] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span>Visible comme disponible pour des échanges de liquidités MTN MoMo</span>
              </label>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                Votre numéro WhatsApp est isolé dans votre espace privé : il n’est jamais affiché
                publiquement et n’est transmis que lorsque vous l’autorisez dans une conversation.
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer le profil'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'verify' && agentProfile && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FFFDF7] border border-gray-200 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500">Statut actuel</div>
                  <div className="text-sm font-bold text-[#111111] mt-0.5">
                    {VERIFICATION_LABELS[agentProfile.verificationLevel].label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {VERIFICATION_LABELS[agentProfile.verificationLevel].description}
                  </div>
                </div>
                <BadgeCheck className="w-7 h-7 text-[#004F71] shrink-0" />
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Niveau souhaité
                  </label>
                  <select
                    value={requestedLevel}
                    onChange={(e) =>
                      setRequestedLevel(e.target.value as 'community' | 'certified')
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm"
                  >
                    <option value="community">Vérifié communauté</option>
                    <option value="certified">Agent certifié (point de service identifié)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Précisions de localisation / activité au Bénin (sans PIN ni mot de passe)
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={300}
                    value={referenceNote}
                    onChange={(e) => setReferenceNote(e.target.value)}
                    placeholder="Ex. Kiosque MTN MoMo face au marché d'Akpakpa depuis 3 ans."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#111111] text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#004F71]" />
                  <span>Ne transmettez aucun code secret, PIN ou OTP lors de cette demande.</span>
                </div>

                {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-black font-display bg-[#FFCB05] text-[#111111] cursor-pointer"
                >
                  {saving ? 'Envoi…' : 'Soumettre la demande'}
                </button>
              </form>

              {myVerificationRequests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <h3 className="text-xs font-bold text-gray-700">Mes demandes précédentes</h3>
                  {myVerificationRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-gray-200 text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-[#111111]">
                          {VERIFICATION_LABELS[req.requestedLevel].label}
                        </span>
                        <p className="text-gray-500 mt-0.5">{req.referenceNote}</p>
                      </div>
                      <span className="font-mono-num font-semibold text-gray-700">
                        {req.status === 'pending'
                          ? 'En attente'
                          : req.status === 'approved'
                            ? 'Approuvée'
                            : 'Refusée'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-700">
                  Demandes de vérification en attente
                </h3>
                {adminVerificationRequests.filter((r) => r.status === 'pending').length === 0 ? (
                  <p className="text-xs text-gray-500">Aucune demande en attente.</p>
                ) : (
                  adminVerificationRequests
                    .filter((r) => r.status === 'pending')
                    .map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#111111]">
                            {req.businessName} · {req.commune} →{' '}
                            {VERIFICATION_LABELS[req.requestedLevel].label}
                          </div>
                          <p className="text-gray-600 mt-0.5">{req.referenceNote}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onModerateVerification(req, 'approved')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valider</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onModerateVerification(req, 'rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Refuser</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-700">Signalements récents</h3>
                {adminReports.filter((r) => r.status !== 'resolved').length === 0 ? (
                  <p className="text-xs text-gray-500">Aucun signalement ouvert.</p>
                ) : (
                  adminReports
                    .filter((r) => r.status !== 'resolved')
                    .map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#111111]">
                            [{rep.targetType}] {rep.reason}
                          </div>
                          <p className="text-gray-600 mt-0.5">{rep.details}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onResolveReport(rep.id)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 font-semibold cursor-pointer shrink-0"
                        >
                          Marquer résolu
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
