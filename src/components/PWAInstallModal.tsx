import React from 'react';
import { CheckCircle2, Download, Share2, Smartphone, X } from 'lucide-react';
import { BeninFlag, MtnMomoEmblem } from './MtnBrandMarks';

interface PWAInstallModalProps {
  isOpen: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const ok = await onInstall();
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 p-4 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xl">
        <div className="bg-[#004F71] text-white p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <MtnMomoEmblem size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <BeninFlag className="w-5 h-3.5" />
                  <span className="text-xs font-semibold text-[#FFCB05]">
                    Application Web · Bénin
                  </span>
                </div>
                <h2 id="pwa-modal-title" className="text-xl font-black font-display mt-0.5">
                  MTN MoMo Connect
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
          <p className="text-xs text-white/85 leading-relaxed">
            Ajoutez l'application sur votre téléphone Android, iPhone ou ordinateur avec l'icône
            jaune et bleu MTN MoMo pour accéder en un tap aux liquidités des agents au Bénin.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>L'application est déjà installée sur cet appareil.</span>
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] border-2 border-[#111111] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger et installer maintenant</span>
            </button>
          ) : isIOS ? (
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2 text-xs text-[#111111]">
              <div className="font-bold flex items-center gap-2 text-sm">
                <Share2 className="w-4 h-4 text-[#004F71]" />
                <span>Installation sur iPhone / iPad (Safari)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 leading-relaxed">
                <li>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari.</li>
                <li>Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong>.</li>
                <li>Validez <strong>Ajouter</strong> : l'icône jaune MoMo apparaît sur votre écran.</li>
              </ol>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2 text-xs text-[#111111]">
              <div className="font-bold flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4 text-[#004F71]" />
                <span>Installer sur Android / Chrome / Edge</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 leading-relaxed">
                <li>Ouvrez le menu du navigateur (<strong>⋮</strong> en haut à droite).</li>
                <li>Sélectionnez <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong>.</li>
                <li>Confirmez : l'application démarre en plein écran avec les couleurs MTN MoMo.</li>
              </ol>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
            <span>Icône officielle jaune #FFCB05 & bleu #004F71</span>
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-[#004F71] hover:underline cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
