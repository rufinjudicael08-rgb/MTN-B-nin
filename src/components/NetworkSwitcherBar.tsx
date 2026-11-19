import React from 'react';
import { User } from 'firebase/auth';
import { Bell, Globe, LogIn, LogOut, ShieldCheck, UserCog } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../i18n/translations';
import { AgentPublic } from '../types';
import { BeninFlag } from './MtnBrandMarks';

interface NetworkSwitcherBarProps {
  user: User | null;
  agentProfile: AgentPublic | null;
  isAdmin: boolean;
  authLoading: boolean;
  unreadAlertsCount: number;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenProfileModal: () => void;
  onOpenAlertsModal: () => void;
}

export const NetworkSwitcherBar: React.FC<NetworkSwitcherBarProps> = ({
  user,
  agentProfile,
  isAdmin,
  authLoading,
  unreadAlertsCount,
  onOpenAuthModal,
  onSignOut,
  onOpenProfileModal,
  onOpenAlertsModal,
}) => {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="border-b border-[#00334A]/30 bg-[#004F71] text-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <BeninFlag className="w-6 h-4" />
          <span className="text-xs font-medium text-white/95 truncate">{t('bar.tagline')}</span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
            <Globe className="w-3.5 h-3.5 text-[#FFCB05] shrink-0" aria-hidden="true" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              aria-label="Choisir la langue"
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code} className="text-[#111111] bg-white">
                  {item.label} ({item.region})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenAlertsModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-[#FFCB05]" />
            <span>
              {t('bar.alerts')}
              {unreadAlertsCount > 0 && (
                <span className="font-mono-num text-[#FFCB05]"> ({unreadAlertsCount})</span>
              )}
            </span>
          </button>

          {authLoading ? (
            <span className="text-xs text-white/75">{t('bar.checkingSession')}</span>
          ) : user ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserCog className="w-3.5 h-3.5 text-[#FFCB05]" />
                <span>{agentProfile ? agentProfile.businessName : t('bar.completeProfile')}</span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FFCB05]">
                    · Admin
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                title={t('bar.signOut')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('bar.signOut')}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('bar.signIn')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
