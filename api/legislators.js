// api/legislators.js
// 1. zippopotam.us  → lat/lng + state (free, no key)
// 2. Census geocoder → congressional district number (free, no key)
// 3. congress.gov   → current senators + house rep (free API key)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const { address } = req.query
  if (!address) return res.status(400).json({ error: 'Address is required.' })

  // Prefer ZIP after a state abbreviation (e.g. "IN 46033"), else take the last 5-digit number
  const stateZipMatch = address.match(/\b[A-Z]{2}\s+(\d{5})\b/)
  const fallbackMatches = address.match(/\b\d{5}\b/g)
  const zip = stateZipMatch ? stateZipMatch[1] : fallbackMatches ? fallbackMatches[fallbackMatches.length - 1] : null
  if (!zip) return res.status(400).json({ error: 'Please include a 5-digit ZIP code in your address.' })

  const congressKey = process.env.CONGRESS_API_KEY
  if (!congressKey) return res.status(500).json({ error: 'Congress API key not configured.' })

  // ── Step 1: ZIP → lat/lng + state ────────────────────────────────────────
  let state = '', lat = '', lng = ''
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (r.ok) {
      const d = await r.json()
      state = d.places?.[0]?.['state abbreviation'] || ''
      lat   = d.places?.[0]?.latitude  || ''
      lng   = d.places?.[0]?.longitude || ''
    }
  } catch {}

  if (!state) return res.status(400).json({ error: 'Could not determine state from that ZIP code.' })

  // ── Step 2: lat/lng → congressional district ──────────────────────────────
  let district = null
  if (lat && lng) {
    try {
      const censusUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=54&format=json`
      const r = await fetch(censusUrl)
      if (r.ok) {
        const d = await r.json()
        const geographies = d.result?.geographies || {}
        // Key name includes the congress session, e.g. "119th Congressional Districts"
        const cdKey = Object.keys(geographies).find(k => k.includes('Congressional Districts'))
        const cdList = cdKey ? geographies[cdKey] : []
        if (cdList.length > 0) district = cdList[0].BASENAME // e.g. "5"
      }
    } catch {}
  }

  // ── Step 3: congress.gov → current members for this state ────────────────
  try {
    const r = await fetch(
      `https://api.congress.gov/v3/member/${state}?currentMember=true&limit=60&api_key=${congressKey}`
    )
    const d = await r.json()
    if (!r.ok || !d.members) throw new Error('congress.gov request failed')

    const senators    = d.members.filter(m => !m.district)
    const houseAll    = d.members.filter(m => m.district)
    const houseRep    = district
      ? houseAll.find(m => Number(m.district) === parseInt(district, 10))
      : null

    const targetMembers = [...senators, ...(houseRep ? [houseRep] : [])]

    // Fetch each member's detail page in parallel to get officialWebsiteUrl
    const detailResults = await Promise.all(
      targetMembers.map(m =>
        fetch(`https://api.congress.gov/v3/member/${m.bioguideId}?api_key=${congressKey}`)
          .then(r => r.json())
          .catch(() => null)
      )
    )

    const toOfficial = (m, title, detail) => {
      const parts = (m.name || '').split(', ')
      const fullName = parts.length === 2 ? `${parts[1]} ${parts[0]}` : m.name
      const words = fullName.trim().split(' ')
      const initials = words.length >= 2
        ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase()
      const party = m.partyName === 'Democratic' ? 'D' : m.partyName === 'Republican' ? 'R' : 'I'
      const website = detail?.member?.officialWebsiteUrl || null
      return { name: fullName, title, party, initials, level: 'federal', email: null, phone: null, website }
    }

    const officials = targetMembers.map((m, i) => {
      const isSenator = !m.district
      const title = isSenator ? `U.S. Senator (${state})` : `U.S. Representative, ${state}-${district}`
      return { ...toOfficial(m, title, detailResults[i]), id: i + 1 }
    })

    if (officials.length === 0) {
      return res.status(404).json({ error: 'No representatives found for that ZIP code.' })
    }

    return res.status(200).json({ officials })
  } catch (err) {
    console.error('Legislators API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
