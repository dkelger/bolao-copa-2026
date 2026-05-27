import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) navigate('/dashboard')
    })
  }, [])

  async function handleLogin() {
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{background:'#080d0a', minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center', fontFamily:"'Barlow', sans-serif",
      padding:24}}>
      <div style={{background:'#0f1a0f', border:'1px solid rgba(0,200,83,.2)',
        borderRadius:16, padding:40, width:'100%', maxWidth:400}}>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:40,
          color:'#00C853', margin:'0 0 8px', textAlign:'center'}}>ENTRAR</h1>
        <p style={{color:'#6b8a62', textAlign:'center', marginBottom:32, fontSize:14}}>
          Bolao Copa 2026
        </p>

        {erro && (
          <div style={{background:'#2d0f0f', border:'1px solid #ff4444',
            borderRadius:10, padding:'10px 16px', marginBottom:16,
            color:'#ff4444', fontSize:14}}>
            {erro}
          </div>
        )}

        <div style={{marginBottom:16}}>
          <label style={{display:'block', color:'#6b8a62', fontSize:12,
            fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6}}>
            E-MAIL
          </label>
          <input value={email} onChange={e=>setEmail(e.target.value)}
            type="email" placeholder="seu@email.com"
            style={{width:'100%', background:'#080d0a', border:'1px solid rgba(0,200,83,.2)',
              borderRadius:10, padding:'12px 14px', color:'white', fontSize:15,
              boxSizing:'border-box'}}/>
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:'block', color:'#6b8a62', fontSize:12,
            fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6}}>
            SENHA
          </label>
          <input value={senha} onChange={e=>setSenha(e.target.value)}
            type="password" placeholder="Minimo 6 caracteres"
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            style={{width:'100%', background:'#080d0a', border:'1px solid rgba(0,200,83,.2)',
              borderRadius:10, padding:'12px 14px', color:'white', fontSize:15,
              boxSizing:'border-box'}}/>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{width:'100%', background:'#00C853', color:'#080d0a', border:'none',
            borderRadius:10, padding:'14px', fontFamily:"'Barlow Condensed', sans-serif",
            fontSize:18, fontWeight:700, letterSpacing:1.5, cursor:'pointer',
            opacity: loading ? 0.7 : 1}}>
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </button>

        <div style={{textAlign:'center', marginTop:20}}>
          <p style={{color:'#6b8a62', fontSize:13, marginBottom:8}}>
            Nao tem conta ainda?
          </p>
          <button onClick={()=>navigate('/inscricao')}
            style={{background:'transparent', color:'#00C853',
              border:'1.5px solid #00C853', borderRadius:10,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:16,
              fontWeight:700, letterSpacing:1, padding:'10px 28px', cursor:'pointer'}}>
            PARTICIPAR AGORA
          </button>
        </div>
      </div>
    </div>
  )
}