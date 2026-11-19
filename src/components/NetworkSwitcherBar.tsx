import React from 'react';
import { User } from 'firebase/auth';
import { Bell, Download, LogIn, LogOut, ShieldCheck, UserCog } from 'lucide-react';
import { AgentPublic } from '../types';
import { BeninFlag } from './MtnBrandMarks';

interface NetworkSwitcherBarProps {
  user: User | null;
  agentProfile: AgentPublic | null;
  isAdmin: boolean;
  authLoading: boolean;
  isInstalled: boolean;
  unreadAlertsCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenProfileModal: () => void;
  onOpenInstallModal: () => void;
  onOpenAlertsModal: () => void;
}

export const NetworkSwitcherBar: React.FC<NetworkSwitcherBarProps> = ({
  user,
  agentProfile,
  isAdmin,
  authLoading,
  isInstalled,
  unreadAlertsCount,
  onSignIn,
  onSignOut,
  onOpenProfileModal,
  onOpenInstallModal,
  onOpenAlertsModal,
}) => {
  return (
    <div className="border-b border-gray-200 bg-[#004F71] text-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <BeninFlag className="w-6 h-4" />
          <span className="text-xs font-semibold text-white/95 truncate">
            Réseau dédié MTN MoMo · Agents de la République du Bénin
          </span>
          {!isInstalled && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Télécharger l'app</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onOpenAlertsModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-[#FFCB05]" />
            <span>
              Alertes
              {unreadAlertsCount > 0 && (
                <span className="font-mono-num text-[#FFCB05]"> ({unreadAlertsCount})</span>
              )}
            </span>
          </button>

          {authLoading ? (
            <span className="text-xs text-white/75">Vérification session…</span>
          ) : user ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserCog className="w-3.5 h-3.5 text-[#FFCB05]" />
                <span>{agentProfile ? agentProfile.businessName : 'Compléter profil agent'}</span>
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
                title="Se déconnecter"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white text-[#004F71] hover:bg-gray-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion Agent (Google)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

