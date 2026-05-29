import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const BANDEIRAS = {
  'México':'🇲🇽','África do Sul':'🇿🇦','Coreia do Sul':'🇰🇷','República Tcheca':'🇨🇿',
  'Canadá':'🇨🇦','Catar':'🇶🇦','Suíça':'🇨🇭','Itália':'🇮🇹',
  'Brasil':'🇧🇷','Marrocos':'🇲🇦','Haiti':'🇭🇹','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos':'🇺🇸','Paraguai':'🇵🇾','Austrália':'🇦🇺','Turquia':'🇹🇷',
  'Alemanha':'🇩🇪','Curaçao':'🇨🇼','Costa do Marfim':'🇨🇮','Equador':'🇪🇨',
  'Holanda':'🇳🇱','Japão':'🇯🇵','Tunísia':'🇹🇳','Ucrânia':'🇺🇦',
  'Bélgica':'🇧🇪','Egito':'🇪🇬','Irã':'🇮🇷','Nova Zelândia':'🇳🇿',
  'Espanha':'🇪🇸','Cabo Verde':'🇨🇻','Arábia Saudita':'🇸🇦','Uruguai':'🇺🇾',
  'França':'🇫🇷','Senegal':'🇸🇳','Noruega':'🇳🇴','Iraque':'🇮🇶',
  'Argentina':'🇦🇷','Argélia':'🇩🇿','Áustria':'🇦🇹','Jordânia':'🇯🇴',
  'Portugal':'🇵🇹','Uzbequistão':'🇺🇿','Colômbia':'🇨🇴','RD Congo':'🇨🇩',
  'Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croácia':'🇭🇷','Gana':'🇬🇭','Panamá':'🇵🇦'
}

const ADMINS = ['dkelger@gmail.com', 'diego_admin@bolao2026.com']

const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8",
    fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:900, margin:"0 auto" },
  card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)",
    borderRadius:14, padding:20, marginBottom:16 },
  stat: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)",
    borderRadius:14, padding:"16px 20px" },
  btn: { background:"#00C853", color:"#080d0a", border:"none", borderRadius:10,
    fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700,
    letterSpacing:1.5, padding:"10px 20px", cursor:"pointer" },
  btnOut: { background:"transparent", color:"#6b8a62",
    border:"1px solid rgba(255,255,255,.1)", borderRadius:10,
    fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
    fontWeight:700, letterSpacing:1, padding:"8px 16px", cursor:"pointer" },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [picks, setPicks]         = useState([])
  const [points, setPoints]       = useState([])
  const [ranking, setRanking]     = useState(null)
  const [premio, setPremio]       = useState(null)
  const [quizPendente, setQuizPendente] = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(()=>{ loadAll() },[])

  async function loadAll() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/inscricao'); return }
    setUser(user)

    const { data: prof } = await supabase
      .from('users').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { data: picksData } = await supabase
      .from('picks').select('*, teams(nome, grupo, fase_atual, bandeira_url)')
      .eq('user_id', user.id)
    setPicks(picksData || [])

    const { data: ptsData } = await supabase
      .from('points_log').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setPoints(ptsData || [])

    const { data: allPts } = await supabase
      .from('points_log').select('user_id, pontos')
    if (allPts) {
      const map = {}
      allPts.forEach(r => {
        map[r.user_id] = (map[r.user_id] || 0) + Number(r.pontos)
      })
      const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1])
      const pos = sorted.findIndex(([id])=>id===user.id)
      setRanking({ pos: pos+1, total: map[user.id] || 0, count: sorted.length })
    }

    // Busca fundo de prêmios
    const { data: users } = await supabase
      .from('users').select('status').neq('status', 'admin')
    if (users) {
      const ativos = users.filter(u => u.status === 'ativo').length
      const fundo = Math.round(ativos * 50 * 0.85)
      setPremio({
        total: fundo,
        primeiro: Math.round(fundo * 0.60),
        segundo: Math.round(fundo * 0.25),
        terceiro: Math.round(fundo * 0.15),
      })
    }

    // Verifica se tem quiz não respondido
    const agora = new Date().toISOString()
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('publicado', true)
      .gt('expira_em', agora)

    if (quizzes && quizzes.length > 0) {
      const { data: respostas } = await supabase
        .from('quiz_respostas')
        .select('quiz_id')
        .eq('user_id', user.id)
      const respondidos = new Set((respostas || []).map(r => r.quiz_id))
      const temPendente = quizzes.some(q => !respondidos.has(q.id))
      setQuizPendente(temPendente)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const totalPts = points.reduce((a,b)=>a+Number(b.pontos),0)

  if (loading) return (
    <div style={{...s.wrap, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <p style={{color:"#FFD700", fontSize:18}}>Carregando seu painel...</p>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        <div style={{display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:16}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
              fontWeight:700, letterSpacing:2, textTransform:"uppercase",
              color:"#6b8a62", marginBottom:4}}>MEU PAINEL</div>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44,
              color:"white", letterSpacing:3}}>
              {profile?.nome?.split(' ')[0]?.toUpperCase() || 'PARTICIPANTE'}
            </div>
          </div>
          <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
            <button style={s.btnOut} onClick={()=>navigate('/ranking')}>CLASSIFICAÇÃO</button>
            <button
              style={{...s.btnOut, position:"relative"}}
              onClick={()=>navigate('/quiz')}>
              QUIZZES
              {quizPendente && (
                <span style={{
                  position:"absolute", top:-6, right:-6,
                  background:"#ff4444", borderRadius:"50%",
                  width:10, height:10, display:"block",
                  border:"2px solid #080d0a"
                }}/>
              )}
            </button>
            {ADMINS.includes(user?.email) && (
              <button style={{...s.btnOut, color:'#FFD700', border:'1px solid rgba(255,215,0,.3)'}}
                onClick={()=>navigate('/admin')}>ADMIN</button>
            )}
            <button style={s.btnOut} onClick={handleLogout}>SAIR</button>
          </div>
        </div>

        {/* PREMIO */}
        {premio && premio.total > 0 && (
          <div style={{background:"rgba(255,215,0,.07)", border:"1px solid rgba(255,215,0,.2)",
            borderRadius:14, padding:"16px 20px", marginBottom:20,
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
                fontWeight:700, letterSpacing:2, color:"#FFD700", textTransform:"uppercase", marginBottom:4}}>
                🏆 Fundo de Prêmios
              </div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36,
                color:"#FFD700", lineHeight:1}}>
                R$ {premio.total.toLocaleString('pt-BR')}
              </div>
            </div>
            <div style={{display:"flex", gap:20, flexWrap:"wrap"}}>
              {[
                { pos:"🥇 1º", val: premio.primeiro },
                { pos:"🥈 2º", val: premio.segundo },
                { pos:"🥉 3º", val: premio.terceiro },
              ].map(p => (
                <div key={p.pos} style={{textAlign:"center"}}>
                  <div style={{fontSize:12, color:"#6b8a62", marginBottom:2}}>{p.pos}</div>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:18,
                    fontWeight:700, color:"#dff0d8"}}>
                    R$ {p.val.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
          gap:12, marginBottom:20}}>
          {[
            { val: totalPts.toFixed(1), label:"Pontos totais", color:"#FFD700" },
            { val: ranking?.pos || '-', label:"Posição", color:"#00C853" },
            { val: picks.length, label:"Seleções escolhidas", color:"#00C853" },
            { val: profile?.status === 'ativo' ? 'ATIVO' : 'PENDENTE', label:"Status", color:"#dff0d8" },
          ].map(st=>(
            <div key={st.label} style={s.stat}>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:40,
                color:st.color, lineHeight:1}}>{st.val}</div>
              <div style={{fontSize:12, color:"#6b8a62", textTransform:"uppercase",
                letterSpacing:1, fontWeight:600, marginTop:4}}>{st.label}</div>
            </div>
          ))}
        </div>

        <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
          fontWeight:700, letterSpacing:2, textTransform:"uppercase",
          color:"#6b8a62", marginBottom:12}}>MINHAS SELEÇÕES</div>

        {picks.length === 0 ? (
          <div style={s.card}>
            <p style={{color:"#6b8a62", fontSize:14}}>Você ainda não escolheu suas seleções.</p>
          </div>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
            gap:14, marginBottom:20}}>
            {picks.map(p=>{
              const selPts = points
                .filter(pt=>pt.team_id===p.team_id)
                .reduce((a,b)=>a+Number(b.pontos),0)
              return (
                <div key={p.id} style={s.card}>
                  <div style={{display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:12}}>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <span style={{fontSize:32}}>{BANDEIRAS[p.teams?.nome] || '🏴'}</span>
                      <div>
                        <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                          fontSize:20, fontWeight:700}}>{p.teams?.nome}</div>
                        <div style={{background:"rgba(0,200,83,.12)",
                          border:"1px solid rgba(0,200,83,.25)", borderRadius:20,
                          padding:"2px 10px", fontSize:11, fontWeight:700,
                          display:"inline-block", color:"#00C853", letterSpacing:1}}>
                          {p.teams?.fase_atual?.toUpperCase() || 'GRUPOS'}
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'Bebas Neue', sans-serif",
                        fontSize:42, color:"#00C853", lineHeight:1}}>{selPts.toFixed(1)}</div>
                      <div style={{fontSize:11, color:"#6b8a62"}}>pontos</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
          fontWeight:700, letterSpacing:2, textTransform:"uppercase",
          color:"#6b8a62", marginBottom:12}}>HISTÓRICO DE PONTOS</div>

        <div style={s.card}>
          {points.length === 0 ? (
            <p style={{color:"#6b8a62", fontSize:14, padding:"8px 0"}}>
              Nenhum ponto registrado ainda. Os pontos aparecem conforme os jogos acontecem!
            </p>
          ) : (
            points.map((pt,i)=>(
              <div key={pt.id} style={{display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"10px 0",
                borderBottom: i<points.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>
                <span style={{fontSize:14}}>{pt.descricao || pt.tipo}</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:20,
                  fontWeight:900, color: Number(pt.pontos)>0?"#00C853":"#6b8a62",
                  minWidth:48, textAlign:"right"}}>
                  {Number(pt.pontos)>0?`+${pt.pontos}`:pt.pontos}
                </span>
              </div>
            ))
          )}
        </div>

        {profile?.status === 'pendente' && (
          <div style={{background:"rgba(255,215,0,.07)", border:"1px solid rgba(255,215,0,.2)",
            borderRadius:14, padding:"20px 24px", marginTop:8,
            display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:16,
                fontWeight:700, color:"#FFD700", marginBottom:4}}>Pagamento pendente</div>
              <div style={{fontSize:13, color:"#6b8a62"}}>
                Complete o pagamento para ativar sua inscrição.</div>
            </div>
            <button style={{...s.btn, background:"#FFD700"}}
              onClick={()=>navigate('/pagamento')}>
              PAGAR AGORA
            </button>
          </div>
        )}

      </div>
    </div>
  )
}