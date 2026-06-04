// api/state-legislators.js
// Uses LegiScan to find current state legislators for a given lat/lng + state.
// LegiScan getSessionPeople returns legislators for a state legislative session.
// We filter to find the reps matching the user's district via Census geocoder.

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const { address } = req.query
  if (!address) return res.status(400).json({ error: 'Address is required.' })

  const zipMatch = address.match(/\b\d{5}\b/g)
  if (!zipMatch) return res.status(400).json({ error: 'Please include a 5-digit ZIP code in your address.' })
  const zip = zipMatch[zipMatch.length - 1]

  const stateZipMatch = address.match(/\b[A-Z]{2}\s+(\d{5})\b/)
  const finalZip = stateZipMatch ? stateZipMatch[1] : zip

  const legiscanKey = process.env.LEGISCAN_API_KEY
  if (!legiscanKey) return res.status(500).json({ error: 'LegiScan API key not configured.' })

  // Step 1: ZIP → state + lat/lng
  let state = '', stateFull = '', lat = '', lng = ''
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${finalZip}`)
    if (r.ok) {
      const d = await r.json()
      state = d.places?.[0]?.['state abbreviation'] || ''
      stateFull = d.places?.[0]?.['state'] || ''
      lat = d.places?.[0]?.latitude || ''
      lng = d.places?.[0]?.longitude || ''
    }
  } catch {}

  if (!state) return res.status(400).json({ error: 'Could not determine state from that ZIP code.' })

  // Step 2: lat/lng → state legislative districts via Census geocoder
  let upperDistrict = null, lowerDistrict = null
  if (lat && lng) {
    try {
      const censusUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=45,46&format=json`
      const r = await fetch(censusUrl)
      if (r.ok) {
        const d = await r.json()
        const geos = d.result?.geographies || {}
        const upperKey = Object.keys(geos).find(k => k.includes('Upper'))
        const lowerKey = Object.keys(geos).find(k => k.includes('Lower'))
        if (upperKey) upperDistrict = geos[upperKey][0]?.BASENAME
        if (lowerKey) lowerDistrict = geos[lowerKey][0]?.BASENAME
      }
    } catch {}
  }

  // Step 3: Get current LegiScan session for this state
  try {
    const sessionsRes = await fetch(
      `https://api.legiscan.com/?key=${legiscanKey}&op=getSessionList&state=${state}`
    )
    const sessionsData = await sessionsRes.json()
    // Debug: return the raw LegiScan response so we can see its structure
    return res.status(200).json({ _debug_raw: JSON.stringify(sessionsData).slice(0, 1000) })


    // Step 4: Get people (legislators) for this session
    const peopleRes = await fetch(
      `https://api.legiscan.com/?key=${legiscanKey}&op=getSessionPeople&session_id=${currentSession.session_id}`
    )
    const peopleData = await peopleRes.json()
    if (peopleData.status !== 'OK') {
      return res.status(500).json({ error: `LegiScan people failed (session_id=${currentSession.session_id}): ${JSON.stringify(peopleData).slice(0, 200)}. Full session: ${JSON.stringify(currentSession).slice(0, 300)}` })
    }

    const people = peopleData.sessionpeople?.people || []

    // Filter to senators (upper) and representatives (lower) matching the user's district
    const senators = people.filter(p =>
      p.role === 'Sen' &&
      upperDistrict &&
      String(p.district).replace(/^0+/, '') === String(parseInt(upperDistrict, 10))
    )

    const representatives = people.filter(p =>
      p.role === 'Rep' &&
      lowerDistrict &&
      String(p.district).replace(/^0+/, '') === String(parseInt(lowerDistrict, 10))
    )

    // If district matching fails, return a helpful message
    const matched = [...senators, ...representatives]

    if (matched.length === 0) {
      // Fallback: return all legislators with a note
      return res.status(200).json({
        officials: [],
        state,
        stateFull,
        sessionId: currentSession.session_id,
        sessionName: currentSession.session_name,
        districtNote: `Could not pinpoint your exact district (upper: ${upperDistrict}, lower: ${lowerDistrict}). Try searching your state legislature's website directly.`,
      })
    }

    const officials = matched.map((p, i) => {
      const nameParts = p.name.trim().split(' ')
      const initials = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : p.name.slice(0, 2).toUpperCase()
      const party = p.party === 'D' ? 'D' : p.party === 'R' ? 'R' : 'I'
      const title = p.role === 'Sen'
        ? `${stateFull} State Senator, District ${p.district}`
        : `${stateFull} State Representative, District ${p.district}`

      return {
        id: i + 1,
        name: p.name,
        title,
        party,
        initials,
        level: 'state',
        email: null,
        phone: null,
        website: p.followthemoney_eid
          ? `https://www.followthemoney.org/entity-info/?eid=${p.followthemoney_eid}`
          : null,
        legiscanId: p.people_id,
      }
    })

    return res.status(200).json({ officials, state, stateFull, sessionId: currentSession.session_id })
  } catch (err) {
    console.error('State legislators error:', err)
    return res.status(500).json({ error: 'Could not fetch state legislators. Please try again.' })
  }
}
