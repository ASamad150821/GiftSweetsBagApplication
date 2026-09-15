export interface PostcodeLookupResult {
  city: string
  region: string
}

interface PostcodesIoResponse {
  status: number
  result: {
    admin_district: string | null
    parish: string | null
    region: string | null
  } | null
}

export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult | null> {
  const trimmed = postcode.trim()
  if (!trimmed) return null

  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`)
  if (!response.ok) return null

  const data: PostcodesIoResponse = await response.json()
  if (!data.result) return null

  const city = data.result.admin_district ?? data.result.parish ?? data.result.region ?? ''
  return { city: city, region: data.result.region ?? '' }
};
