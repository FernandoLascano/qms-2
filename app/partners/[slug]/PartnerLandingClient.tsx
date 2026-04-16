'use client'

import { useEffect } from 'react'

interface PartnerLandingClientProps {
  slug: string
}

export default function PartnerLandingClient({ slug }: PartnerLandingClientProps) {
  useEffect(() => {
    document.cookie = `partner_ref=${encodeURIComponent(slug)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }, [slug])

  return null
}
