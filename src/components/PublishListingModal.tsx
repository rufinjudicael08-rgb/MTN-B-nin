import React, { useEffect, useState } from 'react';
import { LocateFixed, MapPin, ShieldAlert, Trash2, X } from 'lucide-react';
import {
  BENIN_COMMUNES,
  FIELD_LIMITS,
  containsSensitiveSecret,
  getCommuneCoords,
} from '../data/beninGeo';
import {
  AgentPublic,
  LiquidityType,
  ListingIntent,
  OperatorName,
} from '../types';
import { GeoCoords, ListingLocationMap } from './ListingLocationMap';
import { BeninFlag, MtnMomoEmblem } from './MtnBrandMarks';

interface PublishListingModalProps {
  isOpen: boolean;
  agentProfile: AgentPublic | null;
  onClose: () => void;
  onSubmit: (payload: {
    intent: ListingIntent;
    liquidityType: LiquidityType;
    operator: OperatorName;
    amount: number;
    commune: string;
    quartier: string;
    details: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
}

export const PublishListingModal: React.FC<PublishListingModalProps> = ({
  isOpen,
  agentProfile,
  onClose,
  onSubmit,
}) => {
  const [intent, setIntent] = useState<ListingIntent>('offer');
  const [liquidityType, setLiquidityType] = useState<LiquidityType>('cash');
  const [amount, setAmount] = useState<string>('50000');
  const [commune, setCommune] = useState<string>(agentProfile?.commune || 'Abomey-Calavi');
  const [quartier, setQuartier] = useState<string>(agentProfile?.quartier || 'Tankpè');
  const [details, setDetails] = useState<string>('');
  const [pickedCoords, setPickedCoords] = useState<GeoCoords | null>(null);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && agentProfile) {
      setCommune(agentProfile.commune);
      setQuartier(agentProfile.quartier);
    }
  }, [isOpen, agentProfile]);

  if (!isOpen) return null;

  const communeObj = BENIN_COMMUNES.find((c) => c.name === commune);
  const [communeLat, communeLng] = getCommuneCoords(commune);

  const handleCaptureGps = () => {
    setGeoError('');
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('La géolocalisation GPS n’est pas disponible sur cet appareil.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickedCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Autorisation GPS refusée. Vous pouvez placer votre position sur la carte.');
        } else {
          setGeoError('Position GPS introuvable. Utilisez « Placer sur la carte » ci-dessous.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amount);
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < FIELD_LIMITS.amountMin ||
      parsedAmount > FIELD_LIMITS.amountMax
    ) {
      setError(`Le montant doit être compris entre ${FIELD_LIMITS.amountMin} et 25 000 000 FCFA.`);
      return;
    }

    const cleanCommune = commune.trim();
    const cleanQuartier = quartier.trim();
    const cleanDetails = details.trim();

    if (cleanCommune.length < FIELD_LIMITS.communeMin || cleanCommune.length > FIELD_LIMITS.communeMax) {
      setError('Veuillez sélectionner une commune valide au Bénin.');
      return;
    }
    if (cleanQuartier.length < FIELD_LIMITS.quartierMin || cleanQuartier.length > FIELD_LIMITS.quartierMax) {
      setError('Veuillez préciser votre quartier (2 à 60 caractères).');
      return;
    }
    if (cleanDetails.length > FIELD_LIMITS.listingDetailsMax) {
      setError(`Les précisions ne doivent pas dépasser ${FIELD_LIMITS.listingDetailsMax} caractères.`);
      return;
    }
    if (containsSensitiveSecret(cleanDetails) || containsSensitiveSecret(cleanQuartier)) {
      setError('Sécurité : ne mentionnez jamais de code PIN, OTP ou mot de passe.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        intent,
        liquidityType,
        operator: 'MTN MoMo',
        amount: Math.round(parsedAmount),
        commune: cleanCommune,
        quartier: cleanQuartier,
        details: cleanDetails,
        ...(pickedCoords
          ? { latitude: pickedCoords.lat, longitude: pickedCoords.lng }
          : {}),
      });
      setDetails('');
      setPickedCoords(null);
      setShowMapPicker(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'annonce.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-2xl my-auto">
        <div className="bg-[#004F71] text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MtnMomoEmblem size="sm" />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FFCB05]">
                <BeninFlag className="w-4 h-3" />
                <span>MTN MoMo Bénin</span>
              </div>
              <h2 id="publish-modal-title" className="text-lg font-extrabold font-display">
                Signaler une disponibilité ou un besoin
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

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Je souhaite
              </label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value as ListingIntent)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
              >
                <option value="offer">Proposer une disponibilité</option>
                <option value="request">Rechercher des liquidités</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Type de liquidité MTN MoMo
              </label>
              <select
                value={liquidityType}
                onChange={(e) => setLiquidityType(e.target.value as LiquidityType)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
              >
                <option value="cash">Cash physique (espèces)</option>
                <option value="uv">UV / Float MTN MoMo</option>
                <option value="both">Échange mixte (Cash ↔ UV)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Montant (FCFA)
              </label>
              <input
                type="number"
                min={FIELD_LIMITS.amountMin}
                max={FIELD_LIMITS.amountMax}
                step={500}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                  if (found && found.quartiers.length > 0) {
                    setQuartier(found.quartiers[0]);
                  }
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Quartier / zone précise
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.quartierMax}
                list="publish-quartier-list"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                placeholder="Ex. Tankpè, Dantokpa"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
              />
              <datalist id="publish-quartier-list">
                {(communeObj ? communeObj.quartiers : []).map((q) => (
                  <option key={q} value={q} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Ajout de localisation GPS pour calculer la distance avec les autres agents */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-[#111111]">
                  Ma localisation pour l&apos;annonce
                </div>
                <p className="text-[11px] text-gray-600">
                  Permet aux autres agents de voir votre position et la distance exacte qui vous
                  sépare.
                </p>
              </div>
              {pickedCoords && (
                <button
                  type="button"
                  onClick={() => setPickedCoords(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Effacer</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={locating}
                onClick={handleCaptureGps}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#004F71] text-white hover:bg-[#003a54] disabled:opacity-50 cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5 text-[#FFCB05]" />
                <span>{locating ? 'Localisation…' : 'Utiliser ma position GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMapPicker((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-300 bg-white text-[#111111] hover:bg-gray-100 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#004F71]" />
                <span>{showMapPicker ? 'Masquer la carte' : 'Placer sur la carte'}</span>
              </button>
            </div>

            {pickedCoords && (
              <div className="text-xs font-medium text-emerald-700 font-mono-num">
                Position enregistrée : {pickedCoords.lat.toFixed(5)}, {pickedCoords.lng.toFixed(5)}
              </div>
            )}

            {geoError && <div className="text-xs font-medium text-red-700">{geoError}</div>}

            {showMapPicker && (
              <div className="space-y-1.5">
                <p className="text-[11px] text-gray-500">
                  Touchez ou cliquez sur l&apos;emplacement exact de votre kiosque sur la carte :
                </p>
                <ListingLocationMap
                  mode="picker"
                  centerCoords={{ lat: communeLat, lng: communeLng }}
                  pickedCoords={pickedCoords}
                  onPickCoords={setPickedCoords}
                  heightClass="h-44"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Précisions facultatives ({details.length}/{FIELD_LIMITS.listingDetailsMax})
            </label>
            <textarea
              rows={2}
              maxLength={FIELD_LIMITS.listingDetailsMax}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Horaires de votre kiosque MTN MoMo ou modalités d'échange, sans donnée confidentielle."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#111111] text-xs leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#004F71]" />
            <span>
              Ne saisissez jamais de code PIN MoMo, code OTP, mot de passe ou identifiant secret.
            </span>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-[#111111] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Publication…' : "Publier sur MTN MoMo Bénin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
