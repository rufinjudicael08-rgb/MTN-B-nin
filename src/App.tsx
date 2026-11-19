import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Smartphone, X } from 'lucide-react';
import { AgentProfileModal } from './components/AgentProfileModal';
import { AgentsDirectoryView } from './components/AgentsDirectoryView';
import { AlertsModal, doesListingMatchRule } from './components/AlertsModal';
import { AuthModal } from './components/AuthModal';
import { BeninAnalyticsView } from './components/BeninAnalyticsView';
import { BottomFloatingBackdrop } from './components/BottomFloatingBackdrop';
import { ListingsView } from './components/ListingsView';
import { MessagingView } from './components/MessagingView';
import { BeninFlag, MtnMomoEmblem } from './components/MtnBrandMarks';
import { NetworkSwitcherBar } from './components/NetworkSwitcherBar';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PublishListingModal } from './components/PublishListingModal';
import { ReportModal } from './components/ReportModal';
import { FIELD_LIMITS, formatFcfa } from './data/beninGeo';
import {
  ADMIN_EMAIL,
  FCM_VAPID_KEY,
  FcmRegistrationResult,
  OperationType,
  auth,
  db,
  handleFirestoreError,
  registerFcmTokenForUser,
  showBrowserNotification,
  subscribeForegroundFcm,
} from './firebase';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { useI18n } from './i18n/I18nContext';
import {
  AgentNotification,
  AgentPrivateContact,
  AgentPublic,
  AlertRule,
  AppTab,
  ChatMessage,
  Conversation,
  FavoriteAgent,
  FcmToken,
  LiquidityListing,
  LiquidityType,
  ListingIntent,
  OperatorName,
  ReportItem,
  VerificationRequest,
} from './types';

export default function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<AppTab>('listings');

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [agentProfile, setAgentProfile] = useState<AgentPublic | null>(null);
  const [privateContact, setPrivateContact] = useState<AgentPrivateContact | null>(null);

  const [listings, setListings] = useState<LiquidityListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState<boolean>(true);
  const [agents, setAgents] = useState<AgentPublic[]>([]);
  const [agentsLoading, setAgentsLoading] = useState<boolean>(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [myVerificationRequests, setMyVerificationRequests] = useState<VerificationRequest[]>([]);
  const [adminVerificationRequests, setAdminVerificationRequests] = useState<VerificationRequest[]>(
    [],
  );
  const [adminReports, setAdminReports] = useState<ReportItem[]>([]);

  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [fcmTokens, setFcmTokens] = useState<FcmToken[]>([]);
  const [fcmStatus, setFcmStatus] = useState<FcmRegistrationResult | null>(null);
  const [favorites, setFavorites] = useState<FavoriteAgent[]>([]);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [installDismissed, setInstallDismissed] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'listing' | 'agent';
    id: string;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<string>('');

  const userRef = useRef<User | null>(null);
  const alertRulesRef = useRef<AlertRule[]>([]);
  const notificationsRef = useRef<AgentNotification[]>([]);
  const initialListingsLoadedRef = useRef<boolean>(false);
  const knownListingIdsRef = useRef<Set<string>>(new Set());

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const isAdmin = useMemo(
    () => Boolean(user && user.emailVerified && user.email === ADMIN_EMAIL),
    [user],
  );

  const unreadAlertsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const favoriteIds = useMemo(
    () => new Set(favorites.map((fav) => fav.favoriteAgentId)),
    [favorites],
  );

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    alertRulesRef.current = alertRules;
  }, [alertRules]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((current) => (current === msg ? '' : current));
    }, 4500);
  }, []);

  const persistMatchedNotification = useCallback(
    async (uid: string, listing: LiquidityListing): Promise<boolean> => {
      if (notificationsRef.current.some((n) => n.id === listing.id)) {
        return false;
      }
      const title = `${listing.intent === 'offer' ? 'Offre' : 'Besoin'} ${listing.authorName}`
        .trim()
        .slice(0, 100);
      const liqLabel =
        listing.liquidityType === 'cash'
          ? 'Cash'
          : listing.liquidityType === 'uv'
            ? 'UV / Float'
            : 'Cash & UV';
      const body = `${liqLabel} · ${listing.details || `${listing.quartier}, ${listing.commune}`}`
        .trim()
        .slice(0, 220);

      const notifPath = `agents_public/${uid}/notifications/${listing.id}`;
      try {
        await setDoc(doc(db, 'agents_public', uid, 'notifications', listing.id), {
          recipientId: uid,
          listingId: listing.id,
          title: title.length >= 2 ? title : 'Alerte MTN MoMo',
          body: body.length >= 2 ? body : `${listing.quartier}, ${listing.commune}`,
          commune: listing.commune.slice(0, FIELD_LIMITS.communeMax),
          quartier: listing.quartier.slice(0, FIELD_LIMITS.quartierMax),
          amount: listing.amount,
          intent: listing.intent,
          read: false,
          createdAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, notifPath);
      }
    },
    [],
  );

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // 2. Public Real-Time Listeners (Listings & Agents Directory)
  useEffect(() => {
    const listingsPath = 'listings';
    const qListings = query(
      collection(db, listingsPath),
      where('status', '==', 'active'),
      limit(150),
    );
    const unsubListings = onSnapshot(
      qListings,
      (snap) => {
        const items: LiquidityListing[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<LiquidityListing, 'id'>) }))
          .filter((l) => l.operator === 'MTN MoMo')
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });

        if (!initialListingsLoadedRef.current) {
          knownListingIdsRef.current = new Set(items.map((l) => l.id));
          initialListingsLoadedRef.current = true;
        } else {
          const currentUser = userRef.current;
          const activeRules = alertRulesRef.current;

          for (const listing of items) {
            if (!knownListingIdsRef.current.has(listing.id)) {
              knownListingIdsRef.current.add(listing.id);
              if (
                currentUser &&
                (currentUser.emailVerified || currentUser.phoneNumber) &&
                listing.authorId !== currentUser.uid &&
                activeRules.some((rule) => doesListingMatchRule(listing, rule))
              ) {
                void persistMatchedNotification(currentUser.uid, listing).then((created) => {
                  if (!created) return;
                  const alertTitle = `Alerte MTN MoMo · ${formatFcfa(listing.amount)}`;
                  const alertBody = `${listing.intent === 'offer' ? 'Offre' : 'Besoin'} à ${listing.quartier}, ${listing.commune} (${listing.authorName})`;
                  showToast(`${alertTitle} — ${listing.quartier}, ${listing.commune}`);
                  void showBrowserNotification(alertTitle, alertBody, listing.id);
                });
              }
            }
          }
        }

        setListings(items);
        setListingsLoading(false);
      },
      (err) => {
        setListingsLoading(false);
        handleFirestoreError(err, OperationType.LIST, listingsPath);
      },
    );

    const agentsPath = 'agents_public';
    const qAgents = query(
      collection(db, agentsPath),
      where('isPublic', '==', true),
      limit(150),
    );
    const unsubAgents = onSnapshot(
      qAgents,
      (snap) => {
        const items: AgentPublic[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AgentPublic, 'id'>) }))
          .filter((a) => a.operators.includes('MTN MoMo'))
          .sort((a, b) => a.businessName.localeCompare(b.businessName, 'fr'));
        setAgents(items);
        setAgentsLoading(false);
      },
      (err) => {
        setAgentsLoading(false);
        handleFirestoreError(err, OperationType.LIST, agentsPath);
      },
    );

    return () => {
      unsubListings();
      unsubAgents();
    };
  }, [persistMatchedNotification, showToast]);

  // 3. Authenticated User Profile, Private Contact, Conversations, Verification & Alerts
  useEffect(() => {
    if (!user) {
      setAgentProfile(null);
      setPrivateContact(null);
      setConversations([]);
      setMyVerificationRequests([]);
      setAdminVerificationRequests([]);
      setAdminReports([]);
      setAlertRules([]);
      setNotifications([]);
      setFcmTokens([]);
      setFcmStatus(null);
      setFavorites([]);
      return;
    }

    const profilePath = `agents_public/${user.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'agents_public', user.uid),
      (snap) => {
        if (snap.exists()) {
          setAgentProfile({ id: snap.id, ...(snap.data() as Omit<AgentPublic, 'id'>) });
        } else {
          setAgentProfile(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, profilePath),
    );

    const contactPath = `agents_public/${user.uid}/private/contact`;
    const unsubContact = onSnapshot(
      doc(db, 'agents_public', user.uid, 'private', 'contact'),
      (snap) => {
        if (snap.exists()) {
          setPrivateContact(snap.data() as AgentPrivateContact);
        } else {
          setPrivateContact(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, contactPath),
    );

    const convPath = 'conversations';
    const qConv = query(
      collection(db, convPath),
      where('participantIds', 'array-contains', user.uid),
      limit(50),
    );
    const unsubConvs = onSnapshot(
      qConv,
      (snap) => {
        const items: Conversation[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) }))
          .sort((a, b) => {
            const ta = a.updatedAt?.toMillis?.() ?? 0;
            const tb = b.updatedAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setConversations(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, convPath),
    );

    const reqPath = 'verification_requests';
    const qMyReqs = query(
      collection(db, reqPath),
      where('agentId', '==', user.uid),
      limit(20),
    );
    const unsubMyReqs = onSnapshot(
      qMyReqs,
      (snap) => {
        const items: VerificationRequest[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<VerificationRequest, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setMyVerificationRequests(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, reqPath),
    );

    const rulesPath = `agents_public/${user.uid}/alert_rules`;
    const unsubRules = onSnapshot(
      query(collection(db, 'agents_public', user.uid, 'alert_rules'), limit(30)),
      (snap) => {
        const items: AlertRule[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AlertRule, 'id'>) }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setAlertRules(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, rulesPath),
    );

    const notifsPath = `agents_public/${user.uid}/notifications`;
    const unsubNotifs = onSnapshot(
      query(collection(db, 'agents_public', user.uid, 'notifications'), limit(50)),
      (snap) => {
        const items: AgentNotification[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AgentNotification, 'id'>) }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setNotifications(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, notifsPath),
    );

    const tokensPath = `agents_public/${user.uid}/fcm_tokens`;
    const unsubTokens = onSnapshot(
      query(collection(db, 'agents_public', user.uid, 'fcm_tokens'), limit(10)),
      (snap) => {
        const items: FcmToken[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FcmToken, 'id'>),
        }));
        setFcmTokens(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, tokensPath),
    );

    const favsPath = `agents_public/${user.uid}/favorites`;
    const unsubFavorites = onSnapshot(
      query(collection(db, 'agents_public', user.uid, 'favorites'), limit(50)),
      (snap) => {
        const items: FavoriteAgent[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<FavoriteAgent, 'id'>) }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setFavorites(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, favsPath),
    );

    let unsubFcmForeground = () => {};
    void subscribeForegroundFcm((payload) => {
      const title =
        payload.notification?.title || payload.data?.title || 'Nouvelle alerte MTN MoMo Bénin';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        'Une nouvelle annonce correspond à votre veille.';
      showToast(`${title} — ${body}`);
      void showBrowserNotification(title, body, payload.data?.listingId || 'mtn-momo-fcm');
    }).then((unsub) => {
      unsubFcmForeground = unsub;
    });

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      FCM_VAPID_KEY
    ) {
      void registerFcmTokenForUser(user.uid).then(setFcmStatus);
    }

    return () => {
      unsubProfile();
      unsubContact();
      unsubConvs();
      unsubMyReqs();
      unsubRules();
      unsubNotifs();
      unsubTokens();
      unsubFavorites();
      unsubFcmForeground();
    };
  }, [user, showToast]);

  // 4. Admin Listeners
  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubVerifs = onSnapshot(
      query(collection(db, 'verification_requests'), limit(50)),
      (snap) => {
        setAdminVerificationRequests(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VerificationRequest, 'id'>) })),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'verification_requests'),
    );

    const unsubReports = onSnapshot(
      query(collection(db, 'reports'), limit(50)),
      (snap) => {
        setAdminReports(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportItem, 'id'>) })),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports'),
    );

    return () => {
      unsubVerifs();
      unsubReports();
    };
  }, [user, isAdmin]);

  // 5. Active Conversation Messages Listener
  useEffect(() => {
    const selectedId = activeConversationId || conversations[0]?.id || null;
    if (!user || !selectedId) {
      setMessages([]);
      return;
    }

    const msgPath = `conversations/${selectedId}/messages`;
    const qMsgs = query(
      collection(db, msgPath),
      where('participantIds', 'array-contains', user.uid),
      limit(100),
    );
    const unsub = onSnapshot(
      qMsgs,
      (snap) => {
        const items: ChatMessage[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return ta - tb;
          });
        setMessages(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, msgPath),
    );

    return unsub;
  }, [user, activeConversationId, conversations]);

  const handleSignIn = async () => {
    setIsAuthOpen(true);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveTab('listings');
    showToast('Vous êtes déconnecté.');
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallDismissed(true);
        showToast('Application installée sur votre appareil.');
      }
      return;
    }
    setIsInstallOpen(true);
  };

  const ensureSignedInAndProfile = async (): Promise<boolean> => {
    if (!user) {
      setIsAuthOpen(true);
      return false;
    }
    if (!user.emailVerified && !user.phoneNumber) {
      setIsAuthOpen(true);
      showToast("Confirmez d'abord votre adresse e-mail ou votre numéro de téléphone.");
      return false;
    }
    if (!agentProfile) {
      setIsProfileOpen(true);
      showToast("Complétez d'abord votre profil agent MTN MoMo Bénin.");
      return false;
    }
    return true;
  };

  const handleOpenPublish = async () => {
    const ready = await ensureSignedInAndProfile();
    if (ready) setIsPublishOpen(true);
  };

  const handleSaveProfile = async (payload: {
    businessName: string;
    commune: string;
    quartier: string;
    operators: OperatorName[];
    isAvailable: boolean;
    bio: string;
    whatsapp: string;
  }) => {
    if (!user) return;
    const publicRef = doc(db, 'agents_public', user.uid);
    const contactRef = doc(db, 'agents_public', user.uid, 'private', 'contact');

    try {
      if (!agentProfile) {
        await setDoc(publicRef, {
          uid: user.uid,
          businessName: payload.businessName,
          commune: payload.commune,
          quartier: payload.quartier,
          operators: ['MTN MoMo'],
          verificationLevel: 'standard',
          isAvailable: payload.isAvailable,
          isPublic: true,
          bio: payload.bio,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(publicRef, {
          businessName: payload.businessName,
          commune: payload.commune,
          quartier: payload.quartier,
          operators: ['MTN MoMo'],
          isAvailable: payload.isAvailable,
          bio: payload.bio,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `agents_public/${user.uid}`);
    }

    try {
      if (!privateContact) {
        await setDoc(contactRef, {
          uid: user.uid,
          whatsapp: payload.whatsapp,
          email: user.email || '',
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(contactRef, {
          whatsapp: payload.whatsapp,
          email: user.email || privateContact.email,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `agents_public/${user.uid}/private/contact`,
      );
    }

    showToast('Profil agent MTN MoMo enregistré.');
  };

  const handlePublishListing = async (payload: {
    intent: ListingIntent;
    liquidityType: LiquidityType;
    operator: OperatorName;
    amount: number;
    commune: string;
    quartier: string;
    details: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!user || !agentProfile) return;
    const hasValidCoords =
      typeof payload.latitude === 'number' &&
      Number.isFinite(payload.latitude) &&
      typeof payload.longitude === 'number' &&
      Number.isFinite(payload.longitude);
    try {
      await addDoc(collection(db, 'listings'), {
        authorId: user.uid,
        authorName: agentProfile.businessName,
        authorVerification: agentProfile.verificationLevel,
        intent: payload.intent,
        liquidityType: payload.liquidityType,
        operator: 'MTN MoMo',
        amount: payload.amount,
        commune: payload.commune,
        quartier: payload.quartier,
        details: payload.details,
        ...(hasValidCoords
          ? { latitude: payload.latitude, longitude: payload.longitude }
          : {}),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Annonce MTN MoMo publiée en temps réel.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'listings');
    }
  };

  const handleUpdateListingStatus = async (
    listing: LiquidityListing,
    status: 'matched' | 'closed',
  ) => {
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(status === 'closed' ? 'Annonce clôturée.' : 'Statut mis à jour.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `listings/${listing.id}`);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      showToast('Annonce supprimée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
    }
  };

  const startConversation = async (params: {
    recipientId: string;
    recipientName: string;
    listingId: string;
    listingSummary: string;
  }) => {
    const ready = await ensureSignedInAndProfile();
    if (!ready || !user || !agentProfile) return;
    if (params.recipientId === user.uid) {
      showToast('Ceci est votre propre fiche.');
      return;
    }

    const sortedIds = [user.uid, params.recipientId].sort();
    const convId = `${sortedIds[0]}_${sortedIds[1]}`;
    const existingConv = conversations.find((c) => c.id === convId);

    if (existingConv) {
      setActiveConversationId(convId);
      setActiveTab('messages');
      return;
    }

    const initialMessage = `Bonjour ${params.recipientName}, je vous contacte au sujet de : ${params.listingSummary}.`;

    try {
      await setDoc(doc(db, 'conversations', convId), {
        participantIds: sortedIds,
        initiatorId: user.uid,
        recipientId: params.recipientId,
        initiatorName: agentProfile.businessName,
        recipientName: params.recipientName,
        listingId: params.listingId,
        listingSummary: params.listingSummary.slice(0, 120),
        lastMessage: initialMessage.slice(0, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        senderId: user.uid,
        senderName: agentProfile.businessName,
        participantIds: sortedIds,
        body: initialMessage.slice(0, 500),
        createdAt: serverTimestamp(),
      });

      setActiveConversationId(convId);
      setActiveTab('messages');
      showToast('Conversation ouverte avec l’agent.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${convId}`);
    }
  };

  const handleSendMessage = async (conversation: Conversation, body: string) => {
    if (!user || !agentProfile) return;
    const convRef = doc(db, 'conversations', conversation.id);
    try {
      await addDoc(collection(db, 'conversations', conversation.id, 'messages'), {
        senderId: user.uid,
        senderName: agentProfile.businessName,
        participantIds: conversation.participantIds,
        body,
        createdAt: serverTimestamp(),
      });
      await updateDoc(convRef, {
        lastMessage: body.slice(0, 300),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `conversations/${conversation.id}/messages`,
      );
    }
  };

  const handleShareWhatsapp = async (conversation: Conversation) => {
    if (!user || !privateContact?.whatsapp) return;
    const isInitiator = conversation.initiatorId === user.uid;
    try {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        ...(isInitiator
          ? { initiatorWhatsapp: privateContact.whatsapp }
          : { recipientWhatsapp: privateContact.whatsapp }),
        updatedAt: serverTimestamp(),
      });
      showToast('Votre numéro WhatsApp a été partagé pour cette conversation.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversation.id}`);
    }
  };

  const handleRequestVerification = async (payload: {
    requestedLevel: 'community' | 'certified';
    referenceNote: string;
  }) => {
    if (!user || !agentProfile) return;
    try {
      await addDoc(collection(db, 'verification_requests'), {
        agentId: user.uid,
        businessName: agentProfile.businessName,
        requestedLevel: payload.requestedLevel,
        commune: agentProfile.commune,
        referenceNote: payload.referenceNote,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Demande de vérification envoyée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'verification_requests');
    }
  };

  const handleModerateVerification = async (
    req: VerificationRequest,
    decision: 'approved' | 'rejected',
  ) => {
    try {
      await updateDoc(doc(db, 'verification_requests', req.id), {
        status: decision,
        updatedAt: serverTimestamp(),
      });
      if (decision === 'approved') {
        await updateDoc(doc(db, 'agents_public', req.agentId), {
          verificationLevel: req.requestedLevel,
          updatedAt: serverTimestamp(),
        });
      }
      showToast(decision === 'approved' ? 'Agent vérifié avec succès.' : 'Demande refusée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `verification_requests/${req.id}`);
    }
  };

  const handleSubmitReport = async (payload: {
    targetType: 'listing' | 'agent';
    targetId: string;
    reason: string;
    details: string;
  }) => {
    if (!user) {
      await handleSignIn();
      return;
    }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reason: payload.reason,
        details: payload.details,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      showToast('Signalement enregistré. Merci pour votre vigilance.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      showToast('Signalement clôturé.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleEnablePush = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notifications navigateur indisponibles dans cet environnement.');
      return;
    }

    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== 'granted') {
      setFcmStatus({ status: 'denied' });
      showToast('Autorisation de notification refusée ou bloquée.');
      return;
    }

    const result = await registerFcmTokenForUser(user.uid);
    setFcmStatus(result);

    if (result.status === 'active') {
      showToast('Notifications push Firebase Messaging activées.');
      await showBrowserNotification(
        'Alertes MTN MoMo Bénin activées',
        'Vous recevrez les nouvelles annonces compatibles en temps réel.',
        'mtn-momo-welcome',
      );
    } else if (result.status === 'missing_vapid') {
      showToast('Alertes navigateur activées (clé VAPID requise pour le push en arrière-plan).');
      await showBrowserNotification(
        'Alertes navigateur activées',
        'Vos règles temps réel MTN MoMo Bénin sont prêtes.',
        'mtn-momo-welcome',
      );
    } else {
      showToast(result.errorMessage || 'Configuration push mise à jour.');
    }
  };

  const handleTestBrowserNotification = async () => {
    await showBrowserNotification(
      'Test alerte · MTN MoMo Bénin',
      'Exemple : Offre Cash 250 000 FCFA disponible à Dantokpa, Cotonou.',
      'mtn-momo-test',
    );
    showToast('Notification de test envoyée.');
  };

  const handleCreateAlertRule = async (payload: {
    commune: string;
    quartier: string;
    intent: 'all' | ListingIntent;
    liquidityType: 'all' | LiquidityType;
    minAmount: number;
    maxAmount: number;
  }) => {
    const ready = await ensureSignedInAndProfile();
    if (!ready || !user) return;
    const rulesPath = `agents_public/${user.uid}/alert_rules`;
    try {
      await addDoc(collection(db, 'agents_public', user.uid, 'alert_rules'), {
        agentId: user.uid,
        commune: payload.commune,
        quartier: payload.quartier,
        intent: payload.intent,
        liquidityType: payload.liquidityType,
        minAmount: payload.minAmount,
        maxAmount: payload.maxAmount,
        enabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Règle d’alerte MTN MoMo enregistrée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, rulesPath);
    }
  };

  const handleToggleAlertRule = async (rule: AlertRule) => {
    if (!user) return;
    const rulePath = `agents_public/${user.uid}/alert_rules/${rule.id}`;
    try {
      await updateDoc(doc(db, 'agents_public', user.uid, 'alert_rules', rule.id), {
        enabled: !rule.enabled,
        updatedAt: serverTimestamp(),
      });
      showToast(!rule.enabled ? 'Règle activée.' : 'Règle mise en pause.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, rulePath);
    }
  };

  const handleDeleteAlertRule = async (ruleId: string) => {
    if (!user) return;
    const rulePath = `agents_public/${user.uid}/alert_rules/${ruleId}`;
    try {
      await deleteDoc(doc(db, 'agents_public', user.uid, 'alert_rules', ruleId));
      showToast('Règle supprimée.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, rulePath);
    }
  };

  const handleScanExistingListings = async (): Promise<number> => {
    if (!user || (!user.emailVerified && !user.phoneNumber)) return 0;
    let count = 0;
    for (const listing of listings) {
      if (listing.authorId === user.uid) continue;
      if (!alertRules.some((rule) => doesListingMatchRule(listing, rule))) continue;
      const created = await persistMatchedNotification(user.uid, listing);
      if (created) count += 1;
    }
    if (count > 0) {
      showToast(`${count} annonce(s) correspondante(s) trouvée(s).`);
    }
    return count;
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    if (!user) return;
    const notifPath = `agents_public/${user.uid}/notifications/${notifId}`;
    try {
      await updateDoc(doc(db, 'agents_public', user.uid, 'notifications', notifId), {
        read: true,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, notifPath);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, 'agents_public', user.uid, 'notifications', n.id), { read: true }),
        ),
      );
      showToast('Toutes les alertes sont marquées comme lues.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `agents_public/${user.uid}/notifications`,
      );
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (!user) return;
    const notifPath = `agents_public/${user.uid}/notifications/${notifId}`;
    try {
      await deleteDoc(doc(db, 'agents_public', user.uid, 'notifications', notifId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, notifPath);
    }
  };

  const handleOpenNotificationListing = (notif: AgentNotification) => {
    if (!notif.read) {
      void handleMarkNotificationRead(notif.id);
    }
    setIsAlertsOpen(false);
    const targetListing = listings.find((l) => l.id === notif.listingId);
    if (targetListing && user && targetListing.authorId !== user.uid) {
      void startConversation({
        recipientId: targetListing.authorId,
        recipientName: targetListing.authorName,
        listingId: targetListing.id,
        listingSummary: `MTN MoMo · ${formatFcfa(targetListing.amount)} (${targetListing.quartier}, ${targetListing.commune})`,
      });
      return;
    }
    setActiveTab('listings');
    if (!targetListing) {
      showToast('Cette annonce a déjà été clôturée ou archivée.');
    }
  };

  const handleToggleFavoriteAgent = async (agent: AgentPublic) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (!user.emailVerified && !user.phoneNumber) {
      setIsAuthOpen(true);
      showToast("Confirmez d'abord votre adresse e-mail ou votre numéro de téléphone.");
      return;
    }
    if (agent.uid === user.uid) {
      showToast('Vous ne pouvez pas ajouter votre propre fiche aux favoris.');
      return;
    }

    const favPath = `agents_public/${user.uid}/favorites/${agent.uid}`;
    const alreadyFavorite = favoriteIds.has(agent.uid);
    setFavoriteBusyId(agent.uid);
    try {
      if (alreadyFavorite) {
        await deleteDoc(doc(db, 'agents_public', user.uid, 'favorites', agent.uid));
        showToast('Agent retiré de vos favoris.');
      } else {
        await setDoc(doc(db, 'agents_public', user.uid, 'favorites', agent.uid), {
          ownerId: user.uid,
          favoriteAgentId: agent.uid,
          businessName: agent.businessName.slice(0, FIELD_LIMITS.businessNameMax),
          commune: agent.commune.slice(0, FIELD_LIMITS.communeMax),
          quartier: agent.quartier.slice(0, FIELD_LIMITS.quartierMax),
          createdAt: serverTimestamp(),
        });
        showToast('Agent ajouté à vos favoris.');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        alreadyFavorite ? OperationType.DELETE : OperationType.CREATE,
        favPath,
      );
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const handleRemoveFavorite = async (favoriteAgentId: string) => {
    if (!user) return;
    const favPath = `agents_public/${user.uid}/favorites/${favoriteAgentId}`;
    setFavoriteBusyId(favoriteAgentId);
    try {
      await deleteDoc(doc(db, 'agents_public', user.uid, 'favorites', favoriteAgentId));
      showToast('Agent retiré de vos favoris.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, favPath);
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const handleContactFavorite = (fav: FavoriteAgent) => {
    setIsProfileOpen(false);
    const live = agents.find((a) => a.uid === fav.favoriteAgentId);
    void startConversation({
      recipientId: fav.favoriteAgentId,
      recipientName: live?.businessName || fav.businessName,
      listingId: 'direct',
      listingSummary: `Contact direct MTN MoMo · ${live?.quartier || fav.quartier}, ${live?.commune || fav.commune}`,
    });
  };

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'listings', label: t('nav.listings') },
    { id: 'agents', label: t('nav.agents') },
    {
      id: 'messages',
      label:
        conversations.length > 0
          ? `${t('nav.messages')} (${conversations.length})`
          : t('nav.messages'),
    },
    { id: 'analytics', label: t('nav.analytics') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#111111]">
      {/* Barre supérieure 3 zones stricte aux couleurs MTN Sunshine Yellow */}
      <header className="sticky top-0 z-30 border-b border-[#111111]/15 bg-[#FFCB05]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('listings');
            }}
            className="text-base sm:text-lg font-extrabold font-display tracking-tight text-[#111111] whitespace-nowrap shrink-0"
          >
            MTN MoMo Connect Bénin
          </a>

          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-6 text-sm font-semibold"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#004F71] text-[#004F71]'
                      : 'border-transparent text-[#111111]/80 hover:text-[#111111]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleOpenPublish}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-display bg-[#004F71] text-white hover:bg-[#003a54] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('nav.publish')}
            </button>
          </div>
        </div>
      </header>

      {/* Barre d'espace MoMo Blue + Drapeau du Bénin + Langues + Alertes + Compte */}
      <NetworkSwitcherBar
        user={user}
        agentProfile={agentProfile}
        isAdmin={isAdmin}
        authLoading={authLoading}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        onOpenProfileModal={() => setIsProfileOpen(true)}
        onOpenAlertsModal={() => setIsAlertsOpen(true)}
      />

      {/* Navigation mobile compacte */}
      <div className="md:hidden border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-4 overflow-x-auto">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`text-xs font-semibold whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                active
                  ? 'border-[#004F71] text-[#004F71]'
                  : 'border-transparent text-gray-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Contenu principal */}
      <main id="top" className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-7">
        {activeTab === 'listings' && (
          <ListingsView
            listings={listings}
            loading={listingsLoading}
            currentUid={user?.uid}
            isAdmin={isAdmin}
            onOpenPublish={handleOpenPublish}
            onContactAuthor={(listing) =>
              startConversation({
                recipientId: listing.authorId,
                recipientName: listing.authorName,
                listingId: listing.id,
                listingSummary: `MTN MoMo · ${formatFcfa(listing.amount)} (${listing.quartier}, ${listing.commune})`,
              })
            }
            onReportListing={(listing) => {
              if (!user) {
                void handleSignIn();
                return;
              }
              setReportTarget({
                type: 'listing',
                id: listing.id,
                label: `MTN MoMo ${formatFcfa(listing.amount)}`,
              });
            }}
            onUpdateListingStatus={handleUpdateListingStatus}
            onDeleteListing={handleDeleteListing}
            onNavigateAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'agents' && (
          <AgentsDirectoryView
            agents={agents}
            loading={agentsLoading}
            currentUid={user?.uid}
            favoriteIds={favoriteIds}
            favoriteBusyId={favoriteBusyId}
            onContactAgent={(agent) =>
              startConversation({
                recipientId: agent.uid,
                recipientName: agent.businessName,
                listingId: 'direct',
                listingSummary: `Contact direct MTN MoMo · ${agent.quartier}, ${agent.commune}`,
              })
            }
            onReportAgent={(agent) => {
              if (!user) {
                void handleSignIn();
                return;
              }
              setReportTarget({
                type: 'agent',
                id: agent.uid,
                label: agent.businessName,
              });
            }}
            onToggleFavorite={handleToggleFavoriteAgent}
            onOpenProfileModal={() => {
              if (!user) {
                void handleSignIn();
                return;
              }
              setIsProfileOpen(true);
            }}
          />
        )}

        {activeTab === 'messages' && (
          <MessagingView
            isAuthenticated={Boolean(user)}
            currentUid={user?.uid}
            conversations={conversations}
            activeConversationId={activeConversationId}
            messages={messages}
            privateContact={privateContact}
            onSelectConversation={setActiveConversationId}
            onSendMessage={handleSendMessage}
            onShareWhatsapp={handleShareWhatsapp}
            onSignIn={handleSignIn}
            onOpenProfileModal={() => setIsProfileOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <BeninAnalyticsView listings={listings} agents={agents} />
        )}
      </main>

      {/* Section inférieure avec images flottantes en arrière-plan des échanges internes */}
      <BottomFloatingBackdrop
        isInstalled={isInstalled}
        onTriggerInstall={() => void handleDirectInstall()}
      />

      {/* Pied de page aux couleurs MTN MoMo Bénin */}
      <footer className="border-t border-white/10 bg-[#001D2B] text-white py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between gap-6 text-xs text-white/80">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <MtnMomoEmblem size="md" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold font-display text-sm text-[#FFCB05]">
                <BeninFlag className="w-5 h-3.5" />
                <span>MTN MoMo Connect Bénin</span>
              </div>
              <p className="leading-relaxed">{t('footer.disclaimer')}</p>
            </div>
          </div>
          <div className="space-y-2 md:text-right shrink-0">
            <div className="font-semibold text-[#FFCB05]">{t('footer.tagline')}</div>
            {!isInstalled && (
              <button
                type="button"
                onClick={() => void handleDirectInstall()}
                className="text-xs font-semibold text-white underline hover:text-[#FFCB05] cursor-pointer"
              >
                {t('footer.installLink')}
              </button>
            )}
            <p className="text-white/65">© 2026 MTN MoMo Connect Bénin</p>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      <PublishListingModal
        isOpen={isPublishOpen}
        agentProfile={agentProfile}
        onClose={() => setIsPublishOpen(false)}
        onSubmit={handlePublishListing}
      />

      <AgentProfileModal
        isOpen={isProfileOpen}
        userEmail={user?.email || ''}
        userPhone={user?.phoneNumber || ''}
        agentProfile={agentProfile}
        privateContact={privateContact}
        isAdmin={isAdmin}
        favorites={favorites}
        allAgents={agents}
        myVerificationRequests={myVerificationRequests}
        adminVerificationRequests={adminVerificationRequests}
        adminReports={adminReports}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={handleSaveProfile}
        onRemoveFavorite={handleRemoveFavorite}
        onContactFavorite={handleContactFavorite}
        onRequestVerification={handleRequestVerification}
        onModerateVerification={handleModerateVerification}
        onResolveReport={handleResolveReport}
      />

      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />

      <PWAInstallModal
        isOpen={isInstallOpen}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={install}
        onClose={() => setIsInstallOpen(false)}
      />

      <AlertsModal
        isOpen={isAlertsOpen}
        isAuthenticated={Boolean(user)}
        agentProfile={agentProfile}
        notifications={notifications}
        alertRules={alertRules}
        fcmTokens={fcmTokens}
        fcmStatus={fcmStatus}
        onClose={() => setIsAlertsOpen(false)}
        onSignIn={handleSignIn}
        onOpenProfileModal={() => {
          setIsAlertsOpen(false);
          setIsProfileOpen(true);
        }}
        onEnablePush={handleEnablePush}
        onTestBrowserNotification={handleTestBrowserNotification}
        onCreateRule={handleCreateAlertRule}
        onToggleRule={handleToggleAlertRule}
        onDeleteRule={handleDeleteAlertRule}
        onScanExistingListings={handleScanExistingListings}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
        onOpenNotificationListing={handleOpenNotificationListing}
      />

      {/* Invite directe d'installation au premier accès (1 clic) */}
      {!isInstalled && !installDismissed && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-2xl bg-[#004F71] text-white border border-[#FFCB05]/40 p-3.5 shadow-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFCB05] text-[#111111] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold font-display text-[#FFCB05] truncate">
              {t('install.bannerTitle')}
            </div>
            <div className="text-[11px] text-white/85 leading-snug">
              {t('install.bannerDesc')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleDirectInstall()}
            className="px-3 py-1.5 rounded-xl bg-[#FFCB05] text-[#111111] text-xs font-bold font-display hover:bg-[#f2bd00] shrink-0 cursor-pointer"
          >
            {t('install.bannerBtn')}
          </button>
          <button
            type="button"
            onClick={() => setInstallDismissed(true)}
            aria-label="Fermer"
            className="p-1 text-white/70 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 rounded-xl bg-[#111111] text-[#FFCB05] border border-[#FFCB05]/40 px-3.5 py-2 text-xs font-bold shadow-lg">
          Mode hors ligne — Données en cache affichées
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#111111] text-[#FFCB05] border border-[#FFCB05]/30 text-xs font-bold shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
