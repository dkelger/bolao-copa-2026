import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:900, margin:"0 auto" },
  card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:20, marginBottom:16 },
  btn: { background:"#00C853", color:"#080d0a", border:"none", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, letterSpacing:1.5, padding:"10px 20px", cursor:"pointer" },
  btnRed: { background:"rgba(255,70,70,.15)", color:"#ff7070", border:"1px solid rgba(255,70,70,.3)", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, padding:"8px 16px", cursor:"pointer" },
  btnOut: { background:"transparent", color:"#6b8a62", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, padding:"8px 16px", cursor:"pointer" },
  input: { background:"rgba(255,255,255,.05)", border:"1.5px solid rgba(0,200,83,.16)", borderRadius:8, color:"#dff0d8", fontFamily:"'Barlow', sans-serif", fontSize:14, padding:"10px 14px", outline:"none" },
  tab: (active) => ({ fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, letterSpacing:1, textTransform:"uppercase", padding:"8px 18px", borderRadius:10, border: active?"none":"1px solid rgba(0,200,83,.16)", background: active?"#00C853":"transparent", color: active?"#080d0a":"#6b8a62", cursor:"pointer" }),
  th: { fontFamily:"'Barlow Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#6b8a62", padding:"10px 14px", textAlign:"left", borderBottom:"1px solid rgba(0,200,83,.16)" },
  td: { padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,.05)", fontSize:14 },
}

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('partidas')
  const [matches, setMatches] = useState([])
  const [users, setUsers] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)
  const [editMatch, setEditMatch] = useState(null)
  const [placar, setPlacar] = useState({ a:'', b:'' })
  const [newQuiz, setNewQuiz] = useState(false)
  const [quiz, setQuiz] = useState({ pergunta:'', a:'', b:'', c:'', d:'', correta:'A', expira:'' })
  const [notif, setNotif] = useState({ titulo:'', mensagem:'' })
  const [stats, setStats] = useState({ participantes:0, arrecadado:0, ativos:0 })
  const [autorizado, setAutorizado] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user || data.user.email !== 'dkelger@gmail.com') {
        setAutorizado(false)
        navigate('/')
      } else {
        setAutorizado(true)
        loadAll()
      }
    })
  }, [])

  async function loadAll() {
    const [{ data: m }, { data: u }, { data: q }] = await Promise.all([
      supabase.from('matches').select('*, team_a:teams!matches_team_a_id_fkey(nome), team_b:teams!matches_team_b_id_fkey(nome)').order('data_hora'),
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
    ])
    setMatches(m || [])
    setUsers(u || [])
    setQuizzes(q || [])
    const ativos = (u || []).filter(x => x.status === 'ativo').length
    setStats({ participantes: (u||[]).length, arrecadado: ativos * 50, ativos })
  }

  async function lancarResultado(match) {
    setLoading(true)
    const pa = parseInt(placar.a), pb = parseInt(placar.b)
    const vencedor = pa > pb ? match.team_a_id : pb > pa ? match.team_b_id : null
    await supabase.from('matches').update({
      placar_a: pa, placar_b: pb,
      vencedor_id: vencedor,
      status: 'encerrado',
      updated_at: new Date().toISOString()
    }).eq('id', match.id)
    setEditMatch(null); setPlacar({ a:'', b:'' })
    await calcularPontos(match, pa, pb, vencedor)
    await loadAll(); setLoading(false)
  }

  async function calcularPontos(match, pa, pb, vencedor) {
    const { data: picks } = await supabase.from('picks')
      .select('user_id, team_id')
      .in('team_id', [match.team_a_id, match.team_b_id])

    if (!picks) return
    const logs = []

    for (const pick of picks) {
      const isTeamA = pick.team_id === match.team_a_id
      const teamScore = isTeamA ? pa : pb
      const opponentScore = isTeamA ? pb : pa

      let pontos = 0, tipo = '', desc = ''
      if (match.fase === 'grupos') {
        if (teamScore > opponentScore) { pontos = 3; tipo = 'vitoria_grupo'; desc = 'Vitoria na fase de grupos +3pts' }
        else if (teamScore === opponentScore) { pontos = 1; tipo = 'empate_grupo'; desc = 'Empate na fase de grupos +1pt' }
        else { pontos = 0; tipo = 'derrota_grupo'; desc = 'Derrota na fase de grupos' }
      } else {
        if (pick.team_id === vencedor) {
          pontos = 3; tipo = 'mata_mata_normal'; desc = 'Avancou no mata-mata +3pts'
        }
      }

      if (pontos > 0) {
        logs.push({ user_id: pick.user_id, team_id: pick.team_id, match_id: match.id, tipo, pontos, descricao: desc })
      }
    }

    if (logs.length > 0) await supabase.from('points_log').insert(logs)
  }

  async function ativarUsuario(userId) {
    await supabase.from('users').update({ status: 'ativo' }).eq('id', userId)
    loadAll()
  }

  async function publicarQuiz() {
    setLoading(true)
    const alternativas = [
      { id:'A', texto: quiz.a }, { id:'B', texto: quiz.b },
      { id:'C', texto: quiz.c }, { id:'D', texto: quiz.d },
    ].filter(x => x.texto)
    await supabase.from('quizzes').insert({
      pergunta: quiz.pergunta,
      alternativas,
      resposta_correta: quiz.correta,
      publicado: true,
      publicado_em: new Date().toISOString(),
      expira_em: quiz.expira || new Date(Date.now() + 24*60*60*1000).toISOString(),
    })
    setQuiz({ pergunta:'', a:'', b:'', c:'', d:'', correta:'A', expira:'' })
    setNewQuiz(false); loadAll(); setLoading(false)
  }

  const FASE_LABEL = { grupos:'Grupos', oitavas:'Oitavas', quartas:'Quartas', semi:'Semi', final:'Final' }

  if (autorizado === null) return (
    <div style={{background:'#080d0a', minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center', color:'#00C853', fontSize:18}}>
      Verificando acesso...
    </div>
  )

  if (!autorizado) return null

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        {/* HEADER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#6b8a62", marginBottom:4 }}>PAINEL</div>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:44, color:"white", letterSpacing:3 }}>ADMINISTRADOR</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={s.btnOut} onClick={() => navigate('/')}>← INICIO</button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
          {[
            { val: stats.participantes, label:"Inscritos", color:"#dff0d8" },
            { val: stats.ativos, label:"Pagamentos confirmados", color:"#00C853" },
            { val: `R$ ${(stats.arrecadado).toLocaleString('pt-BR')}`, label:"Arrecadado", color:"#FFD700" },
            { val: `R$ ${Math.round(stats.arrecadado * 0.85).toLocaleString('pt-BR')}`, label:"Fundo premios", color:"#00C853" },
          ].map(st => (
            <div key={st.label} style={s.card}>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:38, color:st.color, lineHeight:1 }}>{st.val}</div>
              <div style={{ fontSize:12, color:"#6b8a62", textTransform:"uppercase", letterSpacing:1, fontWeight:600, marginTop:4 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
          {[['partidas','⚽ Partidas'],['participantes','👥 Participantes'],['quizzes','🧠 Quizzes'],['notif','🔔 Notificacoes']].map(([id,label]) => (
            <button key={id} style={s.tab(tab===id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* PARTIDAS */}
        {tab==='partidas' && (
          <div style={s.card}>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700, marginBottom:16 }}>Lancar Resultados</div>
            {matches.length === 0 ? (
              <p style={{ color:"#6b8a62", fontSize:14 }}>Nenhuma partida cadastrada ainda.</p>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={s.th}>Partida</th>
                      <th style={s.th}>Fase</th>
                      <th style={s.th}>Placar</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map(m => (
                      <tr key={m.id}>
                        <td style={s.td}><strong>{m.team_a?.nome}</strong> vs <strong>{m.team_b?.nome}</strong></td>
                        <td style={s.td}><span style={{ color:"#6b8a62" }}>{FASE_LABEL[m.fase]||m.fase}</span></td>
                        <td style={s.td}>
                          {editMatch===m.id ? (
                            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                              <input style={{ ...s.input, width:48, textAlign:"center" }} value={placar.a} onChange={e=>setPlacar({...placar,a:e.target.value})} placeholder="0"/>
                              <span style={{ color:"#6b8a62" }}>x</span>
                              <input style={{ ...s.input, width:48, textAlign:"center" }} value={placar.b} onChange={e=>setPlacar({...placar,b:e.target.value})} placeholder="0"/>
                            </div>
                          ) : (
                            <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700, color: m.status==='encerrado'?"#00C853":"#6b8a62" }}>
                              {m.status==='encerrado' ? `${m.placar_a} x ${m.placar_b}` : '- x -'}
                            </span>
                          )}
                        </td>
                        <td style={s.td}>
                          <span style={{ background: m.status==='encerrado'?"rgba(0,200,83,.12)":"rgba(255,255,255,.06)", color: m.status==='encerrado'?"#00C853":"#6b8a62", border: `1px solid ${m.status==='encerrado'?"rgba(0,200,83,.25)":"rgba(255,255,255,.1)"}`, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
                            {m.status}
                          </span>
                        </td>
                        <td style={s.td}>
                          {m.status !== 'encerrado' && (
                            editMatch===m.id ? (
                              <div style={{ display:"flex", gap:6 }}>
                                <button style={s.btn} onClick={()=>lancarResultado(m)} disabled={loading}>SALVAR</button>
                                <button style={s.btnOut} onClick={()=>setEditMatch(null)}>X</button>
                              </div>
                            ) : (
                              <button style={s.btnOut} onClick={()=>{ setEditMatch(m.id); setPlacar({a:'',b:''}) }}>LANCAR</button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PARTICIPANTES */}
        {tab==='participantes' && (
          <div style={s.card}>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700, marginBottom:16 }}>
              Participantes ({users.length})
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Nome</th>
                    <th style={s.th}>E-mail</th>
                    <th style={s.th}>WhatsApp</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={s.td}><strong>{u.nome}</strong></td>
                      <td style={s.td}><span style={{ color:"#6b8a62" }}>{u.email}</span></td>
                      <td style={s.td}>{u.whatsapp || '-'}</td>
                      <td style={s.td}>
                        <span style={{ background: u.status==='ativo'?"rgba(0,200,83,.12)":"rgba(255,215,0,.1)", color: u.status==='ativo'?"#00C853":"#FFD700", border: `1px solid ${u.status==='ativo'?"rgba(0,200,83,.25)":"rgba(255,215,0,.25)"}`, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        {u.status === 'pendente' && (
                          <button style={s.btn} onClick={() => ativarUsuario(u.id)}>ATIVAR</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUIZZES */}
        {tab==='quizzes' && (
          <div>
            <button style={{ ...s.btn, marginBottom:16 }} onClick={() => setNewQuiz(!newQuiz)}>
              + CRIAR QUIZ
            </button>
            {newQuiz && (
              <div style={s.card}>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700, marginBottom:16 }}>Novo Quiz</div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, color:"#6b8a62", display:"block", marginBottom:6 }}>PERGUNTA</label>
                  <textarea style={{ ...s.input, width:"100%", minHeight:80, resize:"vertical" }}
                    value={quiz.pergunta} onChange={e=>setQuiz({...quiz,pergunta:e.target.value})} placeholder="Digite a pergunta..."/>
                </div>
                {[['a','A'],['b','B'],['c','C'],['d','D']].map(([key,label]) => (
                  <div key={key} style={{ marginBottom:10, display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:900, width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>{label}</span>
                    <input style={{ ...s.input, flex:1 }} value={quiz[key]} onChange={e=>setQuiz({...quiz,[key]:e.target.value})} placeholder={`Alternativa ${label}...`}/>
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, color:"#6b8a62", display:"block", marginBottom:6 }}>RESPOSTA CORRETA</label>
                  <select style={{ ...s.input }} value={quiz.correta} onChange={e=>setQuiz({...quiz,correta:e.target.value})}>
                    {['A','B','C','D'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button style={s.btnOut} onClick={() => setNewQuiz(false)}>CANCELAR</button>
                  <button style={s.btn} onClick={publicarQuiz} disabled={loading||!quiz.pergunta||!quiz.a||!quiz.b}>
                    {loading ? 'Publicando...' : 'PUBLICAR'}
                  </button>
                </div>
              </div>
            )}
            <div style={s.card}>
              {quizzes.length === 0 ? (
                <p style={{ color:"#6b8a62", fontSize:14 }}>Nenhum quiz criado ainda.</p>
              ) : quizzes.map(q => (
                <div key={q.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,.05)", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{q.pergunta}</div>
                    <span style={{ background: q.publicado?"rgba(0,200,83,.12)":"rgba(255,255,255,.06)", color: q.publicado?"#00C853":"#6b8a62", border:`1px solid ${q.publicado?"rgba(0,200,83,.25)":"rgba(255,255,255,.1)"}`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                      {q.publicado ? 'publicado' : 'rascunho'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICACOES */}
        {tab==='notif' && (
          <div style={s.card}>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700, marginBottom:16 }}>Enviar Notificacao</div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:"#6b8a62", display:"block", marginBottom:6 }}>TITULO</label>
              <input style={{ ...s.input, width:"100%" }} value={notif.titulo} onChange={e=>setNotif({...notif,titulo:e.target.value})} placeholder="Ex: Quiz novo disponivel!"/>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:"#6b8a62", display:"block", marginBottom:6 }}>MENSAGEM</label>
              <textarea style={{ ...s.input, width:"100%", minHeight:100, resize:"vertical" }}
                value={notif.mensagem} onChange={e=>setNotif({...notif,mensagem:e.target.value})} placeholder="Texto da notificacao..."/>
            </div>
            <button style={s.btn} onClick={async () => {
              await supabase.from('notifications').insert({ tipo:'custom', titulo:notif.titulo, mensagem:notif.mensagem, canal:'push' })
              setNotif({ titulo:'', mensagem:'' })
              alert('Notificacao salva!')
            }}>SALVAR NOTIFICACAO</button>
          </div>
        )}

      </div>
    </div>
  )
}