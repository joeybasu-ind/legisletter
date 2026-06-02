// api/draft.js
// Vercel serverless function — calls Anthropic Claude API to draft the letter.
// Your API key lives here on the server, invisible to users.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { address, issues, tone, bill, billPosition } = req.body

  if (!tone) {
    return res.status(400).json({ error: 'Tone is required.' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured.' })
  }

  const toneInstructions = {
    formal: 'Write in a formal, professional tone. Be respectful, measured, and evidence-oriented. Use proper salutation and closing.',
    passionate: 'Write with passion and urgency. Be heartfelt and direct. Make a clear call to action. The writer cares deeply about this.',
    personal: 'Write as if sharing a personal story. The letter should feel human and grounded in lived experience. Include a placeholder like [YOUR PERSONAL STORY HERE] where the writer can insert their own experience.',
    collaborative: 'Write in a collaborative, solution-oriented tone. Acknowledge the complexity of the issues. Express willingness to work together. Be bipartisan and constructive.',
  }

  const issueText = issues && issues.length > 0
    ? issues.join(', ')
    : 'matters of civic importance'

  const billContext = bill
    ? `\nSpecific legislation to focus on: ${bill.billNumber} — "${bill.title}". The constituent wants to ${billPosition === 'oppose' ? 'OPPOSE' : 'SUPPORT'} this bill. Summary: ${bill.summary}`
    : ''

  const prompt = `You are helping a constituent write a letter to their elected representative.

Address/location: ${address || 'not specified'}
Issues they care about: ${issueText}${billContext}
Tone: ${toneInstructions[tone] || toneInstructions.formal}

Write a single constituent letter. Requirements:
- Start with "Dear [Representative's Name],"
- 3-4 paragraphs, roughly 200-250 words total
${bill ? `- Reference ${bill.billNumber} by name and clearly state the constituent's position (${billPosition === 'oppose' ? 'opposition' : 'support'})` : '- Reference the specific issues provided'}
- End with a respectful closing and "[Your Name]" as a placeholder
- Do NOT include any preamble, explanation, or notes — just the letter itself
- Make it feel genuinely written by a real person, not a form letter`

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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      console.error('Anthropic error:', data)
      return res.status(500).json({ error: 'Could not draft the letter. Please try again.' })
    }

    const letter = data.content?.[0]?.text?.trim()
    if (!letter) {
      return res.status(500).json({ error: 'Received an empty response. Please try again.' })
    }

    return res.status(200).json({ letter })
  } catch (err) {
    console.error('Draft API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
