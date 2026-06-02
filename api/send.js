// api/send.js
// Vercel serverless function — handles letter sending.
// Currently logs and confirms. When you're ready to send real emails,
// this is where you'd add SendGrid or Resend (both have free tiers).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { letter, legislators, userEmail } = req.body

  if (!letter || !legislators || legislators.length === 0) {
    return res.status(400).json({ error: 'Letter and at least one legislator are required.' })
  }

  // Log for your records (visible in Vercel's function logs dashboard)
  console.log(`[LegisLetter] Sending letter to ${legislators.length} legislator(s)`)
  console.log(`[LegisLetter] Recipients:`, legislators.map(l => l.name).join(', '))
  if (userEmail) console.log(`[LegisLetter] Confirmation copy to: ${userEmail}`)

  // ── Real email sending (uncomment when ready) ───────────────────────────
  //
  // To send real emails, sign up for Resend (resend.com) — it's free for
  // up to 3,000 emails/month. Add RESEND_API_KEY to your Vercel env vars,
  // then uncomment and adapt the code below:
  //
  // const { Resend } = await import('resend')
  // const resend = new Resend(process.env.RESEND_API_KEY)
  //
  // for (const leg of legislators) {
  //   if (leg.email) {
  //     await resend.emails.send({
  //       from: 'LegisLetter <noreply@legisletter.us>',
  //       to: leg.email,
  //       subject: `Constituent Letter from ${userEmail || 'a constituent'}`,
  //       text: letter,
  //     })
  //   }
  // }
  //
  // if (userEmail) {
  //   await resend.emails.send({
  //     from: 'LegisLetter <noreply@legisletter.us>',
  //     to: userEmail,
  //     subject: 'Your LegisLetter — confirmation copy',
  //     text: `Here is a copy of the letter you sent:\n\n${letter}`,
  //   })
  // }
  // ────────────────────────────────────────────────────────────────────────

  return res.status(200).json({
    success: true,
    message: `Letter queued for ${legislators.length} representative(s).`,
  })
}
