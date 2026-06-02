// api/legislators.js
// Step 1: zippopotam.us gives us city + state from ZIP (free, no key)
// Step 2: Claude looks up current reps with that concrete location context

export default async function handler(req, res) {
  const { address } = req.query

  if (!address) {
    return res.status(400).json({ error: 'Address is required.' })
  }

  const zipMatch = address.match(/\b\d{5}\b/)
  if (!zipMatch) {
    return res.status(400).json({ error: 'Please include a 5-digit ZIP code in your address.' })
  }
  const zip = zipMatch[0]

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured.' })
  }

  // Step 1: resolve ZIP to city + state
  let city = ''
  let state = ''
  try {
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (geoRes.ok) {
      const geoData = await geoRes.json()
      city = geoData.places?.[0]?.['place name'] || ''
      state = geoData.places?.[0]?.['state abbreviation'] || ''
    }
  } catch {
    // non-fatal — Claude will do its best with just the ZIP
  }

  const locationDesc = city && state
    ? `ZIP code ${zip} (${city}, ${state})`
    : `ZIP code ${zip}`

  // Step 2: ask Claude for current reps with full location context
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a civic information assistant with up-to-date knowledge of U.S. Congress members.

The user lives at ${locationDesc}. Identify their current federal elected officials as of your latest knowledge:
- The 2 current U.S. Senators for ${state || 'that state'}
- The current U.S. House Representative for that specific city/ZIP congressional district

Return ONLY a valid JSON array. No explanation, no markdown, no code fences.

Each item must have these exact fields:
- "name": full name, e.g. "Victoria Spartz"
- "title": e.g. "U.S. Senator (IN)" or "U.S. Representative, IN-05"
- "party": "D", "R", or "I"
- "phone": DC office phone number if known, otherwise null
- "website": official .gov website if known, otherwise null

Example format:
[{"name":"Victoria Spartz","title":"U.S. Representative, IN-05","party":"R","phone":"202-225-2276","website":"https://spartz.house.gov"}]`,
        }],
      }),
    })

    const data = await response.json()
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Claude API error')
    }

    const raw = data.content[0].text.trim()
    let members
    try {
      members = JSON.parse(raw)
    } catch {
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('Could not parse representatives response.')
      members = JSON.parse(match[0])
    }

    const officials = members.map((m, i) => {
      const nameParts = m.name.trim().split(' ')
      const initials = nameParts.length >= 2
        ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
        : m.name.slice(0, 2)

      return {
        id: i + 1,
        name: m.name,
        title: m.title,
        party: m.party || '?',
        initials: initials.toUpperCase(),
        level: 'federal',
        email: null,
        phone: m.phone || null,
        website: m.website || null,
      }
    })

    if (officials.length === 0) {
      return res.status(404).json({ error: 'No representatives found for that ZIP code.' })
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ officials })
  } catch (err) {
    console.error('Legislators API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
