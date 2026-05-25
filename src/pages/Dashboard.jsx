import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

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
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [picks, setPicks]     = useState([])
  const [points, setPoints]   = useState([])
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ loadAll() },[])

  async function loadAll() {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/inscricao'); return }
    setUser(user)

    // Perfil
    const { data: prof } = await supabase
      .from('users').select('*').eq('id', user.id).single()
    setProfile(prof)

    // Picks com times
    const { data: picksData } = await supabase
      .from('picks').select('*, teams(nome, grupo, fase_atual, bandeira_url)')
      .eq('user_id', user.id)
    setPicks(picksData || [])

    // Histórico de pontos
    const { data: ptsData } = await supabase
      .from('points_log').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setPoints(ptsData || [])

    // Posição no ranking
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

        {/* HEADER */}
        <div style={{display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:16}}>
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
            <button style={s.btnOut} onClick={()=>navigate('/ranking')}>📊 RANKING</button>
            <button style={s.btnOut} onClick={()=>navigate('/quiz')}>🎯 QUIZZES</button>
            <button style={s.btnOut} onClick={handleLogout}>SAIR</button>
          </div>
        </div>

        {/* STATS */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
          gap:12, marginBottom:20}}>
          {[
            { val: totalPts.toFixed(1), label:"Pontos totais", color:"#FFD700" },
            { val: ranking?.pos || '—', label:"Posição", color:"#00C853" },
            { val: picks.length, label:"Times escolhidos", color:"#00C853" },
            { val: profile?.status === 'ativo' ? '✅' : '⏳', label:"Status", color:"#dff0d8" },
          ].map(st=>(
            <div key={st.label} style={s.stat}>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:40,
                color:st.color, lineHeight:1}}>{st.val}</div>
              <div style={{fontSize:12, color:"#6b8a62", textTransform:"uppercase",
                letterSpacing:1, fontWeight:600, marginTop:4}}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* MEUS TIMES */}
        <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
          fontWeight:700, letterSpacing:2, textTransform:"uppercase",
          color:"#6b8a62", marginBottom:12}}>MEUS TIMES</div>

        {picks.length === 0 ? (
          <div style={s.card}>
            <p style={{color:"#6b8a62", fontSize:14}}>Você ainda não escolheu seus times.</p>
            <button style={{...s.btn, marginTop:12}} onClick={()=>navigate('/inscricao')}>
              ESCOLHER TIMES →
            </button>
          </div>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
            gap:14, marginBottom:20}}>
            {picks.map(p=>{
              const timePts = points
                .filter(pt=>pt.team_id===p.team_id)
                .reduce((a,b)=>a+Number(b.pontos),0)
              return (
                <div key={p.id} style={s.card}>
                  <div style={{display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:12}}>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <span style={{fontSize:32}}>{p.teams?.bandeira_url || '🏴'}</span>
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
                        fontSize:42, color:"#00C853", lineHeight:1}}>{timePts.toFixed(1)}</div>
                      <div style={{fontSize:11, color:"#6b8a62"}}>pontos</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* HISTÓRICO */}
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

        {/* STATUS PAGAMENTO */}
        {profile?.status === 'pendente' && (
          <div style={{background:"rgba(255,215,0,.07)", border:"1px solid rgba(255,215,0,.2)",
            borderRadius:14, padding:"20px 24px", marginTop:8,
            display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
            <div>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:16,
                fontWeight:700, color:"#FFD700", marginBottom:4}}>⏳ Pagamento pendente</div>
              <div style={{fontSize:13, color:"#6b8a62"}}>
                Complete o pagamento para ativar sua inscrição.</div>
            </div>
            <button style={{...s.btn, background:"#FFD700"}}
              onClick={()=>navigate('/inscricao')}>
              PAGAR AGORA →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}