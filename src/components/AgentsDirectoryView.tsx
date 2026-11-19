import React, { useMemo, useState } from 'react';
import { BadgeCheck, Flag, MessageSquare, Search, Shield, UserCheck } from 'lucide-react';
import { BENIN_COMMUNES, VERIFICATION_LABELS } from '../data/beninGeo';
import { AgentPublic, VerificationLevel } from '../types';
import { BeninFlag } from './MtnBrandMarks';

interface AgentsDirectoryViewProps {
  agents: AgentPublic[];
  loading: boolean;
  currentUid?: string;
  onContactAgent: (agent: AgentPublic) => void;
  onReportAgent: (agent: AgentPublic) => void;
  onOpenProfileModal: () => void;
}

export const AgentsDirectoryView: React.FC<AgentsDirectoryViewProps> = ({
  agents,
  loading,
  currentUid,
  onContactAgent,
  onReportAgent,
  onOpenProfileModal,
}) => {
  const [communeFilter, setCommuneFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<VerificationLevel | 'all'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agents.filter((agent) => {
      if (!agent.operators.includes('MTN MoMo')) return false;
      if (communeFilter && agent.commune !== communeFilter) return false;
      if (levelFilter !== 'all' && agent.verificationLevel !== levelFilter) return false;
      if (onlyAvailable && !agent.isAvailable) return false;
      if (
        q &&
        !agent.businessName.toLowerCase().includes(q) &&
        !agent.quartier.toLowerCase().includes(q) &&
        !agent.commune.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [agents, communeFilter, levelFilter, onlyAvailable, searchQuery]);

  const renderVerificationIcon = (level: VerificationLevel) => {
    if (level === 'certified') {
      return <BadgeCheck className="w-4 h-4 text-[#004F71] shrink-0" />;
    }
    if (level === 'community') {
      return <UserCheck className="w-4 h-4 text-[#111111] shrink-0" />;
    }
    return <Shield className="w-4 h-4 text-gray-500 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#004F71]">
            <BeninFlag className="w-4 h-3" />
            <span>Annuaire officiel · Agents MTN MoMo Bénin</span>
          </div>
          <h1 className="text-2xl font-black font-display text-[#111111]">
            Points de service MTN MoMo au Bénin
          </h1>
          <p className="text-sm text-gray-600">
            Consultez les agents MTN MoMo inscrits par commune et leur niveau de vérification. Les
            numéros WhatsApp restent privés jusqu'à l'accord mutuel.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenProfileModal}
          className="px-4 py-2.5 rounded-xl text-xs font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Mon profil agent
        </button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nom ou quartier
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex. Akpakpa, Kiosque…"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Commune (Bénin)
            </label>
            <select
              value={communeFilter}
              onChange={(e) => setCommuneFilter(e.target.value)}
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
              Niveau de vérification
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as VerificationLevel | 'all')}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
            >
              <option value="all">Tous les niveaux</option>
              <option value="certified">Agent certifié</option>
              <option value="community">Vérifié communauté</option>
              <option value="standard">Profil standard</option>
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#111111] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span>Disponibles uniquement</span>
            </label>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl border border-gray-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center space-y-3">
          <h2 className="text-base font-bold text-[#111111]">
            Aucun agent MTN MoMo enregistré ne correspond à votre recherche
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Inscrivez votre point de service pour apparaître dans l'annuaire MTN MoMo Bénin et
            recevoir des demandes de liquidité.
          </p>
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="px-4 py-2 rounded-xl text-xs font-black font-display bg-[#FFCB05] text-[#111111] cursor-pointer"
          >
            Inscrire mon point de service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const isOwn = currentUid === agent.uid;
            const verificationInfo = VERIFICATION_LABELS[agent.verificationLevel];
            return (
              <article
                key={agent.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div className="h-1 w-full bg-[#FFCB05]" />
                <div className="p-5 space-y-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-base font-extrabold font-display text-[#111111] truncate">
                        {agent.businessName}
                        {isOwn ? ' (Vous)' : ''}
                      </h2>
                      <p className="text-xs font-medium text-[#004F71] mt-0.5">
                        {agent.quartier}, {agent.commune}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] whitespace-nowrap shrink-0">
                      {renderVerificationIcon(agent.verificationLevel)}
                      <span>{verificationInfo.label}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#111111]">
                      <span
                        className="w-2 h-2 rounded-xs bg-[#FFCB05] border border-[#111111]"
                        aria-hidden="true"
                      />
                      MTN MoMo
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        agent.isAvailable ? 'text-emerald-700 font-semibold' : 'text-gray-500'
                      }
                    >
                      {agent.isAvailable ? 'Ouvert aux échanges' : 'Indisponible'}
                    </span>
                  </div>

                  {agent.bio && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{agent.bio}</p>
                  )}
                </div>

                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
                  {isOwn ? (
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-gray-300 bg-white text-[#111111] cursor-pointer"
                    >
                      Gérer ma fiche
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onContactAgent(agent)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#004F71] text-white hover:bg-[#003a54] cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contacter</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onReportAgent(agent)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#111111] hover:bg-gray-100 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Signaler</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
