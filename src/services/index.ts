import { apiGet, apiPost, apiPatch, apiDelete, apiPaginated } from '@/lib/api'
import type { User, SwapOffer, Swap, Notification, Transaction, Referral, Dispute, AdminStats } from '@/types'

// ── User ──────────────────────────────────────────────────
export const userService = {
  getProfile:        ()              => apiGet<User>('/users/profile'),
  updateProfile:     (d: Partial<User>) => apiPatch<User>('/users/profile', d),
  getPublicProfile:  (id: string)    => apiGet<User>(`/users/${id}`),
  updateSettings:    (d: unknown)    => apiPatch<User>('/users/settings', d),
  updateAvatar:      (fd: FormData)  => fetch('/users/avatar', { method: 'PATCH', body: fd }),
  getVerificationStatus: ()          => apiGet<{ status: string; submittedAt: string | null }>('/users/verification/status'),
  submitVerification:(fd: FormData)  => fetch('/users/verification', { method: 'POST', body: fd }),
}

// ── Offers ────────────────────────────────────────────────
export const offerService = {
  getOffers:    (params?: Record<string, unknown>) => apiPaginated<SwapOffer>('/offers', { params }),
  getMyOffers:  (params?: Record<string, unknown>) => apiPaginated<SwapOffer>('/offers/my', { params }),
  getNearby:    (params: Record<string, unknown>)  => apiPaginated<SwapOffer>('/offers/nearby', { params }),
  getById:      (id: string)                       => apiGet<SwapOffer>(`/offers/${id}`),
  create:       (d: unknown)                       => apiPost<SwapOffer>('/offers', d),
  update:       (id: string, d: unknown)           => apiPatch<SwapOffer>(`/offers/${id}`, d),
  delete:       (id: string)                       => apiDelete(`/offers/${id}`),
  pause:        (id: string)                       => apiPatch<SwapOffer>(`/offers/${id}/pause`),
  resume:       (id: string)                       => apiPatch<SwapOffer>(`/offers/${id}/resume`),
  getMatches:   (id: string)                       => apiPaginated<SwapOffer>(`/offers/${id}/matches`),
  initiateSwap: (id: string, d?: unknown)          => apiPost<Swap>(`/offers/${id}/swap`, d),
}

// ── Swaps ─────────────────────────────────────────────────
export const swapService = {
  getMySwaps:      (params?: Record<string, unknown>) => apiPaginated<Swap>('/swaps', { params }),
  getById:         (id: string)                       => apiGet<Swap>(`/swaps/${id}`),
  accept:          (id: string)                       => apiPatch<Swap>(`/swaps/${id}/accept`),
  reject:          (id: string, reason?: string)      => apiPatch<Swap>(`/swaps/${id}/reject`, { reason }),
  cancel:          (id: string, reason: string)       => apiPatch<Swap>(`/swaps/${id}/cancel`, { reason }),
  updateMeetup:    (id: string, d: unknown)           => apiPatch<Swap>(`/swaps/${id}/meetup`, d),
  confirmSent:     (id: string)                       => apiPatch<Swap>(`/swaps/${id}/confirm-sent`),
  confirmReceived: (id: string)                       => apiPatch<Swap>(`/swaps/${id}/confirm-received`),
  rate:            (id: string, d: unknown)           => apiPost(`/swaps/${id}/rate`, d),
  fileDispute:     (id: string, d: unknown)           => apiPost(`/swaps/${id}/dispute`, d),
}

// ── Messages ──────────────────────────────────────────────
export const messageService = {
  getMessages:    (swapId: string, params?: Record<string, unknown>) =>
    apiPaginated<import('@/types').Message>(`/messages/${swapId}`, { params }),
  send:           (swapId: string, content: string) => apiPost(`/messages/${swapId}`, { content }),
  markRead:       (swapId: string)                  => apiPatch(`/messages/${swapId}/read`),
  getConversations: ()                              => apiGet<unknown[]>('/messages/conversations'),
}

// ── Notifications ─────────────────────────────────────────
export const notificationService = {
  getAll:       (params?: Record<string, unknown>) => apiPaginated<Notification>('/notifications', { params }),
  getUnreadCount: ()                               => apiGet<{ count: number }>('/notifications/unread-count'),
  markRead:     (id: string)                       => apiPatch(`/notifications/${id}/read`),
  markAllRead:  ()                                 => apiPatch('/notifications/read-all'),
  delete:       (id: string)                       => apiDelete(`/notifications/${id}`),
}

// ── Transactions ──────────────────────────────────────────
export const transactionService = {
  getAll: (params?: Record<string, unknown>) => apiPaginated<Transaction>('/transactions', { params }),
}

// ── Referrals ─────────────────────────────────────────────
export const referralService = {
  getMyCode:     ()              => apiGet<string>('/referrals/my-code'),
  getMyReferrals:()              => apiGet<Referral[]>('/referrals/my-referrals'),
  apply:         (code: string) => apiPost('/referrals/apply', { code }),
}

// ── Admin ─────────────────────────────────────────────────
export const adminService = {
  getStats:      ()                                 => apiGet<AdminStats>('/admin/stats'),
  getUsers:      (params?: Record<string, unknown>) => apiPaginated<User>('/admin/users', { params }),
  getUserById:   (id: string)                       => apiGet<User>(`/admin/users/${id}`),
  updateRole:    (id: string, role: string)         => apiPatch(`/admin/users/${id}/role`, { role }),
  banUser:       (id: string, reason: string, expiry?: string) =>
    apiPost(`/admin/users/${id}/ban`, { reason, banExpiry: expiry }),
  unbanUser:     (id: string)                       => apiPost(`/admin/users/${id}/unban`),
  suspendUser:   (id: string, reason: string)       => apiPost(`/admin/users/${id}/suspend`, { reason }),
  getSwaps:      (params?: Record<string, unknown>) => apiPaginated<Swap>('/admin/swaps', { params }),
  getDisputes:   (params?: Record<string, unknown>) => apiPaginated<Dispute>('/admin/disputes', { params }),
  getDisputeById:(id: string)                       => apiGet<Dispute>(`/admin/disputes/${id}`),
  resolveDispute:(id: string, resolution: string, note?: string) =>
    apiPost(`/admin/disputes/${id}/resolve`, { resolution, resolutionNote: note }),
  getVerifications:(params?: Record<string, unknown>) => apiPaginated<User>('/admin/verifications', { params }),
  approveVerification:(id: string) => apiPost(`/admin/verifications/${id}/approve`),
  rejectVerification: (id: string, reason: string) => apiPost(`/admin/verifications/${id}/reject`, { reason }),
  getAnalytics:  (params?: Record<string, unknown>) => apiGet<unknown>('/admin/analytics', { params }),
  getRevenue:    (params?: Record<string, unknown>) => apiGet<unknown>('/admin/analytics/revenue', { params }),
}
