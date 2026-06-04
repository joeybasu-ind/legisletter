// api/send.js
// Sends the constituent letter via email using Resend.
// - User gets a confirmation copy with their letter
// - Each legislator's contact page link is included so the user can submit directly

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { letter, legislators, userEmail } = req.body

  if (!letter || !legislators || legislators.length === 0) {
    return res.status(400).json({ error: 'Letter and at least one legislator are required.' })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured.' })
  }

  // Build legislator contact links for the email
  const legLines = legislators.map(l => {
    const contact = l.website
      ? `${l.name} (${l.title}) — <a href="${l.website}" style="color:#8B1A1A;">${l.website}</a>`
      : `${l.name} (${l.title})`
    return `<li style="margin-bottom:6px;">${contact}</li>`
  }).join('')

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1A1410; background: #F9F5EE;">

  <div style="text-align:center; border-bottom: 1px solid rgba(74,63,53,0.4); padding-bottom: 20px; margin-bottom: 28px;">
    <div style="font-size:11px; letter-spacing:0.3em; color:#C4922A; text-transform:uppercase; margin-bottom:6px;">★ civic correspondence ★</div>
    <h1 style="font-size:1.6rem; color:#1A1410; margin:0;">LegisLetter</h1>
    <p style="font-size:0.85rem; color:#4A3F35; font-style:italic; margin-top:6px;">Your letter is ready to send.</p>
  </div>

  <p style="font-size:0.9rem; line-height:1.7; color:#4A3F35;">
    Here is a copy of your constituent letter. To submit it, visit each representative's contact page below and paste the letter into their form.
  </p>

  <h2 style="font-size:0.85rem; font-family: Arial, sans-serif; text-transform:uppercase; letter-spacing:0.15em; color:#8A7A6A; margin-bottom:8px;">Your Representatives</h2>
  <ul style="font-size:0.85rem; line-height:1.7; padding-left:20px; margin-bottom:28px;">
    ${legLines}
  </ul>

  <h2 style="font-size:0.85rem; font-family: Arial, sans-serif; text-transform:uppercase; letter-spacing:0.15em; color:#8A7A6A; margin-bottom:8px;">Your Letter</h2>
  <div style="border: 1px solid rgba(74,63,53,0.35); background: #fff; padding: 24px; border-radius: 4px; font-size:0.88rem; line-height:1.8; white-space:pre-wrap;">${letter}</div>

  <p style="font-size:0.75rem; color:#8A7A6A; font-style:italic; margin-top:28px; text-align:center;">
    Sent via <a href="https://legisletter.us" style="color:#8B1A1A;">LegisLetter</a> — Make your voice heard before the vote, not after.
  </p>

</body>
</html>
  `.trim()

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LegisLetter <onboarding@resend.dev>',
        to: userEmail || 'hello@legisletter.us',
        subject: 'Your constituent letter is ready',
        html: emailHtml,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend error:', data)
      return res.status(500).json({ error: 'Could not send confirmation email.' })
    }

    return res.status(200).json({
      success: true,
      message: `Confirmation sent to ${userEmail}`,
    })
  } catch (err) {
    console.error('Send API error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
