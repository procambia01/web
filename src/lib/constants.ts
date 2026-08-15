export const APP_NAME = 'Cashmova'
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
export const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000'

export const COOKIE_ACCESS_TOKEN  = 'cashmova_access'
export const COOKIE_REFRESH_TOKEN = 'cashmova_refresh'

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',           symbol: '$',    flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',                symbol: '€',    flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',       symbol: '£',    flag: '🇬🇧' },
  { code: 'NGN', name: 'Nigerian Naira',      symbol: '₦',    flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi',       symbol: '₵',    flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling',     symbol: 'KSh',  flag: '🇰🇪' },
  { code: 'ZAR', name: 'South African Rand',  symbol: 'R',    flag: '🇿🇦' },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'CA$',  flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$',   flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥',    flag: '🇯🇵' },
  { code: 'AED', name: 'UAE Dirham',          symbol: 'د.إ',  flag: '🇦🇪' },
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹',    flag: '🇮🇳' },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'Fr',   flag: '🇨🇭' },
  { code: 'EGP', name: 'Egyptian Pound',      symbol: '£',    flag: '🇪🇬' },
  { code: 'BRL', name: 'Brazilian Real',      symbol: 'R$',   flag: '🇧🇷' },
] as const

export const SWAP_STATUS_COLORS: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  AGREED:      'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  CONFIRMING:  'bg-orange-100 text-orange-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  CANCELLED:   'bg-gray-100 text-gray-600',
  DISPUTED:    'bg-red-100 text-red-700',
  FAILED:      'bg-red-100 text-red-700',
  EXPIRED:     'bg-gray-100 text-gray-600',
}

export const OFFER_STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  MATCHED:   'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
  EXPIRED:   'bg-gray-100 text-gray-600',
  PAUSED:    'bg-amber-100 text-amber-700',
}

export const PAGINATION_DEFAULTS = { page: 1, perPage: 20 }
