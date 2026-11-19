import React, { useMemo, useState } from 'react';
import { BarChart3, MapPin } from 'lucide-react';
import { BENIN_COMMUNES, formatFcfa } from '../data/beninGeo';
import { AgentPublic, LiquidityListing, LiquidityType } from '../types';
import { BeninFlag } from './MtnBrandMarks';

interface BeninAnalyticsViewProps {
  listings: LiquidityListing[];
  agents: AgentPublic[];
}

const LIQUIDITY_TYPES: { key: LiquidityType; label: string; color: string }[] = [
  { key: 'cash', label: 'Cash physique (FCFA)', color: '#FFCB05' },
  { key: 'uv', label: 'UV / Float MTN MoMo', color: '#004F71' },
  { key: 'both', label: 'Échange mixte (Cash ↔ UV)', color: '#111111' },
];

export const BeninAnalyticsView: React.FC<BeninAnalyticsViewProps> = ({ listings, agents }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const momoListings = useMemo(
    () => listings.filter((l) => l.operator === 'MTN MoMo' && l.status === 'active'),
    [listings],
  );
  const momoAgents = useMemo(
    () => agents.filter((a) => a.operators.includes('MTN MoMo')),
    [agents],
  );

  const departments = useMemo(
    () => Array.from(new Set(BENIN_COMMUNES.map((c) => c.department))),
    [],
  );

  const typeBreakdown = useMemo(() => {
    return LIQUIDITY_TYPES.map((t) => {
      const items = momoListings.filter((l) => l.liquidityType === t.key);
      const offerSum = items
        .filter((l) => l.intent === 'offer')
        .reduce((s, l) => s + l.amount, 0);
      const requestSum = items
        .filter((l) => l.intent === 'request')
        .reduce((s, l) => s + l.amount, 0);
      return {
        ...t,
        count: items.length,
        offerSum,
        requestSum,
        totalVolume: offerSum + requestSum,
      };
    });
  }, [momoListings]);

  const maxTypeVolume = Math.max(
    1,
    ...typeBreakdown.map((o) => Math.max(o.offerSum, o.requestSum)),
  );

  const communeStats = useMemo(() => {
    const communesList =
      selectedDepartment === 'all'
        ? BENIN_COMMUNES
        : BENIN_COMMUNES.filter((c) => c.department === selectedDepartment);

    return communesList.map((commune) => {
      const cListings = momoListings.filter((l) => l.commune === commune.name);
      const cAgents = momoAgents.filter((a) => a.commune === commune.name);
      const offers = cListings
        .filter((l) => l.intent === 'offer')
        .reduce((s, l) => s + l.amount, 0);
      const requests = cListings
        .filter((l) => l.intent === 'request')
        .reduce((s, l) => s + l.amount, 0);

      return {
        ...commune,
        listingsCount: cListings.length,
        agentsCount: cAgents.length,
        offers,
        requests,
      };
    });
  }, [momoListings, momoAgents, selectedDepartment]);

  const grandTotalVolume = typeBreakdown.reduce((s, o) => s + o.totalVolume, 0);
  const certifiedCount = momoAgents.filter((a) => a.verificationLevel === 'certified').length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#004F71]">
          <BeninFlag className="w-5 h-3.5" />
          <span>Analyse exclusive · République du Bénin (MTN MoMo)</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black font-display text-[#111111]">
              Liquidité MTN MoMo par commune au Bénin
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Suivi en temps réel des volumes déclarés en FCFA par type de liquidité et par pôle
              béninois.
            </p>
          </div>
          <div className="flex items-center gap-6 text-right shrink-0">
            <div>
              <div className="text-xs text-gray-500">Volume actif Bénin</div>
              <div className="text-lg font-black font-mono-num text-[#111111]">
                {formatFcfa(grandTotalVolume)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Agents certifiés</div>
              <div className="text-lg font-black font-mono-num text-[#004F71]">
                {certifiedCount} / {momoAgents.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Répartition Cash vs UV MTN MoMo */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#004F71]" />
          <h2 className="text-lg font-extrabold font-display text-[#111111]">
            Équilibre Cash physique et UV MTN MoMo
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {typeBreakdown.map((item) => {
            const offerPct = Math.round((item.offerSum / maxTypeVolume) * 100);
            const requestPct = Math.round((item.requestSum / maxTypeVolume) * 100);
            return (
              <div
                key={item.key}
                className="rounded-xl border border-gray-200 bg-[#FFFDF7] p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#111111]">{item.label}</span>
                  <span className="text-xs font-mono-num text-gray-500">
                    {item.count} annonces
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Offres disponibles</span>
                      <span className="font-bold font-mono-num text-[#111111]">
                        {formatFcfa(item.offerSum)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-[#FFCB05]"
                        style={{
                          width: `${Math.max(item.offerSum > 0 ? 6 : 0, offerPct)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Besoins recherchés</span>
                      <span className="font-bold font-mono-num text-[#004F71]">
                        {formatFcfa(item.requestSum)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-[#004F71]"
                        style={{
                          width: `${Math.max(item.requestSum > 0 ? 6 : 0, requestPct)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tableau des 12 communes béninoises */}
      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#004F71]" />
            <div>
              <h2 className="text-lg font-extrabold font-display text-[#111111]">
                Couverture des communes et quartiers du Bénin
              </h2>
              <p className="text-xs text-gray-500">
                Données strictement limitées aux pôles urbains et marchands du Bénin.
              </p>
            </div>
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            aria-label="Filtrer par département du Bénin"
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
          >
            <option value="all">Tous les départements ({BENIN_COMMUNES.length} pôles)</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                Département : {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FFFBEB] text-xs text-gray-700">
                <th className="py-3 px-5 font-bold">Commune</th>
                <th className="py-3 px-4 font-bold">Département</th>
                <th className="py-3 px-4 font-bold">Quartiers couverts</th>
                <th className="py-3 px-4 font-bold text-right">Agents MoMo</th>
                <th className="py-3 px-4 font-bold text-right">Annonces</th>
                <th className="py-3 px-4 font-bold text-right">Offres (FCFA)</th>
                <th className="py-3 px-5 font-bold text-right">Besoins (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {communeStats.map((row) => (
                <tr key={row.name} className="hover:bg-[#FFFDF7]">
                  <td className="py-3.5 px-5 font-bold text-[#111111] whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                    {row.department}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs">
                    {row.quartiers.slice(0, 5).join(', ')}
                    {row.quartiers.length > 5 ? ` (+${row.quartiers.length - 5})` : ''}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#111111]">
                    {row.agentsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num text-gray-600">
                    {row.listingsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-bold text-[#111111] whitespace-nowrap">
                    {formatFcfa(row.offers)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono-num text-[#004F71] font-semibold whitespace-nowrap">
                    {formatFcfa(row.requests)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
