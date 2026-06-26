import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const BANDEIRAS = {
  'México':'🇲🇽','África do Sul':'🇿🇦','Coreia do Sul':'🇰🇷','República Tcheca':'🇨🇿',
  'Canadá':'🇨🇦','Catar':'🇶🇦','Suíça':'🇨🇭','Itália':'🇮🇹',
  'Brasil':'🇧🇷','Marrocos':'🇲🇦','Haiti':'🇭🇹','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos':'🇺🇸','Paraguai':'🇵🇾','Austrália':'🇦🇺','Turquia':'🇹🇷',
  'Alemanha':'🇩🇪','Curaçao':'🇨🇼','Costa do Marfim':'🇨🇮','Equador':'🇪🇨',
  'Holanda':'🇳🇱','Japão':'🇯🇵','Tunísia':'🇹🇳','Ucrânia':'🇺🇦','Suécia':'🇸🇪',
  'Bélgica':'🇧🇪','Egito':'🇪🇬','Irã':'🇮🇷','Nova Zelândia':'🇳🇿',
  'Espanha':'🇪🇸','Cabo Verde':'🇨🇻','Arábia Saudita':'🇸🇦','Uruguai':'🇺🇾',
  'França':'🇫🇷','Senegal':'🇸🇳','Noruega':'🇳🇴','Iraque':'🇮🇶',
  'Argentina':'🇦🇷','Argélia':'🇩🇿','Áustria':'🇦🇹','Jordânia':'🇯🇴',
  'Portugal':'🇵🇹','Uzbequistão':'🇺🇿','Colômbia':'🇨🇴','RD Congo':'🇨🇩',
  'Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croácia':'🇭🇷','Gana':'🇬🇭','Panamá':'🇵🇦',
  'Bósnia e Herzegovina':'🇧🇦'
}

// Tipos de pontos por seleção (jogos)
const TIPOS_GRUPO = ['vitoria_grupo','empate_grupo','derrota_grupo']
const TIPOS_CLASSIF = ['classificacao_grupo']
const TIPOS_MATA = ['mata_mata_normal','mata_mata_penaltis']

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
      map[u.id] = {
        nome: u.nome, status: u.status,
        total: 0,
        jogosGrupo: 0,    // vitoria/empate fase grupos
        classif: 0,        // classificacao_grupo (1º/2º/3º)
        mataMata: 0,       // mata-mata normal/penaltis
        quiz: 0,           // quiz normal
        quizBonus: 0,      // quiz bonus
        picks: []
      }
    })

    ;(pts || []).forEach(row => {
      if (!map[row.user_id]) return
      const p = Number(row.pontos)
      map[row.user_id].total += p
      if (row.tipo === 'quiz') map[row.user_id].quiz += p
      if (row.tipo === 'quiz_bonus') map[row.user_id].quizBonus += p
      if (row.tipo === 'classificacao_grupo') map[row.user_id].classif += p
      if (TIPOS_GRUPO.includes(row.tipo)) map[row.user_id].jogosGrupo += p
      if (TIPOS_MATA.includes(row.tipo)) map[row.user_id].mataMata += p
    })

    // Pontos por time — separado por categoria
    const ptsPerTeam = {}         // total por time
    const ptsGrupoPerTeam = {}    // só jogos de grupo
    const ptsClassifPerTeam = {}  // só classificação
    const ptsMataMataPerTeam = {} // só mata-mata

    ;(pts || []).forEach(row => {
      if (!row.team_id) return
      const key = `${row.user_id}__${row.team_id}`
      const p = Number(row.pontos)
      ptsPerTeam[key] = (ptsPerTeam[key] || 0) + p
      if (TIPOS_GRUPO.includes(row.tipo)) ptsGrupoPerTeam[key] = (ptsGrupoPerTeam[key] || 0) + p
      if (TIPOS_CLASSIF.includes(row.tipo)) ptsClassifPerTeam[key] = (ptsClassifPerTeam[key] || 0) + p
      if (TIPOS_MATA.includes(row.tipo)) ptsMataMataPerTeam[key] = (ptsMataMataPerTeam[key] || 0) + p
    })

    ;(picks || []).forEach(p => {
      if (!map[p.user_id]) return
      const key = `${p.user_id}__${p.team_id}`
      map[p.user_id].picks.push({
        nome: p.teams?.nome,
        team_id: p.team_id,
        pontos: ptsPerTeam[key] || 0,
        pontosGrupo: ptsGrupoPerTeam[key] || 0,
        pontosClassif: ptsClassifPerTeam[key] || 0,
        pontosMataMata: ptsMataMataPerTeam[key] || 0,
      })
    })

    const sorted = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a,b) => b.total - a.total)

    setRanking(sorted)

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
            {/* GRÁFICO SELEÇÕES */}
            {selStats.length > 0 && (
              <div style={{background:"#1a2418", border:"1px solid rgba(0,200,83,.16)",
                borderRadius:14, padding:"20px 20px 8px", marginBottom:20}}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
                  fontWeight:700, letterSpacing:2, textTransform:"uppercase",
                  color:"#6b8a62", marginBottom:16}}>🏳️ Seleções mais escolhidas</div>
                <div style={{overflowX:"auto", paddingBottom:8}}>
                  <div style={{display:"flex", alignItems:"flex-end", gap:6, minWidth: selStats.length * 56, height:120}}>
                    {selStats.map((s, i) => {
                      const h = Math.max(12, Math.round((s.count / maxCount) * 100))
                      const cor = i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#00C853"
                      return (
                        <div key={s.nome} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:"1 0 48px",gap:4}}>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,color:cor}}>{s.pct}%</div>
                          <div style={{width:"100%",maxWidth:44,borderRadius:"4px 4px 0 0",height:`${h}px`,background:`linear-gradient(to top,${cor}cc,${cor}66)`,border:`1px solid ${cor}44`,transition:"height .4s ease"}}/>
                          <div style={{fontSize:16,lineHeight:1}}>{BANDEIRAS[s.nome]||'🏴'}</div>
                          <div style={{fontSize:9,color:"#6b8a62",textAlign:"center",lineHeight:1.2,maxWidth:44,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{s.nome.split(' ')[0]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.05)"}}>
                  {selStats.slice(0,5).map((s,i) => {
                    const cor = i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#00C853"
                    return (
                      <div key={s.nome} style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:14}}>{BANDEIRAS[s.nome]||'🏴'}</span>
                        <span style={{fontSize:12,color:"#dff0d8"}}>{s.nome}</span>
                        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:cor}}>{s.count}x · {s.pct}%</span>
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

                // Tags inline resumidas
                const tags = []
                if (r.jogosGrupo > 0) tags.push({ label:`⚽ ${r.jogosGrupo.toFixed(1)}`, cor:'#6b8a62' })
                if (r.classif > 0) tags.push({ label:`🏆 ${r.classif.toFixed(1)}`, cor:'#b0b0b0' })
                if (r.mataMata > 0) tags.push({ label:`⚔️ ${r.mataMata.toFixed(1)}`, cor:'#ff8c00' })
                if (r.quiz > 0) tags.push({ label:`🧠 ${r.quiz.toFixed(1)}`, cor:'#00C853' })
                if (r.quizBonus > 0) tags.push({ label:`⚡ ${r.quizBonus.toFixed(1)}`, cor:'#FFD700' })

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
                        {/* Seleções inline */}
                        {r.picks.length > 0 && (
                          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:3}}>
                            {r.picks.map((p, idx) => (
                              <span key={p.nome} style={{fontSize:12, color:"#6b8a62", display:"flex", alignItems:"center", gap:3}}>
                                {idx > 0 && <span style={{color:"rgba(255,255,255,.1)", fontSize:10}}>|</span>}
                                {BANDEIRAS[p.nome] || '🏴'}
                                <span>{p.nome?.split(' ')[0]}</span>
                                {p.pontos > 0 && <span style={{color:"#00C853", fontWeight:700}}>+{p.pontos.toFixed(1)}</span>}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Tags de pontos por categoria */}
                        {tags.length > 0 && (
                          <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:3}}>
                            {tags.map(t => (
                              <span key={t.label} style={{fontSize:10, color:t.cor, fontWeight:700}}>{t.label}</span>
                            ))}
                          </div>
                        )}
                        {r.status === 'cancelado' && <div style={{fontSize:11, color:"#ff7070", marginTop:2}}>cancelado</div>}
                      </div>

                      <div style={{display:"flex", alignItems:"center", gap:10, flexShrink:0}}>
                        <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                          fontSize:28, fontWeight:900, lineHeight:1,
                          color: isMe ? "#00C853" : r.total > 0 ? "#dff0d8" : "#6b8a62"}}>
                          {r.total.toFixed(1)}
                        </div>
                        <div style={{color:"#6b8a62", fontSize:11,
                          transform: aberto ? "rotate(180deg)" : "rotate(0deg)",
                          transition:"transform .2s"}}>▼</div>
                      </div>
                    </div>

                    {/* EXPANDIDO */}
                    {aberto && (
                      <div style={{margin:"0 16px 12px", background:"rgba(0,0,0,.25)",
                        border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"16px"}}>

                        {/* Cards por seleção com detalhamento */}
                        <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
                          fontWeight:700, letterSpacing:2, color:"#6b8a62",
                          textTransform:"uppercase", marginBottom:12}}>Seleções e pontos</div>

                        {r.picks.length === 0 ? (
                          <div style={{fontSize:13, color:"#6b8a62"}}>Sem seleções registradas</div>
                        ) : (
                          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:16}}>
                            {r.picks.map(p => (
                              <div key={p.nome} style={{background:"rgba(0,200,83,.06)",
                                border:"1px solid rgba(0,200,83,.15)", borderRadius:12, padding:"12px 14px"}}>
                                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                                  <span style={{fontSize:22}}>{BANDEIRAS[p.nome] || '🏴'}</span>
                                  <div>
                                    <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                                      fontSize:14, fontWeight:700, color:"#dff0d8"}}>{p.nome}</div>
                                    <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                                      fontSize:20, fontWeight:900, color:"#00C853", lineHeight:1}}>
                                      {p.pontos > 0 ? `+${p.pontos.toFixed(1)}` : "0"}
                                    </div>
                                  </div>
                                </div>
                                {/* Detalhamento por tipo */}
                                <div style={{display:"flex", flexDirection:"column", gap:3,
                                  paddingTop:8, borderTop:"1px solid rgba(255,255,255,.05)"}}>
                                  {p.pontosGrupo > 0 && (
                                    <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                                      <span style={{color:"#6b8a62"}}>⚽ Fase grupos</span>
                                      <span style={{color:"#dff0d8", fontWeight:700}}>+{p.pontosGrupo.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {p.pontosClassif > 0 && (
                                    <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                                      <span style={{color:"#6b8a62"}}>🏆 Classificação</span>
                                      <span style={{color:"#b0b0b0", fontWeight:700}}>+{p.pontosClassif.toFixed(1)}</span>
                                    </div>
                                  )}
                                  {p.pontosMataMata > 0 && (
                                    <div style={{display:"flex", justifyContent:"space-between", fontSize:11}}>
                                      <span style={{color:"#6b8a62"}}>⚔️ Mata-mata</span>
                                      <span style={{color:"#ff8c00", fontWeight:700}}>+{p.pontosMataMata.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Resumo total */}
                        <div style={{display:"flex", gap:16, flexWrap:"wrap",
                          paddingTop:12, borderTop:"1px solid rgba(255,255,255,.05)"}}>
                          {[
                            { label:"TOTAL", val: r.total.toFixed(1), cor:"#dff0d8", show: true },
                            { label:"⚽ GRUPOS", val: r.jogosGrupo.toFixed(1), cor:"#6b8a62", show: r.jogosGrupo > 0 },
                            { label:"🏆 CLASSIF", val: r.classif.toFixed(1), cor:"#b0b0b0", show: r.classif > 0 },
                            { label:"⚔️ MATA-MATA", val: r.mataMata.toFixed(1), cor:"#ff8c00", show: r.mataMata > 0 },
                            { label:"🧠 QUIZ", val: r.quiz.toFixed(1), cor:"#00C853", show: r.quiz > 0 },
                            { label:"⚡ BÔNUS", val: r.quizBonus.toFixed(1), cor:"#FFD700", show: r.quizBonus > 0 },
                          ].filter(x => x.show).map(item => (
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