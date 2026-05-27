import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:580, margin:"0 auto" },
  title: { fontFamily:"'Bebas Neue', sans-serif", fontSize:44, color:"white", letterSpacing:3, marginBottom:4 },
  label: { fontFamily:"'Barlow Condensed', sans-serif", fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#6b8a62", display:"block", marginBottom:8 },
  input: { width:"100%", background:"rgba(255,255,255,.05)", border:"1.5px solid rgba(0,200,83,.16)", borderRadius:8, color:"#dff0d8", fontFamily:"'Barlow', sans-serif", fontSize:15, padding:"12px 16px", outline:"none", boxSizing:"border-box" },
  card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:20, marginBottom:16 },
  btn: { background:"#00C853", color:"#080d0a", border:"none", borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, letterSpacing:1.5, padding:"14px 28px", cursor:"pointer", width:"100%" },
  btnOut: { background:"transparent", color:"#6b8a62", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, letterSpacing:1, padding:"12px 20px", cursor:"pointer" },
  teamCard: { border:"2px solid rgba(0,200,83,.16)", borderRadius:12, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, background:"#1a2418" },
  stepNum: (active, done) => ({ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:900, flexShrink:0, background: done?"#003d17":active?"#00C853":"rgba(255,255,255,.06)", color: done?"#00C853":active?"#080d0a":"#6b8a62", border: active||done?"none":"1px solid rgba(0,200,83,.16)" })
}

export default function Inscricao() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [teams, setTeams] = useState([])
  const [picks, setPicks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dados, setDados] = useState({ nome:'', email:'', whatsapp:'', senha:'' })
  const [bonus, setBonus] = useState({ artilheiro:'', placar:'' })

  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('step') === '2') setStep(2)
  supabase.from('teams').select('*').order('grupo').then(({ data }) => setTeams(data || []))
}, [])

  const filtered = teams.filter(t => t.nome.toLowerCase().includes(search.toLowerCase()))

  const togglePick = (t) => {
    if (picks.find(p => p.id === t.id)) { setPicks(picks.filter(p => p.id !== t.id)); return }
    if (picks.length < 3) setPicks([...picks, t])
  }

  const handleCadastro = async () => {
    setLoading(true); setError('')
    const { data, error: authError } = await supabase.auth.signUp({
      email: dados.email, password: dados.senha,
      options: { data: { nome: dados.nome, whatsapp: dados.whatsapp } }
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    const { error: userError } = await supabase.from('users').insert({
      id: data.user.id, nome: dados.nome, email: dados.email, whatsapp: dados.whatsapp, status: 'pendente'
    })
    if (userError) { setError(userError.message); setLoading(false); return }
    setLoading(false); setStep(2)
  }

  const handlePicks = async () => {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada.'); setLoading(false); return }
    const picksData = picks.map((t, i) => ({ user_id: user.id, team_id: t.id, ordem: i+1, palpite_artilheiro: bonus.artilheiro||null, palpite_placar_final: bonus.placar||null }))
    const { error: pickError } = await supabase.from('picks').insert(picksData)
    if (pickError) { setError(pickError.message); setLoading(false); return }
    setLoading(false); setStep(4)
  }

  const handlePagamento = async () => {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada.'); setLoading(false); return }
    try {
      const { data, error: fnError } = await supabase.functions.invoke('criar-pix', {
        body: { user_id: user.id, nome: dados.nome, email: dados.email, valor: 50 }
      })
      if (fnError) throw new Error(fnError.message)
      if (data && data.init_point) { window.location.href = data.init_point }
      else throw new Error('Erro ao gerar pagamento')
    } catch (err) {
      setError('Erro: ' + err.message); setLoading(false)
    }
  }

  const STEPS = ['Seus dados', 'Escolha os times', 'Palpite bônus', 'Pagamento']
  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#6b8a62", marginBottom:4}}>Inscrição</div>
          <div style={s.title}>BOLÃO COPA 2026</div>
        </div>

        <div style={{display:"flex", gap:6, marginBottom:28, overflowX:"auto"}}>
          {STEPS.map((st, i) => (
            <div key={i} style={{display:"flex", alignItems:"center", gap:6}}>
              <div style={s.stepNum(step===i+1, step>i+1)}>{step>i+1?'✓':i+1}</div>
              <span style={{fontSize:12, fontWeight:600, color:step===i+1?"#dff0d8":"#6b8a62", whiteSpace:"nowrap"}}>{st}</span>
              {i<STEPS.length-1&&<div style={{width:20,height:1,background:"rgba(0,200,83,.16)"}}/>}
            </div>
          ))}
        </div>

        {error&&<div style={{background:"rgba(255,70,70,.1)", border:"1px solid rgba(255,70,70,.3)", borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:14, color:"#ff7070"}}>{error}</div>}

        {step===1&&(
          <div style={s.card}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, marginBottom:20}}>Seus dados</div>
            {[
              {key:'nome', label:'Nome completo', type:'text', ph:'Ex: Carlos Mendes'},
              {key:'email', label:'E-mail', type:'email', ph:'carlos@email.com'},
              {key:'whatsapp', label:'WhatsApp (com DDD)', type:'tel', ph:'65 9 9999-9999'},
              {key:'senha', label:'Crie uma senha', type:'password', ph:'Mínimo 6 caracteres'},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:16}}>
                <label style={s.label}>{f.label}</label>
                <input style={s.input} type={f.type} placeholder={f.ph} value={dados[f.key]} onChange={e=>setDados({...dados,[f.key]:e.target.value})}/>
              </div>
            ))}
            <button style={s.btn} onClick={handleCadastro} disabled={loading||!dados.nome||!dados.email||!dados.senha}>
              {loading?'Criando conta...':'PRÓXIMO →'}
            </button>
          </div>
        )}

        {step===2&&(
          <div>
            <div style={s.card}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:14}}>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700}}>Escolha 3 times</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:28, fontWeight:900, color:"#00C853"}}>{picks.length}<span style={{color:"#6b8a62",fontSize:16}}>/3</span></span>
              </div>
              {picks.length>0&&(
                <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:14}}>
                  {picks.map(p=>(
                    <div key={p.id} style={{background:"rgba(0,200,83,.12)", border:"1px solid rgba(0,200,83,.25)", borderRadius:20, padding:"4px 12px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6}}>
                      {p.nome}<span style={{cursor:"pointer", opacity:.6}} onClick={()=>setPicks(picks.filter(x=>x.id!==p.id))}>✕</span>
                    </div>
                  ))}
                </div>
              )}
              <input style={s.input} placeholder="🔍 Buscar seleção..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxHeight:340, overflowY:"auto", marginBottom:16}}>
              {filtered.map(t=>{
                const sel=picks.find(p=>p.id===t.id)
                return(
                  <div key={t.id} style={{...s.teamCard, borderColor:sel?"#00C853":"rgba(0,200,83,.16)", background:sel?"rgba(0,200,83,.08)":"#1a2418"}} onClick={()=>togglePick(t)}>
                    <span style={{fontSize:24}}>{t.bandeira_url||'🏴'}</span>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700}}>{t.nome}</div>
                      <div style={{fontSize:12, color:"#6b8a62"}}>Grupo {t.grupo}</div>
                    </div>
                    {sel&&<span style={{marginLeft:"auto", color:"#00C853"}}>✓</span>}
                  </div>
                )
              })}
            </div>
            <div style={{display:"flex", gap:10}}>
              <button style={s.btnOut} onClick={()=>setStep(1)}>← VOLTAR</button>
              <button style={{...s.btn, opacity:picks.length===3?1:.5}} onClick={()=>setStep(3)} disabled={picks.length!==3}>
                {picks.length===3?'PRÓXIMO →':`Selecione ${picks.length}/3`}
              </button>
            </div>
          </div>
        )}

        {step===3&&(
          <div style={s.card}>
            <div style={{background:"rgba(255,215,0,.1)", border:"1px solid rgba(255,215,0,.25)", borderRadius:20, padding:"4px 14px", display:"inline-flex", alignItems:"center", gap:6, fontFamily:"'Barlow Condensed', sans-serif", fontSize:12, fontWeight:700, letterSpacing:1, color:"#FFD700", marginBottom:16}}>🎁 Opcional — sem custo extra</div>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:700, marginBottom:8}}>Palpite bônus</div>
            <p style={{fontSize:14, color:"#6b8a62", marginBottom:24, lineHeight:1.6}}>Acerte e ganhe <strong style={{color:"#FFD700"}}>+10 pontos</strong> por palpite!</p>
            {[
              {key:'artilheiro', label:'👟 Artilheiro da Copa', ph:'Ex: Kylian Mbappé'},
              {key:'placar', label:'🏆 Placar exato da final', ph:'Ex: 2-1'},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:16}}>
                <label style={s.label}>{f.label}</label>
                <input style={s.input} placeholder={f.ph} value={bonus[f.key]} onChange={e=>setBonus({...bonus,[f.key]:e.target.value})}/>
              </div>
            ))}
            <div style={{display:"flex", gap:10}}>
              <button style={s.btnOut} onClick={()=>setStep(2)}>← VOLTAR</button>
              <button style={s.btn} onClick={handlePicks} disabled={loading}>{loading?'Salvando...':'PRÓXIMO →'}</button>
            </div>
          </div>
        )}

        {step===4&&(
          <div style={s.card}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:700, marginBottom:4}}>Pagamento PIX</div>
            <p style={{fontSize:14, color:"#6b8a62", marginBottom:20}}>Você será redirecionado para o Mercado Pago para concluir o pagamento via PIX.</p>
            <div style={{background:"#141f10", border:"1.5px dashed rgba(0,200,83,.35)", borderRadius:14, padding:24, textAlign:"center", marginBottom:16}}>
              <div style={{fontSize:64, marginBottom:12}}>⚽</div>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:40, fontWeight:900, color:"#00C853", marginBottom:4}}>R$ 50,00</div>
              <p style={{fontSize:13, color:"#6b8a62", marginBottom:20}}>Pagamento seguro via Mercado Pago</p>
              <button style={s.btn} onClick={handlePagamento} disabled={loading}>
                {loading?'Gerando pagamento...':'💳 PAGAR VIA MERCADO PAGO →'}
              </button>
            </div>
            <div style={{background:"rgba(0,200,83,.06)", border:"1px solid rgba(0,200,83,.16)", borderRadius:8, padding:"14px 16px", display:"flex", gap:12}}>
              <span style={{fontSize:20}}>🔒</span>
              <div>
                <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>Pagamento 100% seguro</div>
                <div style={{fontSize:13, color:"#6b8a62"}}>Processado pelo Mercado Pago. Após o pagamento você será redirecionado automaticamente.</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}