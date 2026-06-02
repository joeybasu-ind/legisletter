// api/legislators.js
// Vercel serverless function — runs on the server, never exposed to users.
// Uses whoismyrepresentative.com (free, no key required) to look up federal
// legislators by ZIP code extracted from the user's address.

export default async function handler(req, res) {
  const { address } = req.query

  if (!address) {
    return res.status(400).json({ error: 'Address is required.' })
  }

  // Extract ZIP code from the address string
  const zipMatch = address.match(/\b\d{5}\b/)
  if (!zipMatch) {
    return res.status(400).json({ error: 'Please include a 5-digit ZIP code in your address.' })
  }
  const zip = zipMatch[0]

  try {
    const url = `https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`
    const response = await fetch(url)

    if (!response.ok) {
      return res.status(400).json({ error: 'Could not find representatives for that ZIP code. Please try again.' })
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: 'No representatives found for that ZIP code.' })
    }

    const partyMap = { 'D': 'D', 'R': 'R', 'I': 'I' }

    const officials = data.results.map((rep, i) => {
      const nameParts = rep.name.trim().split(' ')
      const initials = nameParts.length >= 2
        ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
        : rep.name.slice(0, 2)

      const party = partyMap[rep.party] || rep.party || '?'

      // Senators have no district number; reps do
      const isSenator = !rep.district || rep.district === ''
      const title = isSenator ? `U.S. Senator (${rep.state})` : `U.S. Representative, ${rep.state}-${rep.district}`
      const level = 'federal'

      return {
        id: i + 1,
        name: rep.name,
        title,
        party,
        initials: initials.toUpperCase(),
        level,
        email: null,
        phone: rep.phone || null,
        website: rep.link || null,
      }
    })

    return res.status(200).json({ officials })
  } catch (err) {
    console.error('Representatives API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
