import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const TEMPO_BONUS = 40

export default function Quiz() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [enviados, setEnviados] = useState({})
  const [msg, setMsg] = useState('')
  const [timers, setTimers] = useState({})
  const [timerAtivo, setTimerAtivo] = useState({})
  const intervalsRef = useRef({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session?.user) { navigate('/login'); return }
      setUser(data.session.user)
      carregarDados(data.session.user.id)
    })
    return () => { Object.values(intervalsRef.current).forEach(clearInterval) }
  }, [])

  async function carregarDados(userId) {
    const { data: prof } = await supabase
      .from('users').select('status').eq('id', userId).single()
    setPerfil(prof)

    const { data: qs } = await supabase
      .from('quizzes').select('*').eq('publicado', true)
      .order('created_at', { ascending: false })

    const { data: resps } = await supabase
      .from('quiz_respostas')
      .select('quiz_id, resposta, acertou, pontos, iniciado_em')
      .eq('user_id', userId)

    const jaRespondidos = {}
    resps?.forEach(r => {
      jaRespondidos[r.quiz_id] = {
        resposta: r.resposta,
        acertou: r.acertou,
        pontos: r.pontos,
        iniciado_em: r.iniciado_em
      }
    })

    setEnviados(jaRespondidos)
    setQuizzes(qs || [])

    // Para cada quiz bônus que foi iniciado mas não respondido, retoma o timer
    ;(qs || []).forEach(q => {
      if (q.tipo !== 'bonus') return
      const resp = jaRespondidos[q.quiz_id]
      if (!resp) return
      if (resp.resposta !== null) return // já respondeu de verdade
      if (!resp.iniciado_em) return

      const iniciado = new Date(resp.iniciado_em)
      const agora = new Date()
      const decorrido = Math.floor((agora - iniciado) / 1000)
      const restante = TEMPO_BONUS - decorrido

      if (restante <= 0) {
        // Tempo já esgotou enquanto estava fora — registra 0 pontos
        registrarRespostaBonus(userId, q.id, null, 'timeout_ausente', q)
      } else {
        // Ainda tem tempo — retoma timer
        setTimers(prev => ({ ...prev, [q.id]: restante }))
        setTimerAtivo(prev => ({ ...prev, [q.id]: true }))
        iniciarContagem(q.id, restante, userId, q)
      }
    })

    setLoading(false)
  }

  async function revelarBonus(quizId) {
    if (enviados[quizId]) return

    // Salva o momento que iniciou no banco
    await supabase.from('quiz_respostas').insert({
      quiz_id: quizId,
      user_id: user.id,
      resposta: null,
      acertou: false,
      pontos: 0,
      iniciado_em: new Date().toISOString()
    })

    setTimers(prev => ({ ...prev, [quizId]: TEMPO_BONUS }))
    setTimerAtivo(prev => ({ ...prev, [quizId]: true }))
    // Marca localmente como iniciado (sem resposta ainda)
    setEnviados(prev => ({ ...prev, [quizId]: { resposta: null, acertou: false, pontos: 0, iniciado_em: new Date().toISOString() } }))

    const quiz = quizzes.find(q => q.id === quizId)
    iniciarContagem(quizId, TEMPO_BONUS, user.id, quiz)
  }

  function iniciarContagem(quizId, tempoInicial, userId, quiz) {
    clearInterval(intervalsRef.current[quizId])
    let seg = tempoInicial
    intervalsRef.current[quizId] = setInterval(() => {
      seg -= 1
      setTimers(prev => ({ ...prev, [quizId]: seg }))
      if (seg <= 0) {
        clearInterval(intervalsRef.current[quizId])
        // Verifica se já respondeu (pode ter respondido antes do timer acabar)
        setEnviados(prev => {
          const atual = prev[quizId]
          if (atual?.resposta !== null && atual?.resposta !== undefined && atual?.motivo !== 'timeout_ausente') {
            return prev // já respondeu, não faz nada
          }
          registrarRespostaBonus(userId, quizId, null, 'timeout', quiz)
          return prev
        })
      }
    }, 1000)
  }

  const registrandoRef = useRef({})

  async function registrarRespostaBonus(userId, quizId, alternativaId, motivo, quizObj) {
    if (registrandoRef.current[quizId]) return
    registrandoRef.current[quizId] = true
    const quiz = quizObj || quizzes.find(q => q.id === quizId)
    let pontos = 1
    let acertou = false

    if (motivo === 'timeout' || motivo === 'timeout_ausente') {
      pontos = motivo === 'timeout_ausente' ? 0 : 1
    } else if (alternativaId === quiz?.resposta_correta) {
      pontos = 5; acertou = true
    } else {
      pontos = 2
    }

    // Atualiza o registro existente
    await supabase.from('quiz_respostas')
      .update({ resposta: alternativaId, acertou, pontos })
      .eq('quiz_id', quizId)
      .eq('user_id', userId)

    setEnviados(prev => ({ ...prev, [quizId]: { resposta: alternativaId, acertou, pontos, motivo } }))
    clearInterval(intervalsRef.current[quizId])

    if (pontos > 0) {
      const { data: jaExiste } = await supabase
        .from('points_log').select('id')
        .eq('user_id', userId).eq('quiz_id', quizId)
        .eq('tipo', 'quiz_bonus').limit(1)
      if (jaExiste && jaExiste.length > 0) return
      await supabase.from('points_log').insert({
        user_id: userId,
        quiz_id: quizId,
        tipo: 'quiz_bonus',
        pontos,
        descricao: motivo === 'timeout_ausente'
          ? 'Quiz Bônus — fechou antes do tempo (0pts)'
          : motivo === 'timeout'
          ? 'Quiz Bônus — tempo esgotado +1pt'
          : acertou
          ? 'Quiz Bônus — acertou! +5pts'
          : 'Quiz Bônus — errou +2pts'
      })
    }
  }

  async function responder(quizId) {
    const jaResp = enviados[quizId]
    // Bloqueia se já respondeu de verdade (não só iniciou)
    if (jaResp?.resposta !== null && jaResp?.resposta !== undefined && jaResp?.motivo !== undefined) {
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

    if (quiz.tipo === 'bonus') {
      const alt = quiz.alternativas[respostas[quizId]]
      clearInterval(intervalsRef.current[quizId])
      await registrarRespostaBonus(user.id, quizId, alt?.id, 'resposta', quiz)
      return
    }

    // Quiz normal
    const alternativaEscolhida = quiz.alternativas[respostas[quizId]]
    const acertou = alternativaEscolhida?.id === quiz.resposta_correta
    setEnviados(prev => ({ ...prev, [quizId]: { resposta: alternativaEscolhida?.id, acertou } }))

    const { error } = await supabase.from('quiz_respostas').insert({
      quiz_id: quizId, user_id: user.id,
      resposta: alternativaEscolhida?.id, acertou
    })

    if (error) {
      if (error.code === '23505') { setMsg('Você já respondeu este quiz!') }
      else { setMsg('Erro ao salvar. Tente novamente.'); setEnviados(prev => { const n={...prev}; delete n[quizId]; return n }) }
      setTimeout(() => setMsg(''), 3000)
      return
    }

    if (acertou) {
      await supabase.from('points_log').insert({
        user_id: user.id, quiz_id: quizId,
        tipo: 'quiz', pontos: 0.5, descricao: 'Quiz correto +0.5pt'
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
      <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, color:'#FFD700'}}>PAGAMENTO PENDENTE</h2>
      <p style={{color:'#6b8a62', marginBottom:24}}>Os quizzes estao disponiveis apenas para participantes com pagamento confirmado.</p>
      <button onClick={()=>navigate('/dashboard')}
        style={{background:'#00C853', color:'#080d0a', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, cursor:'pointer'}}>
        VOLTAR AO PAINEL
      </button>
    </div>
  )

  const quizzesAtivos = quizzes.filter(q => !quizExpirado(q.expira_em))
  const quizzesBonus = quizzesAtivos.filter(q => q.tipo === 'bonus')
  const quizzesNormais = quizzesAtivos.filter(q => q.tipo !== 'bonus')

  return (
    <div style={{background:'#080d0a', minHeight:'100vh', color:'white', fontFamily:"'Barlow', sans-serif", padding:'32px 16px'}}>
      <div style={{maxWidth:600, margin:'0 auto'}}>
        <button onClick={()=>navigate('/dashboard')}
          style={{background:'transparent', color:'#00C853', border:'none', cursor:'pointer', fontSize:14, marginBottom:16}}>
          ← Voltar ao painel
        </button>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:48, color:'#00C853', margin:'0 0 8px'}}>QUIZZES</h1>
        <p style={{color:'#6b8a62', marginBottom:32}}>Acerte e ganhe 0,5 ponto por pergunta! Voce tem 24h para responder cada quiz.</p>

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
          const iniciou = !!jaRespondeu?.iniciado_em
          const respondeuDeVerdade = jaRespondeu && jaRespondeu.motivo !== undefined
          const seg = timers[quiz.id] ?? TEMPO_BONUS
          const ativo = timerAtivo[quiz.id]
          const esgotado = ativo && seg <= 0
          const cor = corTimer(seg)
          const pct = Math.max(0, (seg / TEMPO_BONUS) * 100)

          // Fechou antes do timer — mostra bloqueado com 0 pts
          const fechouAntes = jaRespondeu && jaRespondeu.motivo === 'timeout_ausente'

          return (
            <div key={quiz.id} style={{
              background:'linear-gradient(135deg, rgba(255,215,0,.08), rgba(255,140,0,.04))',
              border:'2px solid rgba(255,215,0,.3)', borderRadius:16, padding:24,
              marginBottom:24, boxShadow:'0 0 32px rgba(255,215,0,.08)'}}>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <span style={{fontSize:24}}>⚡</span>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
                      fontWeight:700, letterSpacing:2, color:'#FFD700', textTransform:'uppercase'}}>
                      QUIZ PRÊMIO EXTRA
                    </div>
                    <div style={{fontSize:12, color:'rgba(255,215,0,.6)'}}>
                      Acerto +5pts · Erro +2pts · Tempo esgotado +1pt · Fechar sem responder = 0pts
                    </div>
                  </div>
                </div>
                {!iniciou && !respondeuDeVerdade && (
                  <div style={{background:'rgba(255,215,0,.15)', border:'1px solid rgba(255,215,0,.3)',
                    borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700, color:'#FFD700'}}>
                    ⏱ {tempoRestante(quiz.expira_em)}
                  </div>
                )}
              </div>

              {/* Não iniciou ainda */}
              {!iniciou && !respondeuDeVerdade && (
                <>
                  <div style={{background:'rgba(255,215,0,.06)', border:'1px solid rgba(255,215,0,.15)',
                    borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, color:'rgba(255,215,0,.8)'}}>
                    ⚠️ Atenção: ao clicar em revelar, o timer de <strong>40 segundos</strong> inicia imediatamente.
                    Se você fechar a janela antes de responder, ficará com <strong>0 pontos</strong> e não poderá mais responder.
                  </div>
                  <button onClick={() => revelarBonus(quiz.id)}
                    style={{width:'100%', background:'#FFD700', color:'#080d0a', border:'none',
                      borderRadius:10, padding:'14px', fontFamily:"'Barlow Condensed', sans-serif",
                      fontSize:18, fontWeight:700, letterSpacing:1.5, cursor:'pointer'}}>
                    ⚡ REVELAR PERGUNTA E INICIAR TIMER
                  </button>
                </>
              )}

              {/* Fechou antes do timer */}
              {fechouAntes && (
                <>
                  <p style={{fontWeight:700, fontSize:18, margin:'0 0 16px', color:'white'}}>{quiz.pergunta}</p>
                  <div style={{marginTop:12, borderRadius:12, padding:'16px 20px', textAlign:'center',
                    background:'rgba(100,100,100,.1)', border:'1px solid rgba(255,255,255,.1)'}}>
                    <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, color:'#6b8a62', lineHeight:1, marginBottom:4}}>
                      🔒 0 PONTOS
                    </div>
                    <div style={{fontSize:13, color:'rgba(255,255,255,.4)'}}>
                      Você fechou a janela antes de responder.
                    </div>
                  </div>
                </>
              )}

              {/* Timer ativo ou respondeu */}
              {(ativo || (respondeuDeVerdade && !fechouAntes)) && (
                <>
                  {/* Timer */}
                  {ativo && !respondeuDeVerdade && (
                    <div style={{marginBottom:16}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                        <span style={{fontSize:12, color:'rgba(255,255,255,.5)'}}>Tempo restante</span>
                        <span style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:28, color:cor, lineHeight:1}}>{Math.max(0, seg)}s</span>
                      </div>
                      <div style={{height:8, background:'rgba(255,255,255,.08)', borderRadius:4, overflow:'hidden'}}>
                        <div style={{height:'100%', borderRadius:4, width:`${pct}%`,
                          background:`linear-gradient(to right, ${cor}99, ${cor})`,
                          transition:'width 1s linear'}}/>
                      </div>
                    </div>
                  )}

                  <p style={{fontWeight:700, fontSize:18, margin:'0 0 16px', color:'white'}}>{quiz.pergunta}</p>

                  {(quiz.alternativas || []).map((alt, i) => {
                    const selecionada = respostas[quiz.id] === i
                    const eCorreta = alt.id === quiz.resposta_correta
                    const eRespondida = jaRespondeu?.resposta === alt.id
                    const bloqueado = respondeuDeVerdade || esgotado

                    let bg = 'rgba(255,255,255,.04)'
                    let border = '1px solid rgba(255,255,255,.08)'
                    if (bloqueado) {
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
                        {bloqueado && eCorreta && <span style={{float:'right', color:'#00C853'}}>✓ correta</span>}
                      </button>
                    )
                  })}

                  {ativo && !respondeuDeVerdade && !esgotado && (
                    <button onClick={() => responder(quiz.id)}
                      style={{background:'#FFD700', color:'#080d0a', border:'none',
                        borderRadius:10, padding:'12px 24px', fontWeight:700, cursor:'pointer',
                        marginTop:8, width:'100%', fontFamily:"'Barlow Condensed', sans-serif",
                        fontSize:16, letterSpacing:1,
                        opacity: respostas[quiz.id] === undefined ? 0.5 : 1}}>
                      CONFIRMAR RESPOSTA
                    </button>
                  )}

                  {/* Resultado */}
                  {respondeuDeVerdade && (
                    <div style={{marginTop:12, borderRadius:12, padding:'16px 20px', textAlign:'center',
                      background: jaRespondeu.acertou ? 'rgba(0,200,83,.12)' : jaRespondeu.motivo === 'timeout' ? 'rgba(255,100,0,.1)' : 'rgba(255,70,70,.1)',
                      border: `1px solid ${jaRespondeu.acertou ? 'rgba(0,200,83,.3)' : jaRespondeu.motivo === 'timeout' ? 'rgba(255,100,0,.3)' : 'rgba(255,70,70,.3)'}`}}>
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
                  {esgotado && !respondeuDeVerdade && (
                    <div style={{marginTop:12, borderRadius:12, padding:'16px 20px', textAlign:'center',
                      background:'rgba(255,100,0,.1)', border:'1px solid rgba(255,100,0,.3)'}}>
                      <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36, color:'#ff8c00', lineHeight:1, marginBottom:4}}>⏰ +1 PONTO</div>
                      <div style={{fontSize:13, color:'rgba(255,255,255,.5)'}}>Tempo esgotado!</div>
                    </div>
                  )}
                </>
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
        ) : quizzesNormais.map(quiz => {
          const jaRespondeu = enviados[quiz.id]
          return (
            <div key={quiz.id} style={{background:'#0f1a0f', border:'1px solid #1a3a1a', borderRadius:16, padding:24, marginBottom:20}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8}}>
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
                let bg = '#080d0a', border = '1px solid #1a3a1a'
                if (jaRespondeu) {
                  if (eCorreta) { bg = '#0f2d0f'; border = '1px solid #00C853' }
                  else if (eRespondida && !eCorreta) { bg = '#2d0f0f'; border = '1px solid #ff4444' }
                } else if (selecionada) { bg = '#0f2d0f'; border = '2px solid #00C853' }
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
        })}
      </div>
    </div>
  )
}