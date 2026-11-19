import React from 'react';
import { ShieldAlert, Smartphone } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { BeninFlag, MOMO_AGENT_SCENES } from './MtnBrandMarks';

interface BottomFloatingBackdropProps {
  isInstalled: boolean;
  onTriggerInstall: () => void;
}

export const BottomFloatingBackdrop: React.FC<BottomFloatingBackdropProps> = ({
  isInstalled,
  onTriggerInstall,
}) => {
  const { t } = useI18n();

  const cards = [
    {
      scene: MOMO_AGENT_SCENES[0],
      title: t('floating.card1Title'),
      desc: t('floating.card1Desc'),
      step: '01',
    },
    {
      scene: MOMO_AGENT_SCENES[1],
      title: t('floating.card2Title'),
      desc: t('floating.card2Desc'),
      step: '02',
    },
    {
      scene: MOMO_AGENT_SCENES[2],
      title: t('floating.card3Title'),
      desc: t('floating.card3Desc'),
      step: '03',
    },
  ];

  return (
    <section
      aria-label={t('floating.eyebrow')}
      className="relative overflow-hidden border-t border-[#111111]/10 bg-[#00283A] text-white"
    >
      {/* Images flottantes en arrière-plan (transactions internes entre agents du Bénin) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="momo-float-slow absolute -top-6 -left-10 w-72 sm:w-96 aspect-video rounded-2xl overflow-hidden opacity-25 border border-[#FFCB05]/30 shadow-2xl">
          <img
            src={MOMO_AGENT_SCENES[0].src}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="momo-float-reverse absolute top-1/4 right-[-3rem] w-80 sm:w-[26rem] aspect-video rounded-2xl overflow-hidden opacity-25 border border-[#FFCB05]/30 shadow-2xl">
          <img
            src={MOMO_AGENT_SCENES[1].src}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="momo-float-slow absolute -bottom-8 left-1/3 w-72 sm:w-96 aspect-video rounded-2xl overflow-hidden opacity-20 border border-white/20 shadow-2xl">
          <img
            src={MOMO_AGENT_SCENES[2].src}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-[#00283A]/90 via-[#00334A]/82 to-[#002233]/95" />
      </div>

      {/* Contenu lisible au-dessus des images flottantes */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FFCB05]">
              <BeninFlag className="w-5 h-3.5" />
              <span>{t('floating.eyebrow')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {t('floating.title')}
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">{t('floating.subtitle')}</p>
          </div>

          {!isInstalled && (
            <button
              type="button"
              onClick={onTriggerInstall}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] whitespace-nowrap shrink-0 cursor-pointer shadow-md"
            >
              <Smartphone className="w-4 h-4" />
              <span>{t('hero.ctaInstall')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((item) => (
            <article
              key={item.step}
              className="rounded-2xl overflow-hidden border border-white/15 bg-[#002233]/90 flex flex-col shadow-lg"
            >
              <div className="aspect-video w-full overflow-hidden bg-[#004F71]">
                <img
                  src={item.scene.src}
                  alt={item.scene.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-1.5 flex-1">
                <div className="text-xs font-semibold font-mono-num text-[#FFCB05]">
                  {item.step} · {item.scene.location}
                </div>
                <h3 className="text-sm sm:text-base font-bold font-display text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-white/75 leading-relaxed">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#001D2B]/90 border border-[#FFCB05]/30 text-white/90 text-xs leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#FFCB05]" />
          <span>{t('floating.securityNote')}</span>
        </div>
      </div>
    </section>
  );
};
