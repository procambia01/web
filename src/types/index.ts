// ── Auth ──────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  emailVerified: boolean
}

export type UserRole = 'USER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ── User ──────────────────────────────────────────────────
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
export type PremiumTier = 'BASIC' | 'PREMIUM' | 'BUSINESS'

export interface User {
  id: string
  name: string
  email: string
  image: string | null
  phone: string | null
  bio: string | null
  role: UserRole
  emailVerified: boolean
  phoneVerified: boolean
  idVerified: boolean
  verificationStatus: VerificationStatus
  rating: number
  totalSwaps: number
  successfulSwaps: number
  failedSwaps: number
  confirmationRate: number
  trustScore: number
  country: string | null
  city: string | null
  state: string | null
  isActive: boolean
  isBanned: boolean
  isSuspended: boolean
  isPremium: boolean
  premiumTier: PremiumTier | null
  premiumExpiry: string | null
  createdAt: string
  updatedAt: string
}

// ── Offer ─────────────────────────────────────────────────
export type OfferStatus = 'ACTIVE' | 'MATCHED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'PAUSED'
export type OfferVisibility = 'PUBLIC' | 'VERIFIED_ONLY' | 'PREMIUM_ONLY' | 'PRIVATE'

export interface SwapOffer {
  id: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'image' | 'rating' | 'totalSwaps' | 'idVerified' | 'trustScore'>
  haveCurrency: string
  wantCurrency: string
  haveAmount: number
  wantAmount: number
  exchangeRate: number
  country: string
  city: string
  state: string | null
  latitude: number
  longitude: number
  meetingArea: string | null
  radius: number
  availableFrom: string
  availableUntil: string
  isFlexible: boolean
  status: OfferStatus
  visibility: OfferVisibility
  notes: string | null
  requiresVerifiedUsers: boolean
  minTrustScore: number
  viewCount: number
  matchCount: number
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  distance?: number
}

// ── Swap ──────────────────────────────────────────────────
export type SwapStatus =
  | 'PENDING' | 'AGREED' | 'IN_PROGRESS' | 'CONFIRMING'
  | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'FAILED' | 'EXPIRED'

export interface Swap {
  id: string
  initiatorId: string
  initiator: SwapParticipant
  receiverId: string
  receiver: SwapParticipant
  offerId: string
  initiatorGivesCurrency: string
  initiatorGivesAmount: number
  receiverGivesCurrency: string
  receiverGivesAmount: number
  agreedExchangeRate: number
  meetupLocation: string | null
  meetupAddress: string | null
  meetupTime: string | null
  status: SwapStatus
  initiatorSentConfirmed: boolean
  initiatorReceivedConfirmed: boolean
  receiverSentConfirmed: boolean
  receiverReceivedConfirmed: boolean
  completedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
}

export interface SwapParticipant {
  id: string
  name: string
  image: string | null
  rating: number
  totalSwaps: number
  idVerified: boolean
  trustScore: number
}

// ── Message ───────────────────────────────────────────────
export interface Message {
  id: string
  swapId: string
  senderId: string
  sender: { id: string; name: string; image: string | null }
  content: string
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM'
  attachments: string[]
  isRead: boolean
  readAt: string | null
  isEdited: boolean
  createdAt: string
}

// ── Notification ──────────────────────────────────────────
export type NotificationType =
  | 'MATCH_FOUND' | 'SWAP_REQUEST' | 'SWAP_ACCEPTED' | 'SWAP_REJECTED'
  | 'MESSAGE_RECEIVED' | 'SWAP_CONFIRMED' | 'SWAP_COMPLETED' | 'SWAP_CANCELLED'
  | 'RATING_RECEIVED' | 'DISPUTE_FILED' | 'DISPUTE_RESOLVED'
  | 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED'
  | 'PREMIUM_EXPIRING' | 'PREMIUM_EXPIRED'
  | 'ACCOUNT_WARNING' | 'SYSTEM_ALERT' | 'PROMOTIONAL'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

// ── Transaction ───────────────────────────────────────────
export interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  currency: string
  description: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  paymentMethod: string | null
  createdAt: string
  completedAt: string | null
}

// ── Referral ──────────────────────────────────────────────
export interface Referral {
  id: string
  referrerId: string
  referredId: string
  referred: Pick<User, 'id' | 'name' | 'image' | 'createdAt'>
  code: string
  status: 'PENDING' | 'COMPLETED' | 'REWARDED' | 'EXPIRED'
  referrerReward: number | null
  createdAt: string
}

// ── Pagination ────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ── Admin types ───────────────────────────────────────────
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalSwaps: number
  completedSwaps: number
  totalVolume: number
  openDisputes: number
  pendingVerifications: number
  revenue: number
}

export interface Dispute {
  id: string
  swapId: string
  swap: Pick<Swap, 'id' | 'initiatorGivesCurrency' | 'initiatorGivesAmount' | 'receiverGivesCurrency' | 'receiverGivesAmount'>
  reporterId: string
  reporter: Pick<User, 'id' | 'name' | 'image'>
  reason: string
  description: string
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED' | 'ESCALATED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  resolvedById: string | null
  resolvedAt: string | null
  createdAt: string
}
