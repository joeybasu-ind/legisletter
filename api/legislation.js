// api/legislation.js
// Uses Claude to surface 4-5 real pending or recently active bills
// relevant to the user's selected issues.

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { issues } = req.body
  if (!issues || issues.length === 0) {
    return res.status(400).json({ error: 'At least one issue is required.' })
  }

  const issueList = issues.join(', ')

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a legislative research assistant. The user cares about these issues: ${issueList}.

Return exactly 4 real, currently pending or recently active U.S. federal bills (from the 118th or 119th Congress) that are directly relevant to these issues. Choose bills that are genuinely important and have active debate.

Respond with ONLY a valid JSON array. No explanation, no markdown, no code fences. Just the raw JSON array.

Each item must have these exact fields:
- "billNumber": e.g. "H.R. 1234" or "S. 567"
- "title": short official title of the bill
- "summary": 1-2 sentence plain-English summary of what it does
- "status": one of "In Committee", "Passed House", "Passed Senate", "Awaiting Vote", "Signed into Law"
- "issue": which of the user's issues this relates to most

Example format:
[{"billNumber":"H.R. 1234","title":"Example Act","summary":"This bill does X.","status":"In Committee","issue":"Healthcare"}]`
      }],
    })

    const raw = message.content[0].text.trim()
    let bills
    try {
      bills = JSON.parse(raw)
    } catch {
      // Try to extract JSON array if Claude added any surrounding text
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('Could not parse legislation response.')
      bills = JSON.parse(match[0])
    }

    return res.status(200).json({ bills })
  } catch (err) {
    console.error('Legislation API error:', err)
    return res.status(500).json({ error: 'Could not fetch relevant legislation. Please try again.' })
  }
}
