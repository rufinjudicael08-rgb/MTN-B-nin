import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flag,
  LocateFixed,
  MapPin,
  MessageSquare,
  Navigation,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  BENIN_COMMUNES,
  VERIFICATION_LABELS,
  calculateDistanceKm,
  formatDistance,
  formatFcfa,
  getCommuneCoords,
} from '../data/beninGeo';
import { useI18n } from '../i18n/I18nContext';
import {
  LiquidityListing,
  LiquidityType,
  ListingIntent,
} from '../types';
import { GeoCoords, ListingLocationMap } from './ListingLocationMap';
import { BeninFlag, MOMO_AGENT_SCENES, MtnMomoEmblem } from './MtnBrandMarks';

interface ListingsViewProps {
  listings: LiquidityListing[];
  loading: boolean;
  currentUid?: string;
  isAdmin: boolean;
  onOpenPublish: () => void;
  onContactAuthor: (listing: LiquidityListing) => void;
  onReportListing: (listing: LiquidityListing) => void;
  onUpdateListingStatus: (listing: LiquidityListing, status: 'matched' | 'closed') => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onNavigateAnalytics: () => void;
}

interface EnrichedListing {
  listing: LiquidityListing;
  coords: GeoCoords;
  isExact: boolean;
  distanceKm: number | null;
}

export const ListingsView: React.FC<ListingsViewProps> = ({
  listings,
  loading,
  currentUid,
  isAdmin,
  onOpenPublish,
  onContactAuthor,
  onReportListing,
  onUpdateListingStatus,
  onDeleteListing,
  onNavigateAnalytics,
}) => {
  const { t } = useI18n();
  const [minAmount, setMinAmount] = useState<string>('');
  const [communeFilter, setCommuneFilter] = useState<string>('');
  const [quartierQuery, setQuartierQuery] = useState<string>('');
  const [intentFilter, setIntentFilter] = useState<ListingIntent | 'all'>('all');
  const [liquidityFilter, setLiquidityFilter] = useState<LiquidityType | 'all'>('all');
  const [selectedListing, setSelectedListing] = useState<LiquidityListing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const [userCoords, setUserCoords] = useState<GeoCoords | null>(null);
  const [nearMeActive, setNearMeActive] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string>('');
  const [showNearbyMapModal, setShowNearbyMapModal] = useState<boolean>(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % MOMO_AGENT_SCENES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const requestUserLocation = (activateNearMe: boolean) => {
    setGeoError('');
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('La géolocalisation GPS n’est pas disponible dans votre navigateur.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        if (activateNearMe) {
          setNearMeActive(true);
        }
        setLocatingUser(false);
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Autorisation GPS refusée. Activez la localisation pour trier autour de vous.');
        } else {
          setGeoError('Impossible de déterminer votre position GPS actuelle.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleToggleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setRadiusKm(null);
      setShowNearbyMapModal(false);
      return;
    }
    if (userCoords) {
      setNearMeActive(true);
      return;
    }
    requestUserLocation(true);
  };

  const enrichedListings = useMemo<EnrichedListing[]>(() => {
    const amountNum = Number(minAmount) || 0;
    const q = quartierQuery.trim().toLowerCase();

    const baseFiltered = listings.filter((item) => {
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

    const mapped: EnrichedListing[] = baseFiltered.map((listing) => {
      const isExact =
        listing.latitude !== undefined && listing.longitude !== undefined;
      const [cLat, cLng] = getCommuneCoords(listing.commune);
      const coords: GeoCoords = isExact
        ? { lat: listing.latitude as number, lng: listing.longitude as number }
        : { lat: cLat, lng: cLng };

      const distanceKm = userCoords
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
        : null;

      return { listing, coords, isExact, distanceKm };
    });

    if (nearMeActive && userCoords) {
      return mapped
        .filter((entry) =>
          radiusKm === null || entry.distanceKm === null
            ? true
            : entry.distanceKm <= radiusKm,
        )
        .sort((a, b) => {
          const da = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
          const db = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
          if (Math.abs(da - db) > 0.05) return da - db;
          if (a.isExact !== b.isExact) return a.isExact ? -1 : 1;
          return 0;
        });
    }

    return mapped;
  }, [
    listings,
    intentFilter,
    liquidityFilter,
    communeFilter,
    minAmount,
    quartierQuery,
    userCoords,
    nearMeActive,
    radiusKm,
  ]);

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

  const selectedListingDistance = useMemo(() => {
    if (!selectedListing || !userCoords) return null;
    const isExact =
      selectedListing.latitude !== undefined && selectedListing.longitude !== undefined;
    const [cLat, cLng] = getCommuneCoords(selectedListing.commune);
    const lat = isExact ? (selectedListing.latitude as number) : cLat;
    const lng = isExact ? (selectedListing.longitude as number) : cLng;
    return {
      km: calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng),
      isExact,
    };
  }, [selectedListing, userCoords]);

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
    setNearMeActive(false);
    setRadiusKm(null);
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
                <span>{t('hero.badge')}</span>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1] [text-wrap:balance]">
              {t('hero.titleStart')}
              <span className="text-[#FFCB05]">MTN MoMo</span>
              {t('hero.titleEnd')}
            </h1>

            <p className="text-sm sm:text-base text-white/90 max-w-xl leading-relaxed font-normal">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenPublish}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t('hero.ctaPublish')}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateAnalytics}
                className="inline-flex items-center gap-1.5 px-3 py-3 text-sm font-semibold text-[#FFCB05] hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{t('hero.ctaAnalytics')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

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
            <div className="text-[11px] font-medium text-white/75">{t('kpi.listings')}</div>
            <div className="text-xl font-bold font-mono-num text-[#FFCB05] mt-0.5">
              {stats.activeCount}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-white/75">{t('kpi.communes')}</div>
            <div className="text-xl font-bold font-mono-num text-white mt-0.5">
              {stats.communesCount}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-white/75">{t('kpi.offers')}</div>
            <div className="text-base sm:text-lg font-bold font-mono-num text-white mt-0.5 truncate">
              {formatFcfa(stats.offerTotal)}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-white/75">{t('kpi.requests')}</div>
            <div className="text-base sm:text-lg font-bold font-mono-num text-white mt-0.5 truncate">
              {formatFcfa(stats.requestTotal)}
            </div>
          </div>
        </div>
      </section>

      {/* Barre de recherche multi-critères + Bouton "Annonces autour de moi" */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#111111]">
            <SlidersHorizontal className="w-4 h-4 text-[#004F71]" />
            <span>{t('search.heading')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={locatingUser}
              onClick={handleToggleNearMe}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer ${
                nearMeActive
                  ? 'bg-[#FFCB05] text-[#111111] border border-[#111111]/20'
                  : 'bg-[#004F71] text-white hover:bg-[#003a54]'
              }`}
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>
                {locatingUser
                  ? 'Localisation en cours…'
                  : nearMeActive
                    ? 'Autour de moi (activé)'
                    : 'Annonces autour de moi'}
              </span>
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-gray-500 hover:text-[#111111] px-2 py-1 cursor-pointer"
            >
              {t('search.reset')}
            </button>
          </div>
        </div>

        {geoError && (
          <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            {geoError}
          </p>
        )}

        {nearMeActive && userCoords && (
          <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#111111]">
              <Navigation className="w-3.5 h-3.5 text-[#004F71] shrink-0" />
              <span className="font-bold">Tri par proximité activé</span>
              <span className="text-gray-600 font-mono-num">
                ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={radiusKm === null ? '' : String(radiusKm)}
                onChange={(e) =>
                  setRadiusKm(e.target.value ? Number(e.target.value) : null)
                }
                aria-label="Rayon de recherche"
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-[#111111]"
              >
                <option value="">Toutes distances</option>
                <option value="2">Rayon ≤ 2 km</option>
                <option value="5">Rayon ≤ 5 km</option>
                <option value="15">Rayon ≤ 15 km</option>
                <option value="30">Rayon ≤ 30 km</option>
              </select>

              <button
                type="button"
                onClick={() => setShowNearbyMapModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#004F71] text-white hover:bg-[#003a54] cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#FFCB05]" />
                <span>Voir sur la carte</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('search.minAmount')}
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
              {t('search.commune')}
            </label>
            <select
              value={communeFilter}
              onChange={(e) => {
                setCommuneFilter(e.target.value);
                setQuartierQuery('');
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            >
              <option value="">{t('search.allCommunes')}</option>
              {BENIN_COMMUNES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('search.quartier')}
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
              {t('search.operation')}
            </label>
            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value as ListingIntent | 'all')}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            >
              <option value="all">{t('search.allOps')}</option>
              <option value="offer">{t('search.offersOnly')}</option>
              <option value="request">{t('search.requestsOnly')}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
            {[
              { id: 'all', label: t('search.cashAndUv') },
              { id: 'cash', label: t('search.cashOnly') },
              { id: 'uv', label: t('search.uvOnly') },
              { id: 'both', label: t('search.mixed') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLiquidityFilter(tab.id as LiquidityType | 'all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  liquidityFilter === tab.id
                    ? 'bg-[#FFCB05] text-[#111111]'
                    : 'text-gray-600 hover:text-[#111111]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 font-mono-num">
            {enrichedListings.length} annonce{enrichedListings.length > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* Flux des annonces MTN MoMo */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold font-display text-[#111111]">
            {t('listings.heading')}
          </h2>
          <span className="text-xs text-gray-500">{t('listings.safetyReminder')}</span>
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
        ) : enrichedListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center space-y-3">
            <h3 className="text-base font-bold text-[#111111]">{t('listings.emptyTitle')}</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">{t('listings.emptyDesc')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenPublish}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('hero.ctaPublish')}</span>
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 bg-white text-[#111111] hover:bg-gray-50 cursor-pointer"
              >
                <span>{t('listings.showAll')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedListings.map(({ listing: item, isExact, distanceKm }) => {
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
                        <div className="text-2xl font-bold font-mono-num tracking-tight text-[#111111]">
                          {formatFcfa(item.amount)}
                        </div>
                        <p className="text-sm font-semibold text-[#004F71] mt-0.5">
                          {item.quartier}, {item.commune}
                        </p>

                        {(distanceKm !== null || isExact) && (
                          <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-[#004F71] shrink-0" />
                            {distanceKm !== null ? (
                              <span className="font-semibold font-mono-num text-[#111111]">
                                À {formatDistance(distanceKm)} de vous{' '}
                                <span className="font-normal text-gray-500">
                                  ({isExact ? 'GPS exact' : 'zone commune'})
                                </span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">
                                Position GPS jointe
                              </span>
                            )}
                          </div>
                        )}
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
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#004F71] text-white hover:bg-[#003a54] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {t('listings.details')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modale Carte "Annonces autour de moi" (à la demande uniquement) */}
      {showNearbyMapModal && userCoords && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearby-map-title"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xl">
            <div className="bg-[#004F71] text-white px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#FFCB05]">
                  Proximité temps réel · MTN MoMo Bénin
                </div>
                <h3 id="nearby-map-title" className="text-base sm:text-lg font-extrabold font-display">
                  Annonces autour de votre position ({enrichedListings.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNearbyMapModal(false)}
                aria-label="Fermer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <ListingLocationMap
                mode="nearby"
                userCoords={userCoords}
                radiusKm={radiusKm}
                listings={enrichedListings.map((entry) => ({
                  listing: entry.listing,
                  coords: entry.coords,
                  isExact: entry.isExact,
                  distanceKm: entry.distanceKm ?? 0,
                }))}
                onSelectListing={(listing) => {
                  setShowNearbyMapModal(false);
                  setSelectedListing(listing);
                }}
                heightClass="h-[360px]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                <span>
                  Cliquez sur un point jaune/blanc pour ouvrir les détails de l&apos;annonce et
                  contacter l&apos;agent.
                </span>
                <span className="font-mono-num font-semibold text-[#004F71]">
                  Votre point est en bleu
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale détail d'annonce avec position sur le site et distance entre agents */}
      {selectedListing && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xl my-auto">
            <div className="h-2 w-full bg-[#FFCB05]" />
            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
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

              {/* Localisation sur le site + Distance entre vous et l'agent */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 font-bold text-[#111111]">
                    <MapPin className="w-3.5 h-3.5 text-[#004F71]" />
                    <span>
                      {selectedListing.latitude !== undefined &&
                      selectedListing.longitude !== undefined
                        ? 'Position exacte sur le site'
                        : `Localisation (${selectedListing.commune})`}
                    </span>
                  </div>

                  {selectedListingDistance ? (
                    <span className="font-mono-num font-bold text-[#004F71]">
                      Distance : {formatDistance(selectedListingDistance.km)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={locatingUser}
                      onClick={() => requestUserLocation(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#004F71] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span>
                        {locatingUser ? 'Calcul…' : 'Voir ma position & distance'}
                      </span>
                    </button>
                  )}
                </div>

                <ListingLocationMap
                  mode="detail"
                  listing={selectedListing}
                  userCoords={userCoords}
                  heightClass="h-48"
                />
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
                les conditions et convenir d&apos;un échange en lieu sûr.
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
                        <span>Clôturer l&apos;annonce</span>
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
                      <span>Contacter l&apos;agent</span>
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
