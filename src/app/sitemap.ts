import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/pricing', '/how-it-works', '/safety', '/login', '/register'].map((p) => ({ url: `${APP_URL}${p}`, changeFrequency: 'weekly' as const }))
}
