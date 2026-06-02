// api/legislators.js
// Vercel serverless function — runs on the server, never exposed to users.
// Calls Google Civic Information API to look up real legislators by address.

export default async function handler(req, res) {
  const { address } = req.query

  if (!address) {
    return res.status(400).json({ error: 'Address is required.' })
  }

  const apiKey = process.env.GOOGLE_CIVIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Civic API key not configured.' })
  }

  try {
    const url = `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok || data.error) {
      return res.status(400).json({ error: 'Could not find representatives for that address. Try a full street address or ZIP code.' })
    }

    // Google returns offices + officials as separate arrays. We combine them.
    const officials = []
    let idCounter = 1

    for (const office of data.offices || []) {
      // Determine level from the office's levels array
      const levels = office.levels || []
      let level = 'local'
      if (levels.includes('country')) level = 'federal'
      else if (levels.includes('administrativeArea1')) level = 'state'

      for (const index of office.officialIndices || []) {
        const official = data.officials[index]
        if (!official) continue

        // Build initials from name
        const nameParts = official.name.trim().split(' ')
        const initials = nameParts.length >= 2
          ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
          : official.name.slice(0, 2)

        // Get party abbreviation
        const partyMap = { 'Democratic Party': 'D', 'Republican Party': 'R', 'Independent': 'I', 'Nonpartisan': 'NP' }
        const party = partyMap[official.party] || official.party?.[0] || '?'

        // Get email if available
        const email = official.emails?.[0] || null

        officials.push({
          id: idCounter++,
          name: official.name,
          title: office.name,
          party,
          initials: initials.toUpperCase(),
          level,
          email,
          phone: official.phones?.[0] || null,
          website: official.urls?.[0] || null,
        })
      }
    }

    if (officials.length === 0) {
      return res.status(404).json({ error: 'No representatives found for that address.' })
    }

    return res.status(200).json({ officials })
  } catch (err) {
    console.error('Civic API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
