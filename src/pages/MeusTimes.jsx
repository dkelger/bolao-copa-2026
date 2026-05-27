import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:580, margin:"0 auto" },
  btn: { background:"#00C853", color:"#080d0a", border:"none", borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, letterSpacing:1.5, padding:"14px 28px", cursor:"pointer", width:"100%" },
  btnOut: { background:"transparent", color:"#6b8a62", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, padding:"12px 20px", cursor:"pointer" },
  input: { width:"100%", background:"rgba(255,255,255,.05)", border:"1.5px solid rgba(0,200,83,.16)", borderRadius:8, color:"#dff0d8", fontFamily:"'Barlow', sans-serif", fontSize:15, padding:"12px 16px", outline:"none", boxSizing:"border-box" },
  teamCard: { border:"2px solid rgba(0,200,83,.16)", borderRadius:12, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, background:"#1a2418" },
}

export default function MeusTimes() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [picks, setPicks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('teams').select('*').order('grupo').then(({ data }) => setTeams(data || []))
  }, [])

  const filtered = teams.filter(t => t.nome.toLowerCase().includes(search.toLowerCase()))

  const togglePick = (t) => {
    if (picks.find(p => p.id === t.id)) { setPicks(picks.filter(p => p.id !== t.id)); return }
    if (picks.length < 3) setPicks([...picks, t])
  }

  const handleSalvar = async () => {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada.'); setLoading(false); return }
    await supabase.from('picks').delete().eq('user_id', user.id)
    const { error: pickError } = await supabase.from('picks').insert(
      picks.map((t, i) => ({ user_id: user.id, team_id: t.id, ordem: i+1 }))
    )
    if (pickError) { setError(pickError.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#6b8a62", marginBottom:4}}>Meus Times</div>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44, color:"white", letterSpacing:3}}>ESCOLHA 3 TIMES</div>
        </div>

        {error && <div style={{background:"rgba(255,70,70,.1)", border:"1px solid rgba(255,70,70,.3)", borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:14, color:"#ff7070"}}>{error}</div>}
        {success && <div style={{background:"rgba(0,200,83,.1)", border:"1px solid rgba(0,200,83,.3)", borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:14, color:"#00C853"}}>✅ Times salvos! Redirecionando...</div>}

        <div style={{background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:20, marginBottom:16}}>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:14}}>
            <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700}}>Escolha 3 times</span>
            <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:28, fontWeight:900, color:"#00C853"}}>{picks.length}<span style={{color:"#6b8a62", fontSize:16}}>/3</span></span>
          </div>
          {picks.length > 0 && (
            <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:14}}>
              {picks.map(p => (
                <div key={p.id} style={{background:"rgba(0,200,83,.12)", border:"1px solid rgba(0,200,83,.25)", borderRadius:20, padding:"4px 12px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6}}>
                  {p.nome}<span style={{cursor:"pointer", opacity:.6}} onClick={() => setPicks(picks.filter(x => x.id !== p.id))}>✕</span>
                </div>
              ))}
            </div>
          )}
          <input style={s.input} placeholder="🔍 Buscar seleção..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxHeight:340, overflowY:"auto", marginBottom:16}}>
          {filtered.map(t => {
            const sel = picks.find(p => p.id === t.id)
            return (
              <div key={t.id} style={{...s.teamCard, borderColor:sel?"#00C853":"rgba(0,200,83,.16)", background:sel?"rgba(0,200,83,.08)":"#1a2418"}} onClick={() => togglePick(t)}>
                <span style={{fontSize:24}}>{t.bandeira_url || '🏴'}</span>
                <div>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700}}>{t.nome}</div>
                  <div style={{fontSize:12, color:"#6b8a62"}}>Grupo {t.grupo}</div>
                </div>
                {sel && <span style={{marginLeft:"auto", color:"#00C853"}}>✓</span>}
              </div>
            )
          })}
        </div>

        <div style={{display:"flex", gap:10}}>
          <button style={s.btnOut} onClick={() => navigate('/dashboard')}>← VOLTAR</button>
          <button style={{...s.btn, opacity:picks.length===3?1:.5}} onClick={handleSalvar} disabled={picks.length!==3||loading}>
            {loading ? 'Salvando...' : picks.length===3 ? 'SALVAR TIMES →' : `Selecione ${picks.length}/3`}
          </button>
        </div>
      </div>
    </div>
  )
}