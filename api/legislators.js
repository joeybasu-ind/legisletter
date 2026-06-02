// api/legislators.js
// Uses Claude to look up current U.S. federal representatives for a ZIP code.
// whoismyrepresentative.com was too stale; Claude has up-to-date knowledge.

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
          content: `You are a civic information assistant. Look up the current U.S. federal elected officials for ZIP code ${zip}.

Return ONLY a valid JSON array with no explanation, no markdown, no code fences.

Include:
- The 2 current U.S. Senators for that state
- The current U.S. House Representative for that ZIP code's congressional district

Each item must have these exact fields:
- "name": full name, e.g. "Todd Young"
- "title": e.g. "U.S. Senator (IN)" or "U.S. Representative, IN-05"
- "party": "D", "R", or "I"
- "phone": DC office phone number if known, otherwise null
- "website": official .gov website if known, otherwise null

Use your most current knowledge. If you are uncertain about a specific district, make your best determination based on the ZIP code.

Example format:
[{"name":"Todd Young","title":"U.S. Senator (IN)","party":"R","phone":"202-224-5623","website":"https://www.young.senate.gov"}]`,
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

    return res.status(200).json({ officials })
  } catch (err) {
    console.error('Legislators API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
