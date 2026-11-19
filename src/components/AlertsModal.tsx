import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  CheckCheck,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { BENIN_COMMUNES, FIELD_LIMITS, formatFcfa } from '../data/beninGeo';
import { FCM_VAPID_KEY, FcmRegistrationResult, checkPushSupport } from '../firebase';
import {
  AgentNotification,
  AgentPublic,
  AlertRule,
  FcmToken,
  LiquidityListing,
  LiquidityType,
  ListingIntent,
} from '../types';

export function doesListingMatchRule(listing: LiquidityListing, rule: AlertRule): boolean {
  if (!rule.enabled) return false;
  if (listing.operator !== 'MTN MoMo' || listing.status !== 'active') return false;
  if (rule.commune !== 'Toutes' && listing.commune !== rule.commune) return false;
  if (
    rule.quartier.trim() !== '' &&
    !listing.quartier.toLowerCase().includes(rule.quartier.trim().toLowerCase())
  ) {
    return false;
  }
  if (rule.intent !== 'all' && listing.intent !== rule.intent) return false;
  if (rule.liquidityType !== 'all' && listing.liquidityType !== rule.liquidityType) return false;
  if (listing.amount < rule.minAmount || listing.amount > rule.maxAmount) return false;
  return true;
}

interface AlertsModalProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  agentProfile: AgentPublic | null;
  notifications: AgentNotification[];
  alertRules: AlertRule[];
  fcmTokens: FcmToken[];
  fcmStatus: FcmRegistrationResult | null;
  onClose: () => void;
  onSignIn: () => void;
  onOpenProfileModal: () => void;
  onEnablePush: () => Promise<void>;
  onTestBrowserNotification: () => Promise<void>;
  onCreateRule: (payload: {
    commune: string;
    quartier: string;
    intent: 'all' | ListingIntent;
    liquidityType: 'all' | LiquidityType;
    minAmount: number;
    maxAmount: number;
  }) => Promise<void>;
  onToggleRule: (rule: AlertRule) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onScanExistingListings: () => Promise<number>;
  onMarkNotificationRead: (notifId: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onDeleteNotification: (notifId: string) => Promise<void>;
  onOpenNotificationListing: (notif: AgentNotification) => void;
}

const INTENT_LABELS: Record<'all' | ListingIntent, string> = {
  all: 'Offres et besoins',
  offer: 'Offres disponibles uniquement',
  request: 'Besoins urgents uniquement',
};

const LIQUIDITY_LABELS: Record<'all' | LiquidityType, string> = {
  all: 'Cash et UV / Float',
  cash: 'Cash physique (FCFA)',
  uv: 'UV / Float MTN MoMo',
  both: 'Cash + UV combinés',
};

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  isAuthenticated,
  agentProfile,
  notifications,
  alertRules,
  fcmTokens,
  fcmStatus,
  onClose,
  onSignIn,
  onOpenProfileModal,
  onEnablePush,
  onTestBrowserNotification,
  onCreateRule,
  onToggleRule,
  onDeleteRule,
  onScanExistingListings,
  onMarkNotificationRead,
  onMarkAllRead,
  onDeleteNotification,
  onOpenNotificationListing,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'rules'>('inbox');
  const [pushSupported, setPushSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default',
  );
  const [enablingPush, setEnablingPush] = useState<boolean>(false);

  // Formulaire nouvelle règle d'alerte
  const [commune, setCommune] = useState<string>('Toutes');
  const [quartier, setQuartier] = useState<string>('');
  const [intent, setIntent] = useState<'all' | ListingIntent>('all');
  const [liquidityType, setLiquidityType] = useState<'all' | LiquidityType>('all');
  const [minAmount, setMinAmount] = useState<string>('50000');
  const [maxAmount, setMaxAmount] = useState<string>('5000000');
  const [formError, setFormError] = useState<string>('');
  const [savingRule, setSavingRule] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    void checkPushSupport().then(setPushSupported);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    if (notifications.length === 0 && alertRules.length === 0) {
      setActiveTab('rules');
    }
  }, [isOpen, notifications.length, alertRules.length]);

  const availableQuartiers = useMemo(() => {
    if (commune === 'Toutes') return [];
    return BENIN_COMMUNES.find((c) => c.name === commune)?.quartiers || [];
  }, [commune]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  if (!isOpen) return null;

  const handleEnablePushClick = async () => {
    setEnablingPush(true);
    try {
      await onEnablePush();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    } finally {
      setEnablingPush(false);
    }
  };

  const handleSubmitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isAuthenticated) {
      onSignIn();
      return;
    }
    if (!agentProfile) {
      onOpenProfileModal();
      return;
    }

    const parsedMin = Number(minAmount);
    const parsedMax = Number(maxAmount);
    if (!Number.isFinite(parsedMin) || parsedMin < 0 || parsedMin > FIELD_LIMITS.amountMax) {
      setFormError('Montant minimum invalide (0 à 25 000 000 FCFA).');
      return;
    }
    if (
      !Number.isFinite(parsedMax) ||
      parsedMax < parsedMin ||
      parsedMax > FIELD_LIMITS.amountMax
    ) {
      setFormError('Le montant maximum doit être supérieur ou égal au minimum.');
      return;
    }

    setSavingRule(true);
    try {
      await onCreateRule({
        commune: commune.trim() || 'Toutes',
        quartier: quartier.trim().slice(0, FIELD_LIMITS.quartierMax),
        intent,
        liquidityType,
        minAmount: Math.round(parsedMin),
        maxAmount: Math.round(parsedMax),
      });
      setQuartier('');
      setScanMessage('Règle enregistrée. Cliquez sur « Scanner maintenant » pour vérifier les annonces déjà en ligne.');
    } finally {
      setSavingRule(false);
    }
  };

  const handleScanNow = async () => {
    setScanning(true);
    setScanMessage('');
    try {
      const matchedCount = await onScanExistingListings();
      if (matchedCount > 0) {
        setScanMessage(`${matchedCount} nouvelle(s) alerte(s) ajoutée(s) à votre boîte.`);
        setActiveTab('inbox');
      } else {
        setScanMessage('Aucune nouvelle annonce correspondante détectée pour vos règles actives.');
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        {/* En-tête MTN MoMo Bénin */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#004F71] text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FFCB05] text-[#111111] flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="alerts-modal-title" className="text-base font-black font-display truncate">
                Alertes temps réel & Push FCM
              </h2>
              <p className="text-xs text-white/80 truncate">
                Soyez informé dès qu'une annonce MTN MoMo correspond à votre zone au Bénin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les alertes"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex items-center justify-between px-5 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'inbox'
                  ? 'border-[#004F71] text-[#004F71]'
                  : 'border-transparent text-gray-600 hover:text-[#111111]'
              }`}
            >
              Alertes reçues ({notifications.length}
              {unreadCount > 0 ? ` · ${unreadCount} non lue(s)` : ''})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'rules'
                  ? 'border-[#004F71] text-[#004F71]'
                  : 'border-transparent text-gray-600 hover:text-[#111111]'
              }`}
            >
              Critères & Push FCM ({alertRules.length})
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!isAuthenticated ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
              <Bell className="w-8 h-8 text-[#004F71] mx-auto" />
              <h3 className="text-sm font-black font-display text-[#111111]">
                Connectez-vous pour activer vos alertes d'agent
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                Enregistrez vos communes, quartiers et seuils en FCFA pour recevoir des alertes en
                temps réel via Firebase Cloud Messaging dès qu'un agent publie une annonce.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="px-4 py-2 rounded-xl bg-[#FFCB05] text-[#111111] text-xs font-black font-display hover:bg-[#f2bd00] cursor-pointer"
              >
                Connexion Agent (Google)
              </button>
            </div>
          ) : activeTab === 'inbox' ? (
            <div className="space-y-4">
              {notifications.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Correspondances détectées selon vos critères MTN MoMo
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void onMarkAllRead()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004F71] hover:underline cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tout marquer comme lu</span>
                    </button>
                  )}
                </div>
              )}

              {notifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center space-y-3">
                  <BellOff className="w-7 h-7 text-gray-400 mx-auto" />
                  <p className="text-sm font-bold text-[#111111]">Aucune alerte pour le moment</p>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Configurez une règle par commune ou montant dans « Critères & Push FCM » pour
                    recevoir automatiquement les nouvelles annonces compatibles.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('rules')}
                    className="px-3.5 py-2 rounded-xl bg-[#004F71] text-white text-xs font-bold hover:bg-[#003a54] cursor-pointer"
                  >
                    Configurer mes alertes
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 transition-colors ${
                        notif.read ? 'bg-white' : 'bg-[#FEF9C7]/45'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-semibold text-[#004F71]">
                            {notif.intent === 'offer' ? 'Offre disponible' : 'Besoin urgent'} ·{' '}
                            {notif.quartier}, {notif.commune}
                            {!notif.read ? ' · Nouveau' : ''}
                          </div>
                          <div className="text-sm font-black font-display text-[#111111]">
                            <span className="font-mono-num">{formatFcfa(notif.amount)}</span> —{' '}
                            {notif.title}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{notif.body}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => void onMarkNotificationRead(notif.id)}
                              title="Marquer comme lu"
                              className="p-1.5 rounded-lg text-[#004F71] hover:bg-[#004F71]/10 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void onDeleteNotification(notif.id)}
                            title="Supprimer l'alerte"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-gray-500">
                          {notif.createdAt?.toDate
                            ? notif.createdAt.toDate().toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'À l’instant'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenNotificationListing(notif)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004F71] text-white text-xs font-bold hover:bg-[#003a54] cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#FFCB05]" />
                          <span>Voir l'annonce</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bloc Firebase Cloud Messaging */}
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black font-display text-[#111111]">
                      Notifications Push Firebase Messaging
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Permission navigateur :{' '}
                      <strong className="text-[#111111]">
                        {permission === 'granted'
                          ? 'Autorisées'
                          : permission === 'denied'
                            ? 'Bloquées dans le navigateur'
                            : 'Non activées'}
                      </strong>
                      {fcmTokens.length > 0 &&
                        ` · ${fcmTokens.length} appareil FCM enregistré`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      disabled={enablingPush || !pushSupported}
                      onClick={() => void handleEnablePushClick()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFCB05] text-[#111111] text-xs font-black font-display hover:bg-[#f2bd00] disabled:opacity-50 cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>
                        {enablingPush
                          ? 'Activation…'
                          : permission === 'granted'
                            ? 'Synchroniser FCM'
                            : 'Activer les push'}
                      </span>
                    </button>
                    {permission === 'granted' && (
                      <button
                        type="button"
                        onClick={() => void onTestBrowserNotification()}
                        className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-[#111111] hover:bg-gray-100 cursor-pointer"
                      >
                        Tester alerte
                      </button>
                    )}
                  </div>
                </div>

                {!pushSupported && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Cet aperçu ou navigateur ne supporte pas le Service Worker Push. Les alertes en
                    direct dans l'application restent néanmoins actives.
                  </p>
                )}

                {permission === 'denied' && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Les notifications sont bloquées par votre navigateur. Autorisez-les dans les
                    paramètres du site (icône cadenas) puis cliquez sur « Synchroniser FCM ».
                  </p>
                )}

                {(!FCM_VAPID_KEY || fcmStatus?.status === 'missing_vapid') && (
                  <p className="text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 leading-relaxed">
                    Info technique : les alertes temps réel dans l'application et les notifications
                    navigateur fonctionnent immédiatement. Pour recevoir des push FCM en arrière-plan
                    même onglet fermé, renseignez{' '}
                    <code className="font-mono text-[#004F71]">VITE_FIREBASE_VAPID_KEY</code> depuis
                    Firebase Console → Cloud Messaging → Web Push certificates.
                  </p>
                )}

                {fcmStatus?.status === 'active' && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 font-medium">
                    Jeton Firebase Cloud Messaging enregistré pour ce navigateur.
                  </p>
                )}

                {fcmStatus?.status === 'error' && fcmStatus.errorMessage && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {fcmStatus.errorMessage}
                  </p>
                )}
              </section>

              {/* Formulaire d'ajout de règle */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black font-display text-[#111111]">
                    Nouvelle règle de veille MTN MoMo
                  </h3>
                  {!agentProfile && (
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="text-xs font-bold text-[#004F71] underline cursor-pointer"
                    >
                      Compléter profil agent requis
                    </button>
                  )}
                </div>

                <form
                  onSubmit={handleSubmitRule}
                  className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Commune du Bénin
                      </label>
                      <select
                        value={commune}
                        onChange={(e) => {
                          setCommune(e.target.value);
                          setQuartier('');
                        }}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:border-[#004F71]"
                      >
                        <option value="Toutes">Toutes les communes</option>
                        {BENIN_COMMUNES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Quartier (optionnel)
                      </label>
                      <input
                        type="text"
                        list="alert-quartier-suggestions"
                        maxLength={FIELD_LIMITS.quartierMax}
                        value={quartier}
                        onChange={(e) => setQuartier(e.target.value)}
                        placeholder={
                          availableQuartiers.length > 0
                            ? `Ex: ${availableQuartiers[0]}`
                            : 'Ex: Dantokpa, Tankpè…'
                        }
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#004F71]"
                      />
                      <datalist id="alert-quartier-suggestions">
                        {availableQuartiers.map((q) => (
                          <option key={q} value={q} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Type d'annonce surveillée
                      </label>
                      <select
                        value={intent}
                        onChange={(e) => setIntent(e.target.value as 'all' | ListingIntent)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:border-[#004F71]"
                      >
                        <option value="all">Offres et besoins</option>
                        <option value="offer">Offres disponibles</option>
                        <option value="request">Besoins urgents</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Forme de liquidité
                      </label>
                      <select
                        value={liquidityType}
                        onChange={(e) => setLiquidityType(e.target.value as 'all' | LiquidityType)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium bg-white focus:outline-none focus:border-[#004F71]"
                      >
                        <option value="all">Cash et UV / Float</option>
                        <option value="cash">Cash physique (FCFA)</option>
                        <option value="uv">UV / Float MTN MoMo</option>
                        <option value="both">Cash + UV combinés</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Montant minimum (FCFA)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={FIELD_LIMITS.amountMax}
                        step={500}
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono-num focus:outline-none focus:border-[#004F71]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Montant maximum (FCFA)
                      </label>
                      <input
                        type="number"
                        min={500}
                        max={FIELD_LIMITS.amountMax}
                        step={500}
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono-num focus:outline-none focus:border-[#004F71]"
                      />
                    </div>
                  </div>

                  {formError && <p className="text-xs font-semibold text-red-600">{formError}</p>}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={savingRule}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004F71] text-white text-xs font-black font-display hover:bg-[#003a54] disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FFCB05]" />
                      <span>{savingRule ? 'Enregistrement…' : 'Enregistrer la règle'}</span>
                    </button>

                    {alertRules.length > 0 && (
                      <button
                        type="button"
                        disabled={scanning}
                        onClick={() => void handleScanNow()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-[#111111] hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-[#004F71]" />
                        <span>{scanning ? 'Analyse…' : 'Scanner les annonces actives'}</span>
                      </button>
                    )}
                  </div>

                  {scanMessage && (
                    <p className="text-xs font-medium text-[#004F71] pt-1">{scanMessage}</p>
                  )}
                </form>
              </section>

              {/* Liste des règles enregistrées */}
              <section className="space-y-2.5">
                <h3 className="text-sm font-black font-display text-[#111111]">
                  Mes règles actives ({alertRules.length})
                </h3>
                {alertRules.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Aucune règle configurée. Créez une règle ci-dessus pour être alerté en temps
                    réel.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                    {alertRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3.5 flex items-center justify-between gap-3 bg-white"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-black font-display text-[#111111]">
                            {rule.commune === 'Toutes' ? 'Tout le Bénin' : rule.commune}
                            {rule.quartier ? ` · ${rule.quartier}` : ''} ·{' '}
                            <span className="font-mono-num">
                              {formatFcfa(rule.minAmount)} – {formatFcfa(rule.maxAmount)}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-600">
                            {INTENT_LABELS[rule.intent]} · {LIQUIDITY_LABELS[rule.liquidityType]} ·{' '}
                            <span className={rule.enabled ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                              {rule.enabled ? 'Active' : 'En pause'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void onToggleRule(rule)}
                            className="px-2.5 py-1 rounded-lg border border-gray-300 text-[11px] font-bold text-[#111111] hover:bg-gray-100 cursor-pointer"
                          >
                            {rule.enabled ? 'Mettre en pause' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteRule(rule.id)}
                            aria-label="Supprimer cette règle"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
