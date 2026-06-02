import { useState } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const ISSUES = [
  { id: 'healthcare',       label: 'Healthcare',                  icon: '⚕' },
  { id: 'education',        label: 'Education',                   icon: '📚' },
  { id: 'climate',          label: 'Climate & Environment',       icon: '🌿' },
  { id: 'economy',          label: 'Economy & Jobs',              icon: '📊' },
  { id: 'housing',          label: 'Housing',                     icon: '🏠' },
  { id: 'immigration',      label: 'Immigration & Due Process',   icon: '⚖' },
  { id: 'guns',             label: 'Gun Policy',                  icon: '🛡' },
  { id: 'privacy',          label: 'Privacy & Tech',              icon: '🔒' },
  { id: 'criminal_justice', label: 'Criminal Justice',            icon: '⚖' },
  { id: 'infrastructure',   label: 'Infrastructure',              icon: '🛣' },
  { id: 'veterans',         label: 'Veterans Affairs',            icon: '🎖' },
  { id: 'civil_rights',     label: 'Civil Rights',                icon: '✊' },
]

const TONES = [
  { id: 'formal',        name: 'Formal & Professional', desc: 'Respectful, data-driven, measured' },
  { id: 'passionate',    name: 'Passionate & Urgent',   desc: 'Heartfelt, direct call to action' },
  { id: 'personal',      name: 'Personal Story',        desc: 'Ground it in your lived experience' },
  { id: 'collaborative', name: 'Collaborative',         desc: 'Solution-oriented, bipartisan' },
]

// ─── Styles (inline so the project is self-contained) ────────────────────────

const S = {
  app: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '2rem 1.5rem',
    fontFamily: "'Lora', Georgia, serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid rgba(74,63,53,0.45)',
  },
  ornament: {
    fontSize: 11,
    letterSpacing: '0.3em',
    color: '#C4922A',
    textTransform: 'uppercase',
    fontFamily: "'Cinzel', serif",
    marginBottom: '0.5rem',
  },
  h1: {
    fontFamily: "'Cinzel', serif",
    fontSize: '2rem',
    fontWeight: 600,
    color: '#1A1410',
    letterSpacing: '0.05em',
  },
  tagline: {
    fontSize: '0.9rem',
    color: '#4A3F35',
    fontStyle: 'italic',
    marginTop: '0.4rem',
    lineHeight: 1.6,
  },
  progress: {
    display: 'flex',
    gap: 6,
    marginBottom: '2rem',
  },
  stepLabel: {
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: '#8A7A6A',
    marginBottom: '0.4rem',
  },
  h2: {
    fontFamily: "'Cinzel', serif",
    fontSize: '1.15rem',
    fontWeight: 500,
    color: '#1A1410',
    marginBottom: '1.25rem',
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    border: '1px solid rgba(74,63,53,0.45)',
    background: 'rgba(255,255,255,0.6)',
    fontFamily: "'Lora', serif",
    fontSize: '0.95rem',
    color: '#1A1410',
    borderRadius: 4,
    outline: 'none',
  },
  note: {
    fontSize: '0.8rem',
    color: '#8A7A6A',
    fontStyle: 'italic',
    marginTop: '0.75rem',
    lineHeight: 1.6,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(74,63,53,0.2)',
    margin: '1.5rem 0',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  issueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 8,
    marginBottom: '1.5rem',
  },
  legList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: '1.5rem',
  },
  toneGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: '1.5rem',
  },
  letterBox: {
    border: '1px solid rgba(74,63,53,0.45)',
    background: 'rgba(255,255,255,0.7)',
    padding: '1.25rem',
    borderRadius: 4,
    marginBottom: '1.25rem',
    minHeight: 200,
  },
  letterText: {
    fontSize: '0.88rem',
    lineHeight: 1.75,
    color: '#1A1410',
    whiteSpace: 'pre-wrap',
    outline: 'none',
  },
  emailRow: {
    display: 'flex',
    gap: 8,
    marginBottom: '1rem',
  },
  emailInput: {
    flex: 1,
    padding: '0.65rem 0.9rem',
    border: '1px solid rgba(74,63,53,0.45)',
    background: 'rgba(255,255,255,0.6)',
    fontFamily: "'Lora', serif",
    fontSize: '0.88rem',
    color: '#1A1410',
    borderRadius: 4,
    outline: 'none',
  },
  successWrap: {
    textAlign: 'center',
    padding: '2rem 0',
  },
  sentList: {
    listStyle: 'none',
    marginBottom: '1.5rem',
    textAlign: 'left',
  },
}

// ─── Small components ─────────────────────────────────────────────────────────

function ProgressBar({ step, total = 6 }) {
  return (
    <div style={S.progress}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            flex: 1,
            borderRadius: 2,
            background: i < step ? '#C4922A' : i === step ? '#8B1A1A' : '#DDD6C4',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  )
}

function Btn({ children, primary, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.65rem 1.5rem',
        border: primary ? '1px solid #8B1A1A' : '1px solid rgba(74,63,53,0.45)',
        background: primary ? '#8B1A1A' : 'transparent',
        fontFamily: "'Cinzel', serif",
        fontSize: '0.78rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: primary ? '#F5EDE0' : '#1A1410',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 3,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function LevelBadge({ level }) {
  const colors = {
    federal: { bg: 'rgba(139,26,26,0.1)', color: '#8B1A1A' },
    state:   { bg: 'rgba(196,146,42,0.12)', color: '#C4922A' },
    local:   { bg: 'rgba(74,63,53,0.1)', color: '#4A3F35' },
  }
  const c = colors[level] || colors.local
  return (
    <span style={{
      fontSize: '0.7rem',
      padding: '2px 8px',
      borderRadius: 2,
      fontFamily: "'Cinzel', serif",
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.color,
      flexShrink: 0,
    }}>
      {level}
    </span>
  )
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div style={{
      padding: '0.75rem 1rem',
      border: '1px solid rgba(139,26,26,0.4)',
      background: 'rgba(139,26,26,0.06)',
      borderRadius: 4,
      fontSize: '0.85rem',
      color: '#8B1A1A',
      marginBottom: '1rem',
      fontStyle: 'italic',
    }}>
      {message}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(0)
  const [address, setAddress] = useState('')
  const [selectedIssues, setSelectedIssues] = useState([])
  const [legislation, setLegislation] = useState([])
  const [selectedBill, setSelectedBill] = useState(null)
  const [billPosition, setBillPosition] = useState('support')
  const [legislators, setLegislators] = useState([])
  const [selectedLegs, setSelectedLegs] = useState([])
  const [selectedTone, setSelectedTone] = useState('')
  const [letterText, setLetterText] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Step navigation ──────────────────────────────────────────────────────

  async function handleAddressNext() {
    if (!address.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/legislators?address=${encodeURIComponent(address)}&t=${Date.now()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not look up your representatives.')
      setLegislators(data.officials)
      setSelectedLegs(data.officials.map(l => l.id))
      setStep(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleIssuesNext() {
    setLoading(true)
    setError('')
    try {
      const issueLabels = selectedIssues.map(id => ISSUES.find(i => i.id === id)?.label).filter(Boolean)
      const res = await fetch('/api/legislation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues: issueLabels }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not fetch legislation.')
      setLegislation(data.bills)
      setSelectedBill(data.bills[0] || null)
      setStep(1.5)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDraft() {
    if (!selectedTone || selectedLegs.length === 0) return
    setLoading(true)
    setError('')
    setStep(3)
    setLetterText('')
    try {
      const issueLabels = selectedIssues
        .map(id => ISSUES.find(i => i.id === id)?.label)
        .filter(Boolean)
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, issues: issueLabels, tone: selectedTone, bill: selectedBill, billPosition }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not draft letter.')
      setLetterText(data.letter)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    const legs = legislators.filter(l => selectedLegs.includes(l.id))
    if (legs.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: letterText, legislators: legs, userEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send letters.')
      setStep(4)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function restart() {
    setStep(0); setAddress(''); setSelectedIssues([]); setLegislation([])
    setSelectedBill(null); setBillPosition('support'); setLegislators([])
    setSelectedLegs([]); setSelectedTone(''); setLetterText(''); setUserEmail(''); setError('')
  }

  function toggleIssue(id) {
    setSelectedIssues(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleLeg(id) {
    setSelectedLegs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.app}>

      {/* Header */}
      <div style={S.header}>
        <div style={S.ornament}>★ civic correspondence ★</div>
        <h1 style={S.h1}>LegisLetter</h1>
        <p style={S.tagline}>Make your voice heard before the vote — not after.</p>
      </div>

      <ProgressBar step={step} />

      {/* ── Step 0: Address ── */}
      {step === 0 && (
        <div>
          <div style={S.stepLabel}>Step 1 of 6</div>
          <h2 style={S.h2}>Where do you call home?</h2>
          <ErrorBox message={error} />
          <input
            style={S.input}
            placeholder="Enter your address or ZIP code..."
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddressNext()}
          />
          <p style={S.note}>Your address determines which legislators represent you at the local, state, and federal levels.</p>
          <hr style={S.divider} />
          <div style={S.btnRow}>
            <Btn primary onClick={handleAddressNext} disabled={loading || !address.trim()}>
              {loading ? 'Looking up…' : 'Find My Representatives →'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 1: Issues ── */}
      {step === 1 && (
        <div>
          <div style={S.stepLabel}>Step 2 of 6</div>
          <h2 style={S.h2}>What issues matter to you?</h2>
          <div style={S.issueGrid}>
            {ISSUES.map(issue => (
              <button
                key={issue.id}
                onClick={() => toggleIssue(issue.id)}
                style={{
                  padding: '0.6rem 0.8rem',
                  border: selectedIssues.includes(issue.id)
                    ? '1px solid #8B1A1A'
                    : '1px solid rgba(74,63,53,0.45)',
                  background: selectedIssues.includes(issue.id)
                    ? 'rgba(139,26,26,0.08)'
                    : 'transparent',
                  fontFamily: "'Lora', serif",
                  fontSize: '0.82rem',
                  color: selectedIssues.includes(issue.id) ? '#8B1A1A' : '#4A3F35',
                  borderRadius: 4,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: selectedIssues.includes(issue.id) ? 500 : 400,
                }}
              >
                <span>{issue.icon}</span>{issue.label}
              </button>
            ))}
          </div>
          <ErrorBox message={error} />
          <hr style={S.divider} />
          <div style={S.btnRow}>
            <Btn onClick={() => setStep(0)}>← Back</Btn>
            <Btn primary onClick={handleIssuesNext} disabled={loading || selectedIssues.length === 0}>
              {loading ? 'Finding legislation…' : 'Find Relevant Bills →'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 1.5: Legislation ── */}
      {step === 1.5 && (
        <div>
          <div style={S.stepLabel}>Step 3 of 6</div>
          <h2 style={S.h2}>Choose a bill to focus your letter on</h2>
          <p style={{ ...S.note, marginBottom: '1rem' }}>These bills are currently active in Congress and relate to your selected issues. Pick one — your letter will reference it by name.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
            {legislation.map((bill, i) => (
              <div
                key={i}
                onClick={() => setSelectedBill(bill)}
                style={{
                  padding: '0.9rem 1rem',
                  border: selectedBill === bill ? '1px solid #8B1A1A' : '1px solid rgba(74,63,53,0.2)',
                  background: selectedBill === bill ? 'rgba(139,26,26,0.06)' : 'rgba(255,255,255,0.5)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.72rem', color: '#C4922A', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {bill.billNumber}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#8A7A6A', fontStyle: 'italic' }}>{bill.status}</span>
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 2, background: 'rgba(74,63,53,0.08)', color: '#4A3F35', marginLeft: 'auto' }}>
                    {bill.issue}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1A1410', marginBottom: 4 }}>{bill.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#4A3F35', lineHeight: 1.5 }}>{bill.summary}</div>
                {bill.sponsor && (
                  <div style={{ fontSize: '0.72rem', color: '#8A7A6A', marginTop: 6, fontStyle: 'italic' }}>
                    Sponsored by {bill.sponsor}
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedBill && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={S.stepLabel}>Your position on {selectedBill.billNumber}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setBillPosition('support')}
                  style={{
                    flex: 1, padding: '0.6rem', border: billPosition === 'support' ? '1px solid #2A6E2A' : '1px solid rgba(74,63,53,0.3)',
                    background: billPosition === 'support' ? 'rgba(42,110,42,0.08)' : 'transparent',
                    borderRadius: 4, cursor: 'pointer', fontFamily: "'Lora', serif", fontSize: '0.85rem',
                    color: billPosition === 'support' ? '#2A6E2A' : '#4A3F35', fontWeight: billPosition === 'support' ? 500 : 400,
                  }}
                >
                  ✓ Support this bill
                </button>
                <button
                  onClick={() => setBillPosition('oppose')}
                  style={{
                    flex: 1, padding: '0.6rem', border: billPosition === 'oppose' ? '1px solid #8B1A1A' : '1px solid rgba(74,63,53,0.3)',
                    background: billPosition === 'oppose' ? 'rgba(139,26,26,0.08)' : 'transparent',
                    borderRadius: 4, cursor: 'pointer', fontFamily: "'Lora', serif", fontSize: '0.85rem',
                    color: billPosition === 'oppose' ? '#8B1A1A' : '#4A3F35', fontWeight: billPosition === 'oppose' ? 500 : 400,
                  }}
                >
                  ✗ Oppose this bill
                </button>
              </div>
            </div>
          )}
          <hr style={S.divider} />
          <div style={S.btnRow}>
            <Btn onClick={() => setStep(1)}>← Back</Btn>
            <Btn primary onClick={() => setStep(2)} disabled={!selectedBill}>Select Representatives →</Btn>
          </div>
        </div>
      )}

      {/* ── Step 2: Legislators ── */}
      {step === 2 && (
        <div>
          <div style={S.stepLabel}>Step 4 of 6</div>
          <h2 style={S.h2}>Choose who to contact</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: '#8A7A6A', fontStyle: 'italic' }}>
              {selectedLegs.length} of {legislators.length} selected
            </span>
            <button
              onClick={() => setSelectedLegs(
                selectedLegs.length === legislators.length ? [] : legislators.map(l => l.id)
              )}
              style={{ background: 'none', border: 'none', fontFamily: "'Lora', serif", fontSize: '0.78rem', color: '#8B1A1A', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {selectedLegs.length === legislators.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div style={S.legList}>
            {legislators.map(leg => (
              <div
                key={leg.id}
                onClick={() => toggleLeg(leg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.8rem 1rem',
                  border: selectedLegs.includes(leg.id)
                    ? '1px solid #8B1A1A'
                    : '1px solid rgba(74,63,53,0.2)',
                  background: selectedLegs.includes(leg.id)
                    ? 'rgba(139,26,26,0.06)'
                    : 'rgba(255,255,255,0.5)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#EAE3D2', border: '1px solid rgba(74,63,53,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
                  color: '#4A3F35', flexShrink: 0,
                }}>
                  {leg.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#1A1410' }}>
                    {leg.name} <span style={{ fontSize: '0.75rem', color: '#8A7A6A', fontWeight: 400 }}>({leg.party})</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8A7A6A', fontStyle: 'italic' }}>{leg.title}</div>
                </div>
                <LevelBadge level={leg.level} />
                <span style={{ color: '#8B1A1A', opacity: selectedLegs.includes(leg.id) ? 1 : 0 }}>✓</span>
              </div>
            ))}
          </div>
          <hr style={S.divider} />
          <div style={S.btnRow}>
            <Btn onClick={() => setStep(1.5)}>← Back</Btn>
            <Btn primary onClick={() => setStep(2.5)} disabled={selectedLegs.length === 0}>Choose Tone →</Btn>
          </div>
        </div>
      )}

      {/* ── Step 2.5: Tone ── */}
      {step === 2.5 && (
        <div>
          <div style={S.stepLabel}>Step 5 of 6</div>
          <h2 style={S.h2}>How would you like your letter to read?</h2>
          <div style={S.toneGrid}>
            {TONES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTone(t.id)}
                style={{
                  padding: '0.75rem 1rem',
                  border: selectedTone === t.id
                    ? '1px solid #8B1A1A'
                    : '1px solid rgba(74,63,53,0.45)',
                  background: selectedTone === t.id ? 'rgba(139,26,26,0.08)' : 'transparent',
                  fontFamily: "'Lora', serif",
                  fontSize: '0.82rem',
                  color: '#4A3F35',
                  borderRadius: 4,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 500, color: '#1A1410', fontSize: '0.85rem', marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#8A7A6A' }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <hr style={S.divider} />
          <div style={S.btnRow}>
            <Btn onClick={() => setStep(2)}>← Back</Btn>
            <Btn primary onClick={handleDraft} disabled={!selectedTone || loading}>
              {loading ? 'Drafting…' : 'Draft My Letter →'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Send ── */}
      {step === 3 && (
        <div>
          <div style={S.stepLabel}>Step 6 of 6</div>
          <h2 style={S.h2}>Review and send your letter</h2>
          <ErrorBox message={error} />
          {loading ? (
            <div style={{ ...S.letterBox, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7A6A', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Claude is drafting your letter…
            </div>
          ) : (
            <>
              <p style={{ ...S.note, marginBottom: '0.75rem' }}>Your letter has been drafted by Claude. Edit it freely before sending.</p>
              <div style={S.letterBox}>
                <div
                  style={S.letterText}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={e => setLetterText(e.currentTarget.innerText)}
                  dangerouslySetInnerHTML={{ __html: letterText.replace(/\n/g, '<br/>') }}
                />
              </div>
            </>
          )}
          <div style={S.emailRow}>
            <input
              style={S.emailInput}
              placeholder="Your email address (for a confirmation copy)..."
              type="email"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
            />
          </div>
          <hr style={S.divider} />
          <div style={S.btnRow}>
            <Btn onClick={() => setStep(2.5)}>← Back</Btn>
            <Btn primary onClick={handleSend} disabled={loading || !letterText}>
              {loading ? 'Sending…' : 'Send Letters →'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 4: Success ── */}
      {step === 4 && (
        <div style={S.successWrap}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: '#8B1A1A', marginBottom: '0.75rem' }}>
            {selectedLegs.length === 1 ? 'Letter Delivered' : 'Letters Delivered'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#4A3F35', fontStyle: 'italic', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 1.5rem' }}>
            Your voice has been sent to the following representatives.
            {userEmail && ' A confirmation copy has been sent to your inbox.'}
          </p>
          <ul style={S.sentList}>
            {legislators.filter(l => selectedLegs.includes(l.id)).map(l => (
              <li key={l.id} style={{ fontSize: '0.83rem', color: '#4A3F35', padding: '4px 0', borderBottom: '1px solid rgba(74,63,53,0.2)' }}>
                ✓ {l.name} — {l.title}
              </li>
            ))}
          </ul>
          <Btn primary onClick={restart}>Write Another Letter</Btn>
        </div>
      )}

    </div>
  )
}
