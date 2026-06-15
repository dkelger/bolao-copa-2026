import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

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

export default function Ranking() {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [selStats, setSelStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [expandido, setExpandido] = useState({})

  useEffect(()=>{
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) { navigate('/login'); return }
      setCurrentUserId(data.session.user.id)
      loadRanking()
      const interval = setInterval(loadRanking, 30000)
      return () => clearInterval(interval)
    })
  },[])

  async function loadRanking() {
    const [{ data: users }, { data: pts }, { data: picks }] = await Promise.all([
      supabase.from('users').select('id, nome, status').neq('status', 'admin'),
      supabase.from('points_log').select('user_id, team_id, pontos, tipo'),
      supabase.from('picks').select('user_id, team_id, teams(nome)'),
    ])

    if (!users) { setLoading(false); return }

    const map = {}
    users.forEach(u => {
      map[u.id] = { nome: u.nome, status: u.status, total: 0, quiz: 0, picks: [] }
    })

    ;(pts || []).forEach(row => {
      if (!map[row.user_id]) return
      map[row.user_id].total += Number(row.pontos)
      if (row.tipo === 'quiz') map[row.user_id].quiz += Number(row.pontos)
    })

    // Pontos por team_id para cada user
    const ptsPerTeam = {}
    ;(pts || []).forEach(row => {
      if (!row.team_id) return
      const key = `${row.user_id}__${row.team_id}`
      ptsPerTeam[key] = (ptsPerTeam[key] || 0) + Number(row.pontos)
    })

    ;(picks || []).forEach(p => {
      if (!map[p.user_id]) return
      const key = `${p.user_id}__${p.team_id}`
      map[p.user_id].picks.push({
        nome: p.teams?.nome,
        team_id: p.team_id,
        pontos: ptsPerTeam[key] || 0
      })
    })

    const sorted = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a,b) => b.total - a.total)

    setRanking(sorted)

    // Minipainel
    const totalAtivos = users.filter(u => u.status === 'ativo').length || 1
    const countMap = {}
    ;(picks || []).forEach(p => {
      const nome = p.teams?.nome
      if (!nome) return
      countMap[nome] = (countMap[nome] || 0) + 1
    })
    const selSorted = Object.entries(countMap)
      .map(([nome, count]) => ({ nome, count, pct: Math.round(count / totalAtivos * 100) }))
      .sort((a,b) => b.count - a.count)
    setSelStats(selSorted)

    setLoading(false)
  }

  const medals = ['🥇','🥈','🥉']
  const toggleExpandido = (id) => setExpandido(prev => ({ ...prev, [id]: !prev[id] }))

  const maxCount = selStats.length > 0 ? selStats[0].count : 1

  return (
    <div style={{background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px"}}>
      <div style={{maxWidth:820, margin:"0 auto"}}>

        <button onClick={()=>navigate('/dashboard')}
          style={{background:"transparent", border:"none", color:"#6b8a62",
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700,
            letterSpacing:1, cursor:"pointer", marginBottom:24, padding:0}}>
          ← VOLTAR
        </button>

        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
            fontWeight:700, letterSpacing:2, textTransform:"uppercase",
            color:"#6b8a62", marginBottom:4}}>Classificação geral</div>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44,
            color:"white", letterSpacing:3}}>CLASSIFICAÇÃO</div>
        </div>

        {loading ? (
          <p style={{color:"#FFD700"}}>Carregando classificação...</p>
        ) : (
          <>
            {/* GRÁFICO DE COLUNAS — SELEÇÕES MAIS ESCOLHIDAS */}
            {selStats.length > 0 && (
              <div style={{background:"#1a2418", border:"1px solid rgba(0,200,83,.16)",
                borderRadius:14, padding:"20px 20px 8px", marginBottom:20}}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
                  fontWeight:700, letterSpacing:2, textTransform:"uppercase",
                  color:"#6b8a62", marginBottom:16}}>🏳️ Seleções mais escolhidas</div>

                {/* Gráfico */}
                <div style={{overflowX:"auto", paddingBottom:8}}>
                  <div style={{display:"flex", alignItems:"flex-end", gap:6, minWidth: selStats.length * 56, height:120}}>
                    {selStats.map((s, i) => {
                      const h = Math.max(12, Math.round((s.count / maxCount) * 100))
                      const cor = i === 0 ? "#FFD700" : i === 1 ? "#b0b0b0" : i === 2 ? "#cd7f32" : "#00C853"
                      return (
                        <div key={s.nome} style={{display:"flex", flexDirection:"column",
                          alignItems:"center", flex:"1 0 48px", gap:4}}>
                          {/* % em cima */}
                          <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                            fontSize:11, fontWeight:700, color:cor}}>{s.pct}%</div>
                          {/* Coluna */}
                          <div style={{width:"100%", maxWidth:44, borderRadius:"4px 4px 0 0",
                            height:`${h}px`,
                            background:`linear-gradient(to top, ${cor}cc, ${cor}66)`,
                            border:`1px solid ${cor}44`,
                            transition:"height .4s ease",
                            position:"relative"}}>
                          </div>
                          {/* Bandeira */}
                          <div style={{fontSize:16, lineHeight:1}}>{BANDEIRAS[s.nome] || '🏴'}</div>
                          {/* Nome curto */}
                          <div style={{fontSize:9, color:"#6b8a62", textAlign:"center",
                            lineHeight:1.2, maxWidth:44, overflow:"hidden",
                            whiteSpace:"nowrap", textOverflow:"ellipsis"}}>
                            {s.nome.split(' ')[0]}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Legenda top 3 */}
                <div style={{display:"flex", gap:12, flexWrap:"wrap", marginTop:12,
                  paddingTop:12, borderTop:"1px solid rgba(255,255,255,.05)"}}>
                  {selStats.slice(0,5).map((s,i) => {
                    const cor = i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#00C853"
                    return (
                      <div key={s.nome} style={{display:"flex", alignItems:"center", gap:6}}>
                        <span style={{fontSize:14}}>{BANDEIRAS[s.nome] || '🏴'}</span>
                        <span style={{fontSize:12, color:"#dff0d8"}}>{s.nome}</span>
                        <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                          fontSize:13, fontWeight:700, color:cor}}>{s.count}x · {s.pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* RANKING */}
            <div style={{background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:"8px 0"}}>
              {ranking.map((r,i)=>{
                const isMe = r.id === currentUserId
                const aberto = expandido[r.id]
                return (
                  <div key={r.id}>
                    <div onClick={() => toggleExpandido(r.id)}
                      style={{display:"flex", alignItems:"center", gap:14,
                        padding:"13px 20px", cursor:"pointer",
                        background: isMe ? "rgba(0,200,83,.06)" : "transparent",
                        transition:"background .15s"}}>

                      <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:22,
                        fontWeight:900, minWidth:36, textAlign:"center",
                        color:i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#6b8a62"}}>
                        {i<3 ? medals[i] : i+1}
                      </div>

                      <div style={{width:40, height:40, borderRadius:"50%",
                        background: isMe ? "rgba(0,200,83,.2)" : "#1f2d1b",
                        border:`2px solid ${isMe ? "rgba(0,200,83,.6)" : "rgba(0,200,83,.2)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, flexShrink:0}}>
                        {r.nome?.charAt(0).toUpperCase()}
                      </div>

                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:15, fontWeight:600, color: isMe ? "#00C853" : "#dff0d8"}}>
                          {r.nome} {isMe && <span style={{fontSize:11, opacity:.7}}>(você)</span>}
                        </div>
                        {/* Seleções inline com pontos */}
                        {r.picks.length > 0 && (
                          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:4}}>
                            {r.picks.map(p => (
                              <span key={p.nome} style={{fontSize:12, color:"#6b8a62",
                                display:"flex", alignItems:"center", gap:3}}>
                                {BANDEIRAS[p.nome] || '🏴'}
                                <span>{p.nome?.split(' ')[0]}</span>
                                {p.pontos > 0 && (
                                  <span style={{color:"#00C853", fontWeight:700}}>+{p.pontos.toFixed(1)}</span>
                                )}
                              </span>
                            )).reduce((acc, el, idx) => idx === 0 ? [el] : [...acc,
                              <span key={`s${idx}`} style={{color:"rgba(255,255,255,.1)", fontSize:10}}>|</span>, el], [])}
                          </div>
                        )}
                        {r.status === 'cancelado' && (
                          <div style={{fontSize:11, color:"#ff7070", marginTop:2}}>cancelado</div>
                        )}
                      </div>

                      <div style={{display:"flex", alignItems:"center", gap:10, flexShrink:0}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                            fontSize:28, fontWeight:900, lineHeight:1,
                            color: isMe ? "#00C853" : r.total > 0 ? "#dff0d8" : "#6b8a62"}}>
                            {r.total.toFixed(1)}
                          </div>
                          {r.quiz > 0 && (
                            <div style={{fontSize:11, color:"#6b8a62"}}>🧠 {r.quiz.toFixed(1)}</div>
                          )}
                        </div>
                        <div style={{color:"#6b8a62", fontSize:11,
                          transform: aberto ? "rotate(180deg)" : "rotate(0deg)",
                          transition:"transform .2s"}}>▼</div>
                      </div>
                    </div>

                    {/* Expandido */}
                    {aberto && (
                      <div style={{margin:"0 16px 12px", background:"rgba(0,0,0,.25)",
                        border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"16px"}}>

                        <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
                          fontWeight:700, letterSpacing:2, color:"#6b8a62",
                          textTransform:"uppercase", marginBottom:12}}>Seleções e pontos</div>

                        {r.picks.length === 0 ? (
                          <div style={{fontSize:13, color:"#6b8a62"}}>Sem seleções registradas</div>
                        ) : (
                          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:16}}>
                            {r.picks.map(p => (
                              <div key={p.nome} style={{background:"rgba(0,200,83,.06)",
                                border:"1px solid rgba(0,200,83,.15)", borderRadius:12,
                                padding:"12px 14px", display:"flex", alignItems:"center",
                                justifyContent:"space-between"}}>
                                <div style={{display:"flex", alignItems:"center", gap:8}}>
                                  <span style={{fontSize:22}}>{BANDEIRAS[p.nome] || '🏴'}</span>
                                  <div>
                                    <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                                      fontSize:14, fontWeight:700, color:"#dff0d8"}}>{p.nome}</div>
                                    <div style={{fontSize:11, color:"#6b8a62"}}>seleção</div>
                                  </div>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                                    fontSize:22, fontWeight:900,
                                    color: p.pontos > 0 ? "#00C853" : "#6b8a62"}}>
                                    {p.pontos > 0 ? `+${p.pontos.toFixed(1)}` : "0"}
                                  </div>
                                  <div style={{fontSize:10, color:"#6b8a62"}}>pts</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Resumo pontos */}
                        <div style={{display:"flex", gap:16, flexWrap:"wrap",
                          paddingTop:12, borderTop:"1px solid rgba(255,255,255,.05)"}}>
                          {[
                            { label:"TOTAL", val: r.total.toFixed(1), cor:"#dff0d8" },
                            { label:"⚽ JOGOS", val: (r.total - r.quiz).toFixed(1), cor:"#FFD700" },
                            { label:"🧠 QUIZ", val: r.quiz.toFixed(1), cor:"#00C853" },
                          ].map(item => (
                            <div key={item.label}>
                              <div style={{fontSize:10, color:"#6b8a62", letterSpacing:1,
                                textTransform:"uppercase", marginBottom:2}}>{item.label}</div>
                              <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                                fontSize:22, fontWeight:700, color:item.cor}}>{item.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {i<ranking.length-1 && (
                      <div style={{height:1, background:"rgba(255,255,255,.04)", margin:"0 16px"}}/>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{textAlign:"center", marginTop:16, fontSize:13, color:"#6b8a62"}}>
              Atualizado a cada 30s · Clique num participante para ver detalhes
            </div>
          </>
        )}
      </div>
    </div>
  )
}