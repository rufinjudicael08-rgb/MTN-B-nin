import React, { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  LogIn,
  MessageSquare,
  PhoneCall,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { FIELD_LIMITS, containsSensitiveSecret } from '../data/beninGeo';
import { AgentPrivateContact, ChatMessage, Conversation } from '../types';

interface MessagingViewProps {
  isAuthenticated: boolean;
  currentUid?: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  privateContact: AgentPrivateContact | null;
  onSelectConversation: (conversationId: string) => void;
  onSendMessage: (conversation: Conversation, body: string) => Promise<void>;
  onShareWhatsapp: (conversation: Conversation) => Promise<void>;
  onSignIn: () => void;
  onOpenProfileModal: () => void;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  isAuthenticated,
  currentUid,
  conversations,
  activeConversationId,
  messages,
  privateContact,
  onSelectConversation,
  onSendMessage,
  onShareWhatsapp,
  onSignIn,
  onOpenProfileModal,
}) => {
  const [draft, setDraft] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sharingWa, setSharingWa] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeConversation?.id]);

  if (!isAuthenticated) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center space-y-4">
        <MessageSquare className="w-8 h-8 mx-auto text-[#004F71]" />
        <h1 className="text-xl font-bold font-display text-[#111111]">
          Messagerie directe entre agents MTN MoMo
        </h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Connectez-vous avec votre numéro (+229), votre adresse e-mail ou Google pour discuter en
          temps réel avec les agents du Bénin et protéger votre WhatsApp.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Connexion / Créer un compte</span>
        </button>
      </section>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    setError('');
    const text = draft.trim();
    if (!text) return;
    if (text.length > FIELD_LIMITS.messageMax) {
      setError(`Message limité à ${FIELD_LIMITS.messageMax} caractères.`);
      return;
    }
    if (containsSensitiveSecret(text)) {
      setError('Sécurité : ne partagez jamais de code PIN, OTP ou mot de passe dans le chat.');
      return;
    }
    setSending(true);
    try {
      await onSendMessage(activeConversation, text);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec d'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const handleShareWhatsapp = async () => {
    if (!activeConversation) return;
    if (!privateContact?.whatsapp) {
      onOpenProfileModal();
      return;
    }
    setSharingWa(true);
    try {
      await onShareWhatsapp(activeConversation);
    } finally {
      setSharingWa(false);
    }
  };

  const isInitiator = activeConversation && currentUid === activeConversation.initiatorId;
  const peerName = activeConversation
    ? isInitiator
      ? activeConversation.recipientName
      : activeConversation.initiatorName
    : '';
  const peerWhatsapp = activeConversation
    ? isInitiator
      ? activeConversation.recipientWhatsapp
      : activeConversation.initiatorWhatsapp
    : undefined;
  const mySharedWhatsapp = activeConversation
    ? isInitiator
      ? activeConversation.initiatorWhatsapp
      : activeConversation.recipientWhatsapp
    : undefined;

  const cleanWaDigits = peerWhatsapp ? peerWhatsapp.replace(/[^0-9]/g, '') : '';
  const waHref = cleanWaDigits
    ? `https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
        `Bonjour ${peerName}, suite à notre échange sur MTN MoMo Connect Bénin (${activeConversation?.listingSummary || 'liquidité'}).`,
      )}`
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[540px]">
      <aside className="lg:col-span-4 rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 bg-[#004F71] text-white">
          <h1 className="text-base font-extrabold font-display">
            Discussions en cours ({conversations.length})
          </h1>
          <p className="text-xs text-white/80 mt-0.5">
            Vos échanges restent privés entre les deux agents.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-600 leading-relaxed">
            Aucune discussion ouverte. Cliquez sur « Contacter l'agent » depuis une annonce ou
            l'annuaire pour démarrer un échange.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-y-auto">
            {conversations.map((conv) => {
              const otherName =
                currentUid === conv.initiatorId ? conv.recipientName : conv.initiatorName;
              const isSelected = activeConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left px-5 py-3.5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#FFFBEB]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#111111] truncate">{otherName}</span>
                    <span className="text-[11px] font-mono-num text-gray-500 shrink-0">
                      {conv.updatedAt
                        ? conv.updatedAt.toDate().toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#004F71] truncate mt-0.5">
                    {conv.listingSummary}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">{conv.lastMessage}</div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="lg:col-span-8 rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500">
            Sélectionnez une conversation pour afficher les messages.
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold font-display text-[#111111]">
                  {peerName}
                </h2>
                <p className="text-xs text-gray-600">
                  Objet : {activeConversation.listingSummary}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!mySharedWhatsapp ? (
                  <button
                    type="button"
                    disabled={sharingWa}
                    onClick={handleShareWhatsapp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-[#111111] cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#004F71]" />
                    <span>
                      {privateContact?.whatsapp
                        ? 'Partager mon WhatsApp (+229)'
                        : 'Ajouter mon WhatsApp'}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700">
                    WhatsApp partagé ({mySharedWhatsapp})
                  </span>
                )}

                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 whitespace-nowrap"
                  >
                    <span>Ouvrir WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="px-5 py-2.5 bg-[#FFFBEB] border-b border-[#FDE68A] text-[#111111] text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#004F71]" />
              <span>
                Vigilance : ne communiquez aucun code PIN MoMo, OTP ou mot de passe.
              </span>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[380px] bg-gray-50/70">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUid;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-[#004F71] text-white'
                          : 'bg-white border border-gray-200 text-[#111111]'
                      }`}
                    >
                      <p>{msg.body}</p>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1 px-1">
                      {msg.senderName}
                      {msg.createdAt
                        ? ` · ${msg.createdAt.toDate().toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ''}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-gray-200 bg-white space-y-2"
            >
              {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.messageMax}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrivez votre message (lieu de rencontre, disponibilité…)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFCB05]"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black font-display bg-[#FFCB05] text-[#111111] hover:bg-[#f2bd00] disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
};
