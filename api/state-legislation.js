// api/state-legislation.js
// Uses LegiScan getSearch to find active state bills matching the user's issues.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const { issues, state } = req.body
  if (!issues || issues.length === 0) return res.status(400).json({ error: 'At least one issue is required.' })
  if (!state) return res.status(400).json({ error: 'State is required.' })

  const legiscanKey = process.env.LEGISCAN_API_KEY
  if (!legiscanKey) return res.status(500).json({ error: 'LegiScan API key not configured.' })

  try {
    // Search for bills matching each issue, take top results
    const query = issues.slice(0, 2).join(' ')

    const searchRes = await fetch(
      `https://api.legiscan.com/?key=${legiscanKey}&op=getSearch&state=${state}&query=${encodeURIComponent(query)}&year=2&page=1`
    )
    const searchData = await searchRes.json()

    if (searchData.status !== 'OK') {
      throw new Error(searchData.alert?.message || 'LegiScan search failed')
    }

    const results = searchData.searchresult || {}
    // searchresult contains numbered keys "0", "1", etc. plus a "summary" key
    const billResults = Object.values(results)
      .filter(r => r.bill_id && r.bill_number)
      .slice(0, 6)

    if (billResults.length === 0) {
      return res.status(200).json({ bills: [] })
    }

    // Fetch details for top 4 bills in parallel
    const detailResults = await Promise.all(
      billResults.slice(0, 4).map(b =>
        fetch(`https://api.legiscan.com/?key=${legiscanKey}&op=getBill&id=${b.bill_id}`)
          .then(r => r.json())
          .catch(() => null)
      )
    )

    const bills = detailResults
      .filter(d => d?.status === 'OK' && d?.bill)
      .map(d => {

        const bill = d.bill
        const sponsor = bill.sponsors?.[0]
        const sponsorName = sponsor
          ? `${sponsor.role_abbr || ''} ${sponsor.name} (${sponsor.party}-${bill.state})`.trim()
          : null

        const statusMap = {
          1: 'Introduced',
          2: 'In Committee',
          3: 'Passed Chamber',
          4: 'Passed Legislature',
          5: 'Signed into Law',
          6: 'Vetoed',
        }

        const status = statusMap[bill.status] || 'In Progress'
        // Skip bills that have already passed or been vetoed
        if (['Passed Legislature', 'Signed into Law', 'Vetoed'].includes(status)) return null

        const rawSummary = bill.description || bill.title
        const summary = rawSummary.length > 160
          ? rawSummary.slice(0, 157) + '...'
          : rawSummary

        return {
          billNumber: bill.bill_number,
          title: bill.title,
          summary,
          status,
          issue: issues[0],
          sponsor: sponsorName,
          url: bill.url,
          billId: bill.bill_id,
        }
      })
      .filter(Boolean) // remove nulls from filtered-out passed bills

    return res.status(200).json({ bills })
  } catch (err) {
    console.error('State legislation error:', err)
    return res.status(500).json({ error: 'Could not fetch state legislation. Please try again.' })
  }
}
