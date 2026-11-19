import React, { useEffect, useRef, useState } from 'react';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth';
import { CheckCircle2, KeyRound, Mail, Phone, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { normalizeBeninWhatsapp } from '../data/beninGeo';
import { auth, googleProvider } from '../firebase';
import { useI18n } from '../i18n/I18nContext';
import { BeninFlag, MtnMomoEmblem } from './MtnBrandMarks';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type AuthTab = 'phone' | 'email' | 'google';

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  if (code === 'auth/operation-not-allowed') {
    return "Ce mode de connexion doit d'abord être activé dans Firebase Console → Authentication → Sign-in method (Téléphone et E-mail/Mot de passe).";
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Numéro invalide. Utilisez le format béninois +229XXXXXXXX (ex. +2290197000000).';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Code de confirmation incorrect. Vérifiez les 6 chiffres reçus par SMS.';
  }
  if (code === 'auth/code-expired') {
    return 'Le code SMS a expiré. Demandez un nouveau code.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Trop de tentatives récentes. Patientez quelques minutes avant de réessayer.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Un compte existe déjà avec cette adresse e-mail. Passez en mode Connexion.';
  }
  if (code === 'auth/weak-password') {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Fenêtre Google fermée avant la fin de la connexion.';
  }
  return err instanceof Error ? err.message : 'Erreur d’authentification.';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [tab, setTab] = useState<AuthTab>('phone');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<string>('');

  // Flux Téléphone (+229) + Code SMS
  const [phoneInput, setPhoneInput] = useState<string>('+229');
  const [otpCode, setOtpCode] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Flux E-mail + Confirmation
  const [emailMode, setEmailMode] = useState<'register' | 'login'>('register');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [awaitingEmailCheck, setAwaitingEmailCheck] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setInfo('');
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // ignore cleanup
        }
        recaptchaRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ensureRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'momo-recaptcha-container', {
        size: 'invisible',
      });
    }
    return recaptchaRef.current;
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const normalized = normalizeBeninWhatsapp(phoneInput);
    if (!/^\+229[0-9]{8,10}$/.test(normalized)) {
      setError('Entrez un numéro béninois valide au format +229XXXXXXXX (8 à 10 chiffres).');
      return;
    }

    setBusy(true);
    try {
      const verifier = ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
      setConfirmationResult(confirmation);
      setInfo(`Un code de confirmation à 6 chiffres vient d’être envoyé par SMS au ${normalized}.`);
    } catch (err) {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaRef.current = null;
      }
      setError(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError('');
    const code = otpCode.trim();
    if (!/^[0-9]{6}$/.test(code)) {
      setError('Saisissez le code de confirmation à 6 chiffres reçu par SMS.');
      return;
    }

    setBusy(true);
    try {
      await confirmationResult.confirm(code);
      setConfirmationResult(null);
      setOtpCode('');
      onSuccess('Compte vérifié par SMS et connecté avec succès.');
      onClose();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Saisissez une adresse e-mail valide.');
      return;
    }
    if (passwordInput.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setBusy(true);
    try {
      if (emailMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
        await sendEmailVerification(cred.user);
        setAwaitingEmailCheck(true);
        setInfo(
          `Compte créé ! Un message de confirmation a été envoyé à ${cleanEmail}. Validez-le puis cliquez sur « Confirmer la validation ».`,
        );
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          setAwaitingEmailCheck(true);
          setInfo(
            `Votre e-mail n’est pas encore confirmé. Un nouveau lien vient d’être envoyé à ${cleanEmail}.`,
          );
        } else {
          onSuccess('Connexion par e-mail réussie.');
          onClose();
        }
      }
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!auth.currentUser) return;
    setBusy(true);
    setError('');
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        onSuccess('Adresse e-mail confirmée ! Bienvenue sur MTN MoMo Connect Bénin.');
        onClose();
      } else {
        setError(
          "La confirmation n’a pas encore été détectée. Ouvrez l'e-mail reçu (vérifiez aussi les spams) puis réessayez.",
        );
      }
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    setBusy(true);
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setInfo(`E-mail de confirmation renvoyé à ${auth.currentUser.email}.`);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess('Connexion Google réussie.');
      onClose();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-[#004F71] text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <MtnMomoEmblem size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FFCB05]">
                <BeninFlag className="w-4 h-3" />
                <span>MTN MoMo Bénin</span>
              </div>
              <h2 id="auth-modal-title" className="text-base sm:text-lg font-bold font-display truncate">
                {t('auth.title')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{t('auth.subtitle')}</p>

          {/* Sélecteur de méthode */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setTab('phone');
                setError('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                tab === 'phone'
                  ? 'bg-[#FFCB05] text-[#111111]'
                  : 'text-gray-600 hover:text-[#111111]'
              }`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Téléphone</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('email');
                setError('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                tab === 'email'
                  ? 'bg-[#FFCB05] text-[#111111]'
                  : 'text-gray-600 hover:text-[#111111]'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">E-mail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('google');
                setError('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                tab === 'google'
                  ? 'bg-[#FFCB05] text-[#111111]'
                  : 'text-gray-600 hover:text-[#111111]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Google</span>
            </button>
          </div>

          {tab === 'phone' && (
            <div className="space-y-4">
              {!confirmationResult ? (
                <form onSubmit={handleSendPhoneCode} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t('auth.tabPhone')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+2290197000000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Un code de confirmation à 6 chiffres sera envoyé par SMS sur votre téléphone.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold font-display bg-[#004F71] text-white hover:bg-[#003a54] disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? 'Envoi du code SMS…' : 'Envoyer le code par SMS'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmPhoneCode} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Code SMS reçu (6 chiffres)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-center text-lg tracking-[0.35em] font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] disabled:opacity-50 cursor-pointer"
                    >
                      {busy ? 'Vérification…' : 'Confirmer le code et créer le compte'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setConfirmationResult(null);
                        setOtpCode('');
                      }}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Changer
                    </button>
                  </div>
                </form>
              )}
              <div id="momo-recaptcha-container" />
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-4">
              {!awaitingEmailCheck ? (
                <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                  <div className="flex items-center gap-4 text-xs font-semibold border-b border-gray-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setEmailMode('register')}
                      className={`pb-1 border-b-2 cursor-pointer ${
                        emailMode === 'register'
                          ? 'border-[#004F71] text-[#004F71]'
                          : 'border-transparent text-gray-500'
                      }`}
                    >
                      Créer un nouveau compte
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailMode('login')}
                      className={`pb-1 border-b-2 cursor-pointer ${
                        emailMode === 'login'
                          ? 'border-[#004F71] text-[#004F71]'
                          : 'border-transparent text-gray-500'
                      }`}
                    >
                      J'ai déjà un compte
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="agent@exemple.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Mot de passe (min. 6 caractères)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold font-display bg-[#004F71] text-white hover:bg-[#003a54] disabled:opacity-50 cursor-pointer"
                  >
                    {busy
                      ? 'Traitement…'
                      : emailMode === 'register'
                        ? 'Créer le compte et envoyer la confirmation'
                        : 'Se connecter'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3 rounded-xl border border-gray-200 bg-[#FFFDF7] p-4">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#004F71] shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-700 leading-relaxed">
                      Ouvrez votre boîte mail <strong>{emailInput}</strong> et cliquez sur le lien
                      de confirmation envoyé, puis appuyez ci-dessous pour activer votre espace.
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleCheckEmailVerified}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Confirmer la validation</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleResendEmail}
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold border border-gray-300 bg-white text-[#111111] hover:bg-gray-50 cursor-pointer"
                    >
                      Renvoyer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'google' && (
            <div className="space-y-3 text-center py-2">
              <p className="text-xs text-gray-600 leading-relaxed">
                Connexion instantanée avec votre compte Google vérifié, sans mot de passe à retenir.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] border border-[#111111]/15 cursor-pointer"
              >
                {busy ? 'Connexion en cours…' : 'Continuer avec Google'}
              </button>
            </div>
          )}

          {info && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
              {info}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
