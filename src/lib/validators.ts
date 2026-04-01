import { z } from 'zod'

export const loginSchema = z.object({
  email:      z.string().email('Invalid email'),
  password:   z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8).regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
  phone:           z.string().optional(),
  referralCode:    z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  password:        z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const createOfferSchema = z.object({
  haveCurrency:   z.string().min(3, 'Select a currency'),
  wantCurrency:   z.string().min(3, 'Select a currency'),
  haveAmount:     z.coerce.number().positive('Must be greater than 0'),
  wantAmount:     z.coerce.number().positive('Must be greater than 0'),
  city:           z.string().min(1, 'City is required'),
  country:        z.string().min(1, 'Country is required'),
  latitude:       z.coerce.number().optional(),
  longitude:      z.coerce.number().optional(),
  availableFrom:  z.string().min(1, 'Required'),
  availableUntil: z.string().min(1, 'Required'),
  notes:          z.string().max(500).optional(),
  isFlexible:     z.boolean().optional(),
  visibility:     z.enum(['PUBLIC','VERIFIED_ONLY','PREMIUM_ONLY','PRIVATE']).optional(),
})

export const updateProfileSchema = z.object({
  name:    z.string().min(2).optional(),
  phone:   z.string().optional(),
  bio:     z.string().max(200).optional(),
  country: z.string().optional(),
  city:    z.string().optional(),
})

export type LoginFormData         = z.infer<typeof loginSchema>
export type RegisterFormData      = z.infer<typeof registerSchema>
export type ForgotPasswordData    = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordData     = z.infer<typeof resetPasswordSchema>
export type CreateOfferFormData   = z.infer<typeof createOfferSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
