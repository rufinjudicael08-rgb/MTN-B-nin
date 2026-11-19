import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Flag,
  MessageSquare,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  BENIN_COMMUNES,
  VERIFICATION_LABELS,
  formatFcfa,
} from '../data/beninGeo';
import {
  LiquidityListing,
  LiquidityType,
  ListingIntent,
} from '../types';
import { BeninFlag, MOMO_AGENT_SCENES, MtnMomoEmblem } from './MtnBrandMarks';

interface ListingsViewProps {
  listings: LiquidityListing[];
  loading: boolean;
  currentUid?: string;
  isAdmin: boolean;
  isInstalled: boolean;
  onOpenPublish: () => void;
  onOpenInstallModal: () => void;
  onContactAuthor: (listing: LiquidityListing) => void;
  onReportListing: (listing: LiquidityListing) => void;
  onUpdateListingStatus: (listing: LiquidityListing, status: 'matched' | 'closed') => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onNavigateAnalytics: () => void;
}

export const ListingsView: React.FC<ListingsViewProps> = ({
  listings,
  loading,
  currentUid,
  isAdmin,
  isInstalled,
  onOpenPublish,
  onOpenInstallModal,
  onContactAuthor,
  onReportListing,
  onUpdateListingStatus,
  onDeleteListing,
  onNavigateAnalytics,
}) => {
  const [minAmount, setMinAmount] = useState<string>('');
  const [communeFilter, setCommuneFilter] = useState<string>('');
  const [quartierQuery, setQuartierQuery] = useState<string>('');
  const [intentFilter, setIntentFilter] = useState<ListingIntent | 'all'>('all');
  const [liquidityFilter, setLiquidityFilter] = useState<LiquidityType | 'all'>('all');
  const [selectedListing, setSelectedListing] = useState<LiquidityListing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % MOMO_AGENT_SCENES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredListings = useMemo(() => {
    const amountNum = Number(minAmount) || 0;
    const q = quartierQuery.trim().toLowerCase();

    return listings.filter((item) => {
      if (item.operator !== 'MTN MoMo') return false;
      if (intentFilter !== 'all' && item.intent !== intentFilter) return false;
      if (liquidityFilter !== 'all' && item.liquidityType !== liquidityFilter) return false;
      if (communeFilter && item.commune !== communeFilter) return false;
      if (amountNum > 0 && item.amount < amountNum) return false;
      if (
        q &&
        !item.quartier.toLowerCase().includes(q) &&
        !item.commune.toLowerCase().includes(q) &&
        !item.authorName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [listings, intentFilter, liquidityFilter, communeFilter, minAmount, quartierQuery]);

  const stats = useMemo(() => {
    const active = listings.filter((l) => l.status === 'active' && l.operator === 'MTN MoMo');
    const offerTotal = active
      .filter((l) => l.intent === 'offer')
      .reduce((sum, l) => sum + l.amount, 0);
    const requestTotal = active
      .filter((l) => l.intent === 'request')
      .reduce((sum, l) => sum + l.amount, 0);
    const communesCount = new Set(active.map((l) => l.commune)).size;
    return {
      activeCount: active.length,
      offerTotal,
      requestTotal,
      communesCount,
    };
  }, [listings]);

  const selectedCommuneObj = BENIN_COMMUNES.find((c) => c.name === communeFilter);

  const formatTimestamp = (listing: LiquidityListing) => {
    if (!listing.createdAt) return 'À l’instant';
    try {
      const date = listing.createdAt.toDate();
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Récent';
    }
  };

  const resetFilters = () => {
    setMinAmount('');
    setCommuneFilter('');
    setQuartierQuery('');
    setIntentFilter('all');
    setLiquidityFilter('all');
  };

  const handleStatusChange = async (listing: LiquidityListing, status: 'matched' | 'closed') => {
    setBusyId(listing.id);
    try {
      await onUpdateListingStatus(listing, status);
      setSelectedListing(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    setBusyId(listingId);
    try {
      await onDeleteListing(listingId);
      setSelectedListing(null);
    } finally {
      setBusyId(null);
    }
  };

  const currentScene = MOMO_AGENT_SCENES[activeSlide];

  return (
    <div className="space-y-8">
      {/* Hero avec arrière-plan animé des échanges d'agents au Bénin */}
      <section className="relative rounded-2xl overflow-hidden border border-[#111111]/15 bg-[#00334A] text-white min-h-[380px] flex flex-col justify-between">
        {/* Diaporama animé (opacity + GPU transform uniquement) */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {MOMO_AGENT_SCENES.map((scene, index) => (
            <img
              key={scene.src}
              src={scene.src}
              alt=""
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover momo-ken-burns transition-opacity duration-1000 ${
                index === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00283A]/95 via-[#003B55]/85 to-[#00283A]/65" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <MtnMomoEmblem size="sm" />
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FFCB05]">
                <BeninFlag className="w-5 h-3.5" />
                <span>MTN MoMo · République du Bénin</span>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.05] [text-wrap:balance]">
              La liquidité <span className="text-[#FFCB05]">MTN MoMo</span> entre agents du Bénin.
            </h1>

            <p className="text-sm sm:text-base text-white/90 max-w-xl leading-relaxed">
              Consultez les disponibilités de cash physique et d’unités de valeur (UV) signalées par
              les points de service MTN MoMo à Cotonou, Abomey-Calavi, Porto-Novo, Parakou et dans
              tout le Bénin.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenPublish}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Publier une disponibilité</span>
              </button>
              {!isInstalled && (
                <button
                  type="button"
                  onClick={onOpenInstallModal}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4 text-[#FFCB05]" />
                  <span>Télécharger l'app</span>
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateAnalytics}
                className="inline-flex items-center gap-1.5 px-3 py-3 text-sm font-semibold text-[#FFCB05] hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Analyses Bénin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contrôle du diaporama terrain Bénin */}
          <div className="lg:text-right space-y-2 shrink-0">
            <div className="text-xs font-semibold text-[#FFCB05]">{currentScene.title}</div>
            <div className="text-xs text-white/80">{currentScene.location}</div>
            <div className="inline-flex items-center gap-1.5 pt-1">
              {MOMO_AGENT_SCENES.map((scene, idx) => (
                <button
                  key={scene.src}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Afficher la scène ${idx + 1} : ${scene.title}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === activeSlide ? 'w-7 bg-[#FFCB05]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bande KPI 4 colonnes pleine largeur sous le bloc Hero */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 border-t border-white/15 bg-[#00283A]/85 backdrop-blur-xs divide-y lg:divide-y-0 lg:divide-x divide-white/15">
          <div className="px-5 py-3.5">
            <div className="text-[11px] text-white/70">Annonces MTN MoMo</div>
            <div className="text-xl font-extrabold font-mono-num text-[#FFCB05] mt-0.5">
              {stats.activeCount}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] text-white/70">Communes béninoises</div>
            <div className="text-xl font-extrabold font-mono-num text-white mt-0.5">
              {stats.communesCount}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] text-white/70">Offres disponibles</div>
            <div className="text-base sm:text-lg font-extrabold font-mono-num text-white mt-0.5 truncate">
              {formatFcfa(stats.offerTotal)}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] text-white/70">Besoins recherchés</div>
            <div className="text-base sm:text-lg font-extrabold font-mono-num text-white mt-0.5 truncate">
              {formatFcfa(stats.requestTotal)}
            </div>
          </div>
        </div>
      </section>

      {/* Barre de recherche multi-critères MTN MoMo Bénin */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#111111]">
            <SlidersHorizontal className="w-4 h-4 text-[#004F71]" />
            <span>Rechercher une liquidité MTN MoMo au Bénin</span>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-gray-500 hover:text-[#111111] cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Montant min. (FCFA)
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="Ex. 50000"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Commune (Bénin)
            </label>
            <select
              value={communeFilter}
              onChange={(e) => {
                setCommuneFilter(e.target.value);
                setQuartierQuery('');
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            >
              <option value="">Toutes les communes</option>
              {BENIN_COMMUNES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Quartier / zone
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                list="benin-quartiers-suggestions"
                value={quartierQuery}
                onChange={(e) => setQuartierQuery(e.target.value)}
                placeholder="Ex. Tankpè, Dantokpa"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
              />
              <datalist id="benin-quartiers-suggestions">
                {(selectedCommuneObj
                  ? selectedCommuneObj.quartiers
                  : BENIN_COMMUNES.flatMap((c) => c.quartiers)
                ).map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nature d'opération
            </label>
            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value as ListingIntent | 'all')}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            >
              <option value="all">Offres & Demandes</option>
              <option value="offer">Disponibilités (Offres)</option>
              <option value="request">Besoins (Demandes)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
            {[
              { id: 'all', label: 'Cash & UV' },
              { id: 'cash', label: 'Cash physique' },
              { id: 'uv', label: 'UV / Float MoMo' },
              { id: 'both', label: 'Échange mixte' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLiquidityFilter(tab.id as LiquidityType | 'all')}
                className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  liquidityFilter === tab.id
                    ? 'bg-[#FFCB05] text-[#111111]'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''} MTN MoMo
            active{filteredListings.length > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* Flux des annonces MTN MoMo */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold font-display text-[#111111]">
            Disponibilités et besoins MTN MoMo en direct
          </h2>
          <span className="text-xs text-gray-500">
            Confirmez toujours la liquidité avant de vous déplacer
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl border border-gray-200 bg-white p-5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center space-y-3">
            <h3 className="text-base font-bold text-[#111111]">
              Aucune annonce MTN MoMo active ne correspond à ces filtres
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Ajustez la commune ou le montant, ou publiez dès maintenant votre disponibilité de
              cash ou d'UV MTN MoMo pour les agents voisins.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenPublish}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publier une annonce MTN MoMo</span>
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 bg-white text-[#111111] hover:bg-gray-50 cursor-pointer"
              >
                <span>Tout afficher</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((item) => {
              const isOwn = currentUid === item.authorId;
              const liquidityText =
                item.liquidityType === 'cash'
                  ? 'Cash physique'
                  : item.liquidityType === 'uv'
                    ? 'UV / Float'
                    : 'Cash & UV';

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col justify-between transition-colors hover:border-[#004F71]/50"
                >
                  <div>
                    <div
                      className="h-1.5 w-full"
                      style={{
                        background:
                          item.intent === 'offer'
                            ? 'linear-gradient(90deg, #FFCB05 70%, #004F71 100%)'
                            : 'linear-gradient(90deg, #004F71 70%, #FFCB05 100%)',
                      }}
                    />
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5 font-bold text-[#111111]">
                          <span
                            className="w-2.5 h-2.5 rounded-xs bg-[#FFCB05] border border-[#111111]"
                            aria-hidden="true"
                          />
                          MTN MoMo
                        </span>
                        <span>
                          {item.intent === 'offer' ? 'Offre disponible' : 'Besoin recherché'} ·{' '}
                          {liquidityText}
                        </span>
                      </div>

                      <div>
                        <div className="text-2xl font-black font-mono-num tracking-tight text-[#111111]">
                          {formatFcfa(item.amount)}
                        </div>
                        <p className="text-sm font-semibold text-[#004F71] mt-0.5">
                          {item.quartier}, {item.commune}
                        </p>
                      </div>

                      {item.details && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#111111] truncate">
                        {item.authorName}
                        {isOwn ? ' (Vous)' : ''}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {VERIFICATION_LABELS[item.authorVerification].label} ·{' '}
                        {formatTimestamp(item)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedListing(item)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#004F71] text-white hover:bg-[#003a54] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Détails
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Galerie terrain : échanges entre agents MTN MoMo au Bénin + workflow */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#004F71]">
              <BeninFlag className="w-5 h-3.5" />
              <span>Sur le terrain au Bénin</span>
            </div>
            <h2 className="text-2xl font-black font-display text-[#111111]">
              Échanges entre agents MTN MoMo
            </h2>
            <p className="text-sm text-gray-600">
              Comment les points de service MTN MoMo au Bénin s'entraident pour équilibrer cash et
              UV en toute sécurité.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOMO_AGENT_SCENES.map((scene, idx) => (
            <div
              key={scene.src}
              className="rounded-xl overflow-hidden border border-gray-200 bg-[#FFFDF7] flex flex-col"
            >
              <div className="aspect-video w-full bg-[#004F71] overflow-hidden">
                <img
                  src={scene.src}
                  alt={scene.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1.5">
                <div className="text-xs font-bold font-mono-num text-[#004F71]">
                  0{idx + 1}. {scene.location}
                </div>
                <h3 className="text-sm font-bold text-[#111111]">{scene.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {idx === 0
                    ? 'Un agent disposant de billets FCFA rencontre un collègue ayant besoin de cash contre transfert d’UV.'
                    : idx === 1
                      ? 'Vérification mutuelle des montants et confirmation immédiate sur l’application MTN MoMo.'
                      : 'Collaboration directe entre kiosques de quartiers voisins à Cotonou, Calavi, Porto-Novo et Parakou.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#111111] text-xs leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#004F71]" />
          <div>
            <strong>Protection des agents MTN MoMo Bénin :</strong> Ne partagez jamais votre code
            PIN MoMo, code OTP ou mot de passe. Cette plateforme met en relation les agents mais ne
            conserve ni ne transfère les fonds. Effectuez vos remises d’espèces uniquement dans un
            kiosque identifié.
          </div>
        </div>
      </section>

      {/* Modale détail d'annonce */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xl">
            <div className="h-2 w-full bg-[#FFCB05]" />
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#004F71]">
                    MTN MoMo ·{' '}
                    {selectedListing.intent === 'offer' ? 'Disponibilité' : 'Besoin recherché'}
                  </p>
                  <h3
                    id="listing-modal-title"
                    className="text-2xl font-black font-mono-num text-[#111111] mt-1"
                  >
                    {formatFcfa(selectedListing.amount)}
                  </h3>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {selectedListing.quartier}, {selectedListing.commune}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  aria-label="Fermer"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#111111] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#FFFDF7] border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Agent</span>
                  <span className="font-bold text-[#111111]">{selectedListing.authorName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Statut profil</span>
                  <span className="font-semibold text-[#111111]">
                    {VERIFICATION_LABELS[selectedListing.authorVerification].label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Type de liquidité</span>
                  <span className="font-semibold text-[#111111]">
                    {selectedListing.liquidityType === 'cash'
                      ? 'Cash physique'
                      : selectedListing.liquidityType === 'uv'
                        ? 'UV / Float MoMo'
                        : 'Cash physique & UV'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Publié le</span>
                  <span className="font-mono-num text-[#111111]">
                    {formatTimestamp(selectedListing)}
                  </span>
                </div>
              </div>

              {selectedListing.details && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500">Précisions</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedListing.details}</p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#111111] text-xs leading-relaxed">
                Votre numéro WhatsApp reste protégé. Utilisez la messagerie sécurisée pour vérifier
                les conditions et convenir d'un échange en lieu sûr.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {currentUid === selectedListing.authorId ? (
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    {selectedListing.status === 'active' && (
                      <button
                        type="button"
                        disabled={busyId === selectedListing.id}
                        onClick={() => handleStatusChange(selectedListing, 'matched')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marquer en cours</span>
                      </button>
                    )}
                    {selectedListing.status !== 'closed' && (
                      <button
                        type="button"
                        disabled={busyId === selectedListing.id}
                        onClick={() => handleStatusChange(selectedListing, 'closed')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-[#111111] disabled:opacity-50 cursor-pointer"
                      >
                        <span>Clôturer l'annonce</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === selectedListing.id}
                      onClick={() => handleDelete(selectedListing.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 ml-auto cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedListing;
                        setSelectedListing(null);
                        onContactAuthor(target);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Contacter l'agent</span>
                    </button>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={busyId === selectedListing.id}
                          onClick={() => handleDelete(selectedListing.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Retirer (Admin)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedListing;
                          setSelectedListing(null);
                          onReportListing(target);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Signaler</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
