import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Quiz() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [enviados, setEnviados] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session?.user) { navigate('/login'); return }
      setUser(data.session.user)
      carregarDados(data.session.user.id)
    })
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
      .select('quiz_id, resposta, acertou')
      .eq('user_id', userId)

    const jaRespondidos = {}
    resps?.forEach(r => { jaRespondidos[r.quiz_id] = { resposta: r.resposta, acertou: r.acertou } })
    setEnviados(jaRespondidos)
    setQuizzes(qs || [])
    setLoading(false)
  }

  async function responder(quizId) {
    // Verificação dupla: já respondeu?
    if (enviados[quizId]) {
      setMsg('Você já respondeu este quiz!'); 
      setTimeout(() => setMsg(''), 3000)
      return
    }
    if (respostas[quizId] === undefined) {
      setMsg('Selecione uma opcao antes de confirmar!'); return
    }

    const quiz = quizzes.find(q => q.id === quizId)

    // Verifica se expirou
    if (quiz.expira_em && new Date(quiz.expira_em) < new Date()) {
      setMsg('Este quiz já expirou!')
      setTimeout(() => setMsg(''), 3000)
      return
    }

    const alternativaEscolhida = quiz.alternativas[respostas[quizId]]
    const acertou = alternativaEscolhida?.id === quiz.resposta_correta

    // Marca como respondido localmente ANTES de salvar (evita duplo clique)
    setEnviados(prev => ({ ...prev, [quizId]: { resposta: alternativaEscolhida?.id, acertou } }))

    const { error } = await supabase.from('quiz_respostas').insert({
      quiz_id: quizId,
      user_id: user.id,
      resposta: alternativaEscolhida?.id,
      acertou
    })

    if (error) {
      // Se der erro de unique constraint, já respondeu
      if (error.code === '23505') {
        setMsg('Você já respondeu este quiz!')
      } else {
        setMsg('Erro ao salvar resposta. Tente novamente.')
        // Reverte o estado local se deu erro
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

        {quizzesAtivos.length === 0 ? (
          <div style={{textAlign:'center', color:'#6b8a62', marginTop:80}}>
            <div style={{fontSize:48, marginBottom:16}}>🎯</div>
            <p>Nenhum quiz disponivel no momento.</p>
            <p>Volte em breve!</p>
          </div>
        ) : (
          quizzesAtivos.map(quiz => {
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
                      style={{
                        display:'block', width:'100%', textAlign:'left',
                        padding:'12px 16px', marginBottom:8, borderRadius:10,
                        cursor: jaRespondeu ? 'default' : 'pointer',
                        border, background: bg, color:'white', fontSize:15,
                        transition:'all .15s'
                      }}>
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