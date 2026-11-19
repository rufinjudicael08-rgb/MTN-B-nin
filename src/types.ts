import { Timestamp } from 'firebase/firestore';

export type OperatorName = 'MTN MoMo' | 'Moov Money' | 'Celtiis Cash';

export type NetworkTheme = 'global' | 'mtn' | 'moov' | 'celtiis';

export type VerificationLevel = 'standard' | 'community' | 'certified';

export type ListingIntent = 'offer' | 'request';

export type LiquidityType = 'cash' | 'uv' | 'both';

export type ListingStatus = 'active' | 'matched' | 'closed';

export type AppTab = 'listings' | 'agents' | 'messages' | 'analytics';

export interface AgentPublic {
  id: string;
  uid: string;
  businessName: string;
  commune: string;
  quartier: string;
  operators: OperatorName[];
  verificationLevel: VerificationLevel;
  isAvailable: boolean;
  isPublic: boolean;
  bio?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AgentPrivateContact {
  uid: string;
  whatsapp: string;
  email: string;
  updatedAt?: Timestamp;
}

export interface LiquidityListing {
  id: string;
  authorId: string;
  authorName: string;
  authorVerification: VerificationLevel;
  intent: ListingIntent;
  liquidityType: LiquidityType;
  operator: OperatorName;
  amount: number;
  commune: string;
  quartier: string;
  details: string;
  status: ListingStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  initiatorId: string;
  recipientId: string;
  initiatorName: string;
  recipientName: string;
  listingId: string;
  listingSummary: string;
  initiatorWhatsapp?: string;
  recipientWhatsapp?: string;
  lastMessage: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  participantIds: string[];
  body: string;
  createdAt?: Timestamp;
}

export interface VerificationRequest {
  id: string;
  agentId: string;
  businessName: string;
  requestedLevel: 'community' | 'certified';
  commune: string;
  referenceNote: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'listing' | 'agent';
  targetId: string;
  reason: string;
  details: string;
  status: 'open' | 'reviewed' | 'resolved';
  createdAt?: Timestamp;
}

export interface FcmToken {
  id: string;
  uid: string;
  token: string;
  platform: string;
  updatedAt?: Timestamp;
}

export interface AlertRule {
  id: string;
  agentId: string;
  commune: string;
  quartier: string;
  intent: 'all' | ListingIntent;
  liquidityType: 'all' | LiquidityType;
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AgentNotification {
  id: string;
  recipientId: string;
  listingId: string;
  title: string;
  body: string;
  commune: string;
  quartier: string;
  amount: number;
  intent: ListingIntent;
  read: boolean;
  createdAt?: Timestamp;
}

