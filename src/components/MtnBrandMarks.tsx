import React from 'react';

export const BeninFlag: React.FC<{ className?: string }> = ({ className = 'w-6 h-4' }) => (
  <svg
    viewBox="0 0 30 20"
    className={`${className} rounded-[2px] border border-black/15 shrink-0`}
    role="img"
    aria-label="Drapeau de la République du Bénin"
  >
    <rect x="0" y="0" width="12" height="20" fill="#008751" />
    <rect x="12" y="0" width="18" height="10" fill="#FCD116" />
    <rect x="12" y="10" width="18" height="10" fill="#E8112D" />
  </svg>
);

export const MtnMomoEmblem: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims =
    size === 'lg'
      ? 'w-16 h-16 rounded-2xl'
      : size === 'sm'
        ? 'w-9 h-9 rounded-xl'
        : 'w-12 h-12 rounded-xl';
  const textClass =
    size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div
      className={`${dims} bg-[#FFCB05] border-2 border-[#111111] flex items-center justify-center shrink-0 shadow-xs`}
      aria-hidden="true"
    >
      <div className="px-2 py-0.5 rounded-full bg-[#004F71] border border-[#111111]">
        <span className={`${textClass} font-display font-black tracking-tight text-[#FFCB05]`}>
          MoMo
        </span>
      </div>
    </div>
  );
};

export interface AgentPhotoScene {
  src: string;
  alt: string;
  title: string;
  location: string;
}

export const MOMO_AGENT_SCENES: AgentPhotoScene[] = [
  {
    src: '/src/assets/images/benin_momo_agents_exchange_1795118763018.jpg',
    alt: 'Échange de billets FCFA et confirmation mobile entre deux agents MTN MoMo à Cotonou au Bénin',
    title: 'Échange cash contre UV en kiosque',
    location: 'Cotonou · Littoral',
  },
  {
    src: '/src/assets/images/benin_momo_kiosk_transaction_1795118763739.jpg',
    alt: 'Transaction de liquidités MTN MoMo entre deux agents béninois avec téléphone et billets FCFA',
    title: 'Validation instantanée sur mobile',
    location: 'Abomey-Calavi · Atlantique',
  },
  {
    src: '/src/assets/images/cotonou_momo_agent_network_1795118761584.jpg',
    alt: 'Deux agents Mobile Money se saluant devant un point de service jaune sur une avenue animée du Bénin',
    title: 'Réseau de confiance entre points de service',
    location: 'Dantokpa & axes urbains · Bénin',
  },
];
