import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Inscricao() {
  const navigate = useNavigate()

  return (
    <div style={{background:"#080d0a", minHeight:"100vh", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:24, textAlign:"center"}}>
      <div style={{fontSize:56, marginBottom:20}}>🔒</div>
      <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:48,
        color:"white", letterSpacing:3, marginBottom:8}}>INSCRIÇÕES ENCERRADAS</div>
      <p style={{color:"#6b8a62", fontSize:16, maxWidth:400, lineHeight:1.8, marginBottom:32}}>
        O prazo para participar do Bolão do DK Copa 2026 foi encerrado.<br/>
        Acompanhe os jogos e o ranking pelo site!
      </p>
      <div style={{display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center"}}>
        <button onClick={()=>navigate('/')}
          style={{background:"transparent", color:"#6b8a62",
            border:"1px solid rgba(255,255,255,.1)", borderRadius:10,
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
            fontWeight:700, letterSpacing:1, padding:"10px 24px", cursor:"pointer"}}>
          ← INÍCIO
        </button>
        <button onClick={()=>navigate('/ranking')}
          style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:10,
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
            fontWeight:700, letterSpacing:1.5, padding:"10px 24px", cursor:"pointer"}}>
          VER RANKING
        </button>
        <button onClick={()=>navigate('/login')}
          style={{background:"transparent", color:"#00C853",
            border:"1px solid rgba(0,200,83,.3)", borderRadius:10,
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
            fontWeight:700, letterSpacing:1, padding:"10px 24px", cursor:"pointer"}}>
          JÁ TENHO CONTA
        </button>
      </div>
    </div>
  )
}