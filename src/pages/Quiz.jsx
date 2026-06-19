import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const TEMPO_BONUS = 40 // segundos para responder o quiz bônus

export default function Quiz() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [enviados, setEnviados] = useState({})
  const [msg, setMsg] = useState('')

  // Timer bônus
  const [timers, setTimers] = useState({}) // { [quizId]: segundos restantes }
  const [timerAtivo, setTimerAtivo] = useState({}) // { [quizId]: true/false }
  const intervalsRef = useRef({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session?.user) { navigate('/login'); return }
      setUser(data.session.user)
      carregarDados(data.session.user.id)
    })
    return () => {
      // Limpa todos os intervals ao desmontar
      Object.values(intervalsRef.current).forEach(clearInterval)
    }
  }, [])

  async function carregarDados(userId) {
    const { data: prof } = await supabase
      .from('users').select('status').eq('id', userId).single()
    setPerfil(prof)

    const { data: qs } = await supabase
      .from('quizzes')
      .select('*')
      .eq('publicado', true)
      .order('created_at', { ascending: false })

    const { data: resps } = await supabase
      .from('quiz_respostas')
      .select('quiz_id, resposta, acertou, pontos')
      .eq('user_id', userId)

    const jaRespondidos = {}
    resps?.forEach(r => { jaRespondidos[r.quiz_id] = { resposta: r.resposta, acertou: r.acertou, pontos: r.pontos } })
    setEnviados(jaRespondidos)
    setQuizzes(qs || [])
    setLoading(false)
  }

  // Inicia o timer de 40s para quiz bônus
  function iniciarTimerBonus(quizId) {
    if (timerAtivo[quizId] || enviados[quizId]) return
    setTimers(prev => ({ ...prev, [quizId]: TEMPO_BONUS }))
    setTimerAtivo(prev => ({ ...prev, [quizId]: true }))

    intervalsRef.current[quizId] = setInterval(() => {
      setTimers(prev => {
        const atual = prev[quizId] ?? TEMPO_BONUS
        if (atual <= 1) {
          clearInterval(intervalsRef.current[quizId])
          // Tempo esgotado — dá 1 ponto automaticamente
          registrarRespostaBonus(quizId, null, 'timeout')
          return { ...prev, [quizId]: 0 }
        }
        return { ...prev, [quizId]: atual - 1 }
      })
    }, 1000)
  }

  async function registrarRespostaBonus(quizId, alternativaId, motivo) {
    // Evita duplo registro
    if (enviados[quizId]) return

    const quiz = quizzes.find(q => q.id === quizId)
    let pontos = 1
    let acertou = false

    if (motivo === 'timeout') {
      pontos = 1
    } else if (alternativaId === quiz.resposta_correta) {
      pontos = 5
      acertou = true
    } else {
      pontos = 2
    }

    // Marca localmente antes de salvar
    setEnviados(prev => ({ ...prev, [quizId]: { resposta: alternativaId, acertou, pontos, motivo } }))
    clearInterval(intervalsRef.current[quizId])

    const { error } = await supabase.from('quiz_respostas').insert({
      quiz_id: quizId,
      user_id: user.id,
      resposta: alternativaId,
      acertou,
      pontos,
    })

    if (error && error.code === '23505') return // já respondeu

    await supabase.from('points_log').insert({
      user_id: user.id,
      quiz_id: quizId,
      tipo: 'quiz_bonus',
      pontos,
      descricao: motivo === 'timeout'
        ? 'Quiz Bônus — tempo esgotado +1pt'
        : acertou
          ? 'Quiz Bônus — acertou! +5pts'
          : 'Quiz Bônus — errou +2pts'
    })
  }

  async function responder(quizId) {
    if (enviados[quizId]) {
      setMsg('Você já respondeu este quiz!')
      setTimeout(() => setMsg(''), 3000)
      return
    }
    if (respostas[quizId] === undefined) {
      setMsg('Selecione uma opção antes de confirmar!')
      return
    }

    const quiz = quizzes.find(q => q.id === quizId)

    if (quiz.expira_em && new Date(quiz.expira_em) < new Date()) {
      setMsg('Este quiz já expirou!')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    // Quiz bônus — usa função específica
    if (quiz.tipo === 'bonus') {
      const alt = quiz.alternativas[respostas[quizId]]
      await registrarRespostaBonus(quizId, alt?.id, 'resposta')
      return
    }

    // Quiz normal
    const alternativaEscolhida = quiz.alternativas[respostas[quizId]]
    const acertou = alternativaEscolhida?.id === quiz.resposta_correta

    setEnviados(prev => ({ ...prev, [quizId]: { resposta: alternativaEscolhida?.id, acertou } }))

    const { error } = await supabase.from('quiz_respostas').insert({
      quiz_id: quizId,
      user_id: user.id,
      resposta: alternativaEscolhida?.id,
      acertou
    })

    if (error) {
      if (error.code === '23505') {
        setMsg('Você já respondeu este quiz!')
      } else {
        setMsg('Erro ao salvar resposta. Tente novamente.')
        setEnviados(prev => { const n = {...prev}; delete n[quizId]; return n })
      }
      setTimeout(() => setMsg(''), 3000)
      return
    }

    if (acertou) {
      await supabase.from('points_log').insert({
        user_id: user.id,
        quiz_id: quizId,
        tipo: 'quiz',
        pontos: 0.5,
        descricao: 'Quiz correto +0.5pt'
      })
    }

    setMsg(acertou ? '✅ Acertou! +0.5 ponto!' : '❌ Errou! Sem pontos dessa vez.')
    setTimeout(() => setMsg(''), 4000)
  }

  function tempoRestante(expiraEm) {
    if (!expiraEm) return null
    const diff = new Date(expiraEm) - new Date()
    if (diff <= 0) return null
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}min restantes`
  }

  function quizExpirado(expiraEm) {
    if (!expiraEm) return false
    return new Date(expiraEm) < new Date()
  }

  function corTimer(seg) {
    if (seg > 20) return '#00C853'
    if (seg > 10) return '#FFD700'
    return '#ff4444'
  }

  if (loading) return (
    <div style={{background:'#080d0a', minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center', color:'#00C853', fontSize:24}}>
      Carregando quizzes...
    </div>
  )

  if (perfil?.status !== 'ativo') return (
    <div style={{background:'#080d0a', minHeight:'100vh', display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      color:'white', fontFamily:"'Barlow', sans-serif", padding:24, textAlign:'center'}}>
      <div style={{fontSize:48, marginBottom:16}}>⏳</div>
      <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, color:'#FFD700'}}>
        PAGAMENTO PENDENTE
      </h2>
      <p style={{color:'#6b8a62', marginBottom:24}}>
        Os quizzes estao disponiveis apenas para participantes com pagamento confirmado.
      </p>
      <button onClick={()=>navigate('/dashboard')}
        style={{background:'#00C853', color:'#080d0a', border:'none', borderRadius:10,
          padding:'12px 24px', fontWeight:700, cursor:'pointer'}}>
        VOLTAR AO PAINEL
      </button>
    </div>
  )

  const quizzesAtivos = quizzes.filter(q => !quizExpirado(q.expira_em))
  const quizzesBonus = quizzesAtivos.filter(q => q.tipo === 'bonus')
  const quizzesNormais = quizzesAtivos.filter(q => q.tipo !== 'bonus')

  return (
    <div style={{background:'#080d0a', minHeight:'100vh', color:'white',
      fontFamily:"'Barlow', sans-serif", padding:'32px 16px'}}>
      <div style={{maxWidth:600, margin:'0 auto'}}>
        <button onClick={()=>navigate('/dashboard')}
          style={{background:'transparent', color:'#00C853', border:'none',
            cursor:'pointer', fontSize:14, marginBottom:16}}>
          ← Voltar ao painel
        </button>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:48,
          color:'#00C853', margin:'0 0 8px'}}>QUIZZES</h1>
        <p style={{color:'#6b8a62', marginBottom:32}}>
          Acerte e ganhe 0,5 ponto por pergunta! Voce tem 24h para responder cada quiz.
        </p>

        {msg && (
          <div style={{background: msg.includes('Acertou') ? '#0f2d0f' : '#2d0f0f',
            border: `1px solid ${msg.includes('Acertou') ? '#00C853' : '#ff4444'}`,
            borderRadius:12, padding:'12px 20px', marginBottom:24,
            color: msg.includes('Acertou') ? '#00C853' : '#ff4444', fontWeight:700}}>
            {msg}
          </div>
        )}

        {/* QUIZ BÔNUS */}
        {quizzesBonus.map(quiz => {
          const jaRespondeu = enviados[quiz.id]
          const seg = timers[quiz.id] ?? TEMPO_BONUS
          const ativo = timerAtivo[quiz.id]
          const esgotado = ativo && seg === 0
          const cor = corTimer(seg)
          const pct = (seg / TEMPO_BONUS) * 100

          return (
            <div key={quiz.id} style={{
              background:'linear-gradient(135deg, rgba(255,215,0,.08), rgba(255,140,0,.04))',
              border:'2px solid rgba(255,215,0,.3)',
              borderRadius:16, padding:24, marginBottom:24,
              boxShadow:'0 0 32px rgba(255,215,0,.08)'
            }}>
              {/* Header bônus */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span style={{fontSize:24}}>⚡</span>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
                      fontWeight:700, letterSpacing:2, color:'#FFD700', textTransform:'uppercase'}}>
                      QUIZ PRÊMIO EXTRA
                    </div>
                    <div style={{fontSize:12, color:'rgba(255,215,0,.6)'}}>
                      Acerto +5pts · Erro +2pts · Tempo esgotado +1pt
                    </div>
                  </div>
                </div>
                {!jaRespondeu && !ativo && (
                  <div style={{background:'rgba(255,215,0,.15)', border:'1px solid rgba(255,215,0,.3)',
                    borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700, color:'#FFD700'}}>
                    ⏱ {tempoRestante(quiz.expira_em)}
                  </div>
                )}
              </div>

              <p style={{fontWeight:700, fontSize:18, margin:'0 0 16px', color:'white'}}>{quiz.pergunta}</p>

              {/* Timer visual — só aparece quando o quiz foi aberto */}
              {ativo && !jaRespondeu && (
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                    <span style={{fontSize:12, color:'rgba(255,255,255,.5)'}}>Tempo restante</span>
                    <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:24,
                      color:cor, lineHeight:1}}>{seg}s</span>
                  </div>
                  <div style={{height:8, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden'}}>
                    <div style={{
                      height:'100%', borderRadius:4,
                      width:`${pct}%`,
                      background:`linear-gradient(to right, ${cor}99, ${cor})`,
                      transition:'width 1s linear'
                    }}/>
                  </div>
                </div>
              )}

              {/* Botão para iniciar / revelar */}
              {!ativo && !jaRespondeu && (
                <button
                  onClick={() => iniciarTimerBonus(quiz.id)}
                  style={{width:'100%', background:'#FFD700', color:'#080d0a', border:'none',
                    borderRadius:10, padding:'14px', fontFamily:"'Barlow Condensed', sans-serif",
                    fontSize:18, fontWeight:700, letterSpacing:1.5, cursor:'pointer',
                    marginBottom:8}}>
                  ⚡ REVELAR PERGUNTA E INICIAR TIMER
                </button>
              )}

              {/* Alternativas — só aparecem após iniciar */}
              {(ativo || jaRespondeu) && (quiz.alternativas || []).map((alt, i) => {
                const selecionada = respostas[quiz.id] === i
                const eCorreta = alt.id === quiz.resposta_correta
                const eRespondida = jaRespondeu?.resposta === alt.id
                const bloqueado = jaRespondeu || esgotado

                let bg = 'rgba(255,255,255,.04)'
                let border = '1px solid rgba(255,255,255,.08)'
                if (jaRespondeu || esgotado) {
                  if (eCorreta) { bg = '#0f2d0f'; border = '1px solid #00C853' }
                  else if (eRespondida) { bg = '#2d0f0f'; border = '1px solid #ff4444' }
                } else if (selecionada) {
                  bg = 'rgba(255,215,0,.12)'; border = '2px solid #FFD700'
                }

                return (
                  <button key={i}
                    onClick={() => !bloqueado && setRespostas(prev => ({...prev, [quiz.id]: i}))}
                    style={{display:'block', width:'100%', textAlign:'left',
                      padding:'12px 16px', marginBottom:8, borderRadius:10,
                      cursor: bloqueado ? 'default' : 'pointer',
                      border, background: bg, color:'white', fontSize:15, transition:'all .15s'}}>
                    <span style={{fontWeight:700, marginRight:8}}>{alt.id}.</span>{alt.texto}
                    {(jaRespondeu || esgotado) && eCorreta &&
                      <span style={{float:'right', color:'#00C853'}}>✓ correta</span>}
                  </button>
                )
              })}

              {/* Confirmar bônus */}
              {ativo && !jaRespondeu && !esgotado && (
                <button onClick={() => responder(quiz.id)}
                  style={{background:'#FFD700', color:'#080d0a', border:'none',
                    borderRadius:10, padding:'12px 24px', fontWeight:700,
                    cursor:'pointer', marginTop:8, width:'100%',
                    fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, letterSpacing:1,
                    opacity: respostas[quiz.id] === undefined ? 0.5 : 1}}>
                  CONFIRMAR RESPOSTA
                </button>
              )}

              {/* Resultado */}
              {jaRespondeu && (
                <div style={{
                  marginTop:12, borderRadius:12, padding:'16px 20px', textAlign:'center',
                  background: jaRespondeu.acertou ? 'rgba(0,200,83,.12)' : jaRespondeu.motivo === 'timeout' ? 'rgba(255,100,0,.1)' : 'rgba(255,70,70,.1)',
                  border: `1px solid ${jaRespondeu.acertou ? 'rgba(0,200,83,.3)' : jaRespondeu.motivo === 'timeout' ? 'rgba(255,100,0,.3)' : 'rgba(255,70,70,.3)'}`
                }}>
                  <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36,
                    color: jaRespondeu.acertou ? '#00C853' : jaRespondeu.motivo === 'timeout' ? '#ff8c00' : '#ff7070',
                    lineHeight:1, marginBottom:4}}>
                    {jaRespondeu.acertou ? '⚡ +5 PONTOS!' : jaRespondeu.motivo === 'timeout' ? '⏰ +1 PONTO' : '❌ +2 PONTOS'}
                  </div>
                  <div style={{fontSize:13, color:'rgba(255,255,255,.5)'}}>
                    {jaRespondeu.acertou ? 'Parabéns, você acertou!' : jaRespondeu.motivo === 'timeout' ? 'Tempo esgotado!' : 'Não foi dessa vez, mas você ganhou 2 pontos!'}
                  </div>
                </div>
              )}

              {/* Tempo esgotado sem resposta */}
              {esgotado && !jaRespondeu && (
                <div style={{marginTop:12, borderRadius:12, padding:'16px 20px', textAlign:'center',
                  background:'rgba(255,100,0,.1)', border:'1px solid rgba(255,100,0,.3)'}}>
                  <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36,
                    color:'#ff8c00', lineHeight:1, marginBottom:4}}>⏰ +1 PONTO</div>
                  <div style={{fontSize:13, color:'rgba(255,255,255,.5)'}}>Tempo esgotado!</div>
                </div>
              )}
            </div>
          )
        })}

        {/* QUIZZES NORMAIS */}
        {quizzesNormais.length === 0 && quizzesBonus.length === 0 ? (
          <div style={{textAlign:'center', color:'#6b8a62', marginTop:80}}>
            <div style={{fontSize:48, marginBottom:16}}>🎯</div>
            <p>Nenhum quiz disponivel no momento.</p>
            <p>Volte em breve!</p>
          </div>
        ) : (
          quizzesNormais.map(quiz => {
            const jaRespondeu = enviados[quiz.id]
            return (
              <div key={quiz.id} style={{background:'#0f1a0f', border:'1px solid #1a3a1a',
                borderRadius:16, padding:24, marginBottom:20}}>
                <div style={{display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8}}>
                  <p style={{fontWeight:700, fontSize:18, margin:0}}>{quiz.pergunta}</p>
                  {tempoRestante(quiz.expira_em) && !jaRespondeu && (
                    <span style={{background:'rgba(255,215,0,.1)', color:'#FFD700',
                      border:'1px solid rgba(255,215,0,.3)', borderRadius:20,
                      padding:'3px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap'}}>
                      ⏱ {tempoRestante(quiz.expira_em)}
                    </span>
                  )}
                  {jaRespondeu && (
                    <span style={{background: jaRespondeu.acertou ? 'rgba(0,200,83,.12)' : 'rgba(255,70,70,.12)',
                      color: jaRespondeu.acertou ? '#00C853' : '#ff7070',
                      border: `1px solid ${jaRespondeu.acertou ? 'rgba(0,200,83,.3)' : 'rgba(255,70,70,.3)'}`,
                      borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700}}>
                      {jaRespondeu.acertou ? '✅ +0.5pt' : '❌ Errou'}
                    </span>
                  )}
                </div>
                {(quiz.alternativas || []).map((alt, i) => {
                  const selecionada = respostas[quiz.id] === i
                  const eCorreta = alt.id === quiz.resposta_correta
                  const eRespondida = jaRespondeu?.resposta === alt.id

                  let bg = '#080d0a'
                  let border = '1px solid #1a3a1a'
                  if (jaRespondeu) {
                    if (eCorreta) { bg = '#0f2d0f'; border = '1px solid #00C853' }
                    else if (eRespondida && !eCorreta) { bg = '#2d0f0f'; border = '1px solid #ff4444' }
                  } else if (selecionada) {
                    bg = '#0f2d0f'; border = '2px solid #00C853'
                  }

                  return (
                    <button key={i}
                      onClick={() => !jaRespondeu && setRespostas(prev => ({...prev, [quiz.id]: i}))}
                      style={{display:'block', width:'100%', textAlign:'left',
                        padding:'12px 16px', marginBottom:8, borderRadius:10,
                        cursor: jaRespondeu ? 'default' : 'pointer',
                        border, background: bg, color:'white', fontSize:15, transition:'all .15s'}}>
                      <span style={{fontWeight:700, marginRight:8}}>{alt.id}.</span>{alt.texto}
                      {jaRespondeu && eCorreta && <span style={{float:'right', color:'#00C853'}}>✓ correta</span>}
                    </button>
                  )
                })}
                {!jaRespondeu ? (
                  <button onClick={() => responder(quiz.id)}
                    style={{background:'#00C853', color:'#080d0a', border:'none',
                      borderRadius:10, padding:'12px 24px', fontWeight:700,
                      cursor:'pointer', marginTop:8, width:'100%',
                      opacity: respostas[quiz.id] === undefined ? 0.6 : 1}}>
                    CONFIRMAR RESPOSTA
                  </button>
                ) : (
                  <div style={{textAlign:'center', marginTop:12, color:'#6b8a62', fontSize:13}}>
                    Respondido — a resposta correta está destacada acima
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}