import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Pagamento() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data?.session?.user) { navigate('/login'); return }
      setUser(data.session.user)
      const { data: prof } = await supabase
        .from('users').select('*').eq('id', data.session.user.id).single()
      setProfile(prof)
      // Se já está ativo, vai pro dashboard
      if (prof?.status === 'ativo') { navigate('/dashboard'); return }
    })
  }, [])

  const handlePagamento = async () => {
    setLoading(true); setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('criar-pix', {
        body: { user_id: user.id, nome: profile?.nome, email: profile?.email, valor: 50 }
      })
      if (fnError) throw new Error(fnError.message)
      if (data && data.init_point) { window.location.href = data.init_point }
      else throw new Error('Erro ao gerar pagamento')
    } catch (err) {
      setError('Erro: ' + err.message); setLoading(false)
    }
  }

  const s = {
    wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px", display:"flex", alignItems:"center", justifyContent:"center" },
    card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:32, maxWidth:480, width:"100%", textAlign:"center" },
    btn: { background:"#00C853", color:"#080d0a", border:"none", borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, letterSpacing:1.5, padding:"14px 28px", cursor:"pointer", width:"100%" },
  }

  if (!profile) return (
    <div style={{...s.wrap}}>
      <p style={{color:"#FFD700"}}>Carregando...</p>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{fontSize:64, marginBottom:16}}>⚽</div>
        <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:32, color:"white", letterSpacing:3, marginBottom:8}}>
          FINALIZAR INSCRIÇÃO
        </div>
        <p style={{fontSize:14, color:"#6b8a62", marginBottom:24, lineHeight:1.7}}>
          Olá <strong style={{color:"#dff0d8"}}>{profile?.nome?.split(' ')[0]}</strong>! Suas seleções já estão salvas. Conclua o pagamento para ativar sua participação no bolão.
        </p>

        {error && (
          <div style={{background:"rgba(255,70,70,.1)", border:"1px solid rgba(255,70,70,.3)", borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:14, color:"#ff7070"}}>
            {error}
          </div>
        )}

        <div style={{background:"#141f10", border:"1.5px dashed rgba(0,200,83,.35)", borderRadius:14, padding:24, marginBottom:16}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:40, fontWeight:900, color:"#00C853", marginBottom:4}}>R$ 50,00</div>
          <p style={{fontSize:13, color:"#6b8a62", marginBottom:20}}>Pagamento seguro via Mercado Pago</p>
          <button style={s.btn} onClick={handlePagamento} disabled={loading}>
            {loading ? 'Gerando pagamento...' : '💳 PAGAR VIA MERCADO PAGO →'}
          </button>
        </div>

        <div style={{background:"rgba(0,200,83,.06)", border:"1px solid rgba(0,200,83,.16)", borderRadius:8, padding:"14px 16px", display:"flex", gap:12, textAlign:"left"}}>
          <span style={{fontSize:20}}>🔒</span>
          <div>
            <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>Pagamento 100% seguro</div>
            <div style={{fontSize:13, color:"#6b8a62"}}>Processado pelo Mercado Pago. Após o pagamento você será redirecionado automaticamente.</div>
          </div>
        </div>

        <button onClick={()=>navigate('/dashboard')}
          style={{background:"transparent", color:"#6b8a62", border:"none", cursor:"pointer", marginTop:16, fontSize:13}}>
          ← Voltar ao painel
        </button>
      </div>
    </div>
  )
}