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

const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:780, margin:"0 auto" },
  card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:"8px 0" },
}

export default function Ranking() {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [selStats, setSelStats] = useState([]) // minipainel seleções
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [expandido, setExpandido] = useState({}) // quais linhas estão expandidas

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
      supabase.from('points_log').select('user_id, pontos, tipo'),
      supabase.from('picks').select('user_id, teams(nome)'),
    ])

    if (!users) { setLoading(false); return }

    // Monta mapa de pontos totais e quiz por usuário
    const map = {}
    users.forEach(u => { map[u.id] = { nome: u.nome, status: u.status, total: 0, quiz: 0, picks: [] } })
    ;(pts || []).forEach(row => {
      if (!map[row.user_id]) return
      map[row.user_id].total += Number(row.pontos)
      if (row.tipo === 'quiz') map[row.user_id].quiz += Number(row.pontos)
    })

    // Associa picks a cada usuário
    ;(picks || []).forEach(p => {
      if (map[p.user_id]) map[p.user_id].picks.push(p.teams?.nome)
    })

    const sorted = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a,b) => b.total - a.total)

    setRanking(sorted)

    // Minipainel — conta quantos escolheram cada seleção
    const countMap = {}
    const totalAtivos = users.filter(u => u.status === 'ativo').length || 1
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

  const toggleExpandido = (id) => {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
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
            {/* RANKING */}
            <div style={s.card}>
              {ranking.map((r,i)=>{
                const isMe = r.id === currentUserId
                const aberto = expandido[r.id]
                return (
                  <div key={r.id}>
                    {/* Linha principal */}
                    <div
                      onClick={() => toggleExpandido(r.id)}
                      style={{display:"flex", alignItems:"center", gap:14,
                        padding:"13px 20px", borderRadius:10, cursor:"pointer",
                        background: isMe ? "rgba(0,200,83,.06)" : "transparent",
                        transition:"background .15s"}}>

                      {/* Posição */}
                      <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:22,
                        fontWeight:900, minWidth:36, textAlign:"center",
                        color:i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#6b8a62"}}>
                        {i<3 ? medals[i] : i+1}
                      </div>

                      {/* Avatar */}
                      <div style={{width:40, height:40, borderRadius:"50%",
                        background: isMe ? "rgba(0,200,83,.2)" : "#1f2d1b",
                        border:`2px solid ${isMe ? "rgba(0,200,83,.6)" : "rgba(0,200,83,.2)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, flexShrink:0}}>
                        {r.nome?.charAt(0).toUpperCase()}
                      </div>

                      {/* Nome + seleções */}
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:15, fontWeight:600, color: isMe ? "#00C853" : "#dff0d8"}}>
                          {r.nome} {isMe && <span style={{fontSize:11, opacity:.7}}>(você)</span>}
                        </div>
                        {/* Seleções inline */}
                        {r.picks.length > 0 && (
                          <div style={{display:"flex", gap:4, flexWrap:"wrap", marginTop:4}}>
                            {r.picks.map(p => (
                              <span key={p} style={{fontSize:12, color:"#6b8a62"}}>
                                {BANDEIRAS[p] || '🏴'} {p}
                              </span>
                            )).reduce((acc, el, idx) => idx === 0 ? [el] : [...acc,
                              <span key={`sep${idx}`} style={{color:"rgba(255,255,255,.15)", fontSize:12}}>·</span>, el], [])}
                          </div>
                        )}
                        {r.status === 'cancelado' && (
                          <div style={{fontSize:11, color:"#ff7070", marginTop:2}}>cancelado</div>
                        )}
                        {r.status === 'pendente' && (
                          <div style={{fontSize:11, color:"#FFD700", marginTop:2}}>pagamento pendente</div>
                        )}
                      </div>

                      {/* Pontos + seta */}
                      <div style={{display:"flex", alignItems:"center", gap:10}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                            fontSize:28, fontWeight:900, lineHeight:1,
                            color: isMe ? "#00C853" : r.total > 0 ? "#dff0d8" : "#6b8a62"}}>
                            {r.total.toFixed(1)}
                          </div>
                          {r.quiz > 0 && (
                            <div style={{fontSize:11, color:"#6b8a62", textAlign:"right"}}>
                              🧠 {r.quiz.toFixed(1)} quiz
                            </div>
                          )}
                        </div>
                        <div style={{color:"#6b8a62", fontSize:12, transition:"transform .2s",
                          transform: aberto ? "rotate(180deg)" : "rotate(0deg)"}}>▼</div>
                      </div>
                    </div>

                    {/* Painel expandido */}
                    {aberto && (
                      <div style={{margin:"0 16px 12px", background:"rgba(0,0,0,.2)",
                        border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"14px 16px"}}>
                        <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
                          fontWeight:700, letterSpacing:2, color:"#6b8a62",
                          textTransform:"uppercase", marginBottom:10}}>Seleções escolhidas</div>
                        {r.picks.length === 0 ? (
                          <div style={{fontSize:13, color:"#6b8a62"}}>Sem seleções registradas</div>
                        ) : (
                          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
                            {r.picks.map(p => (
                              <div key={p} style={{background:"rgba(0,200,83,.08)",
                                border:"1px solid rgba(0,200,83,.2)", borderRadius:20,
                                padding:"4px 14px", fontSize:13, color:"#00C853", fontWeight:700,
                                display:"flex", alignItems:"center", gap:6}}>
                                {BANDEIRAS[p] || '🏴'} {p}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:"flex", gap:20, flexWrap:"wrap", paddingTop:10,
                          borderTop:"1px solid rgba(255,255,255,.05)"}}>
                          <div>
                            <div style={{fontSize:11, color:"#6b8a62", marginBottom:2}}>PONTOS TOTAIS</div>
                            <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                              fontSize:22, fontWeight:700, color:"#dff0d8"}}>{r.total.toFixed(1)}</div>
                          </div>
                          <div>
                            <div style={{fontSize:11, color:"#6b8a62", marginBottom:2}}>PONTOS DE QUIZ 🧠</div>
                            <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                              fontSize:22, fontWeight:700, color:"#00C853"}}>{r.quiz.toFixed(1)}</div>
                          </div>
                          <div>
                            <div style={{fontSize:11, color:"#6b8a62", marginBottom:2}}>PONTOS DE JOGOS ⚽</div>
                            <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                              fontSize:22, fontWeight:700, color:"#FFD700"}}>{(r.total - r.quiz).toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {i<ranking.length-1 && <div style={{height:1,
                      background:"rgba(255,255,255,.04)", margin:"0 16px"}}/>}
                  </div>
                )
              })}
            </div>

            {/* MINIPAINEL SELEÇÕES */}
            {selStats.length > 0 && (
              <div style={{marginTop:24, background:"#1a2418",
                border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:20}}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
                  fontWeight:700, letterSpacing:2, textTransform:"uppercase",
                  color:"#6b8a62", marginBottom:16}}>🏳️ Seleções mais escolhidas</div>
                <div style={{display:"flex", flexDirection:"column", gap:10}}>
                  {selStats.map((s, i) => (
                    <div key={s.nome}>
                      <div style={{display:"flex", justifyContent:"space-between",
                        alignItems:"center", marginBottom:5}}>
                        <div style={{display:"flex", alignItems:"center", gap:8}}>
                          <span style={{fontSize:18}}>{BANDEIRAS[s.nome] || '🏴'}</span>
                          <span style={{fontSize:14, fontWeight:600}}>{s.nome}</span>
                        </div>
                        <div style={{display:"flex", alignItems:"center", gap:10}}>
                          <span style={{fontSize:13, color:"#6b8a62"}}>{s.count} {s.count === 1 ? 'pessoa' : 'pessoas'}</span>
                          <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                            fontSize:16, fontWeight:700,
                            color: i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#00C853"}}>
                            {s.pct}%
                          </span>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div style={{height:6, background:"rgba(255,255,255,.06)", borderRadius:3, overflow:"hidden"}}>
                        <div style={{
                          height:"100%", borderRadius:3,
                          width:`${s.pct}%`,
                          background: i===0
                            ? "linear-gradient(to right, #FFD700, #ffa500)"
                            : i===1
                            ? "linear-gradient(to right, #b0b0b0, #888)"
                            : i===2
                            ? "linear-gradient(to right, #cd7f32, #a06020)"
                            : "linear-gradient(to right, #00C853, #009a40)",
                          transition:"width .4s ease"
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{textAlign:"center", marginTop:16, fontSize:13, color:"#6b8a62"}}>
              Atualizado automaticamente a cada 30 segundos · Clique em um participante para ver detalhes
            </div>
          </>
        )}
      </div>
    </div>
  )
}