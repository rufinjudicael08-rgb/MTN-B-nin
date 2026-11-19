import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  MessagePayload,
  getMessaging,
  getToken,
  isSupported as isFcmSupported,
  onMessage,
} from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'lokossoujudicael00@gmail.com';
export const FCM_VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    }
  }
}

export type FcmRegistrationResult =
  | { status: 'active'; token: string }
  | { status: 'missing_vapid' | 'denied' | 'unsupported' | 'error'; errorMessage?: string };

export async function checkPushSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  try {
    return await isFcmSupported();
  } catch {
    return false;
  }
}

export async function registerFcmTokenForUser(uid: string): Promise<FcmRegistrationResult> {
  const supported = await checkPushSupport();
  if (!supported) {
    return {
      status: 'unsupported',
      errorMessage: "Votre navigateur ou l'aperçu intégré ne prend pas en charge Web Push.",
    };
  }

  if (Notification.permission !== 'granted') {
    return { status: 'denied' };
  }

  if (!FCM_VAPID_KEY) {
    return {
      status: 'missing_vapid',
      errorMessage:
        'Clé publique Web Push (VITE_FIREBASE_VAPID_KEY) non configurée : les alertes temps réel navigateur restent actives.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token || token.length < 10) {
      return {
        status: 'error',
        errorMessage: "Impossible d'obtenir le jeton Firebase Cloud Messaging.",
      };
    }

    const tokenDocPath = `agents_public/${uid}/fcm_tokens/web_primary`;
    try {
      await setDoc(doc(db, 'agents_public', uid, 'fcm_tokens', 'web_primary'), {
        uid,
        token: token.slice(0, 512),
        platform: window.matchMedia('(display-mode: standalone)').matches ? 'web-pwa' : 'web-browser',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, tokenDocPath);
    }

    return { status: 'active', token };
  } catch (error) {
    console.warn('FCM registration warning:', error);
    return {
      status: 'error',
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Erreur lors de la récupération du jeton Firebase Messaging.',
    };
  }
}

export async function subscribeForegroundFcm(
  onPayload: (payload: MessagePayload) => void,
): Promise<() => void> {
  const supported = await checkPushSupport();
  if (!supported) return () => {};
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, onPayload);
  } catch {
    return () => {};
  }
}

export async function showBrowserNotification(
  title: string,
  body: string,
  tag = 'mtn-momo-alert',
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope')) ||
        (await navigator.serviceWorker.getRegistration('/'));
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag,
        });
        return;
      }
    }
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag,
    });
  } catch (err) {
    console.warn('Browser notification fallback skipped:', err);
  }
}

void testConnection();

