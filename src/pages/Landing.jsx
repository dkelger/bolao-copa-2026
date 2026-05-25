import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{background:"#080d0a", minHeight:"100vh", color:"#dff0d8",
      fontFamily:"'Barlow', sans-serif", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", textAlign:"center", padding:24}}>
      <div style={{fontSize:72, marginBottom:8}}>⚽</div>
      <h1 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:"clamp(64px,12vw,140px)",
        color:"white", lineHeight:.9, letterSpacing:4, margin:0}}>BOLÃO</h1>
      <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:"clamp(48px,8vw,100px)",
        color:"#00C853", lineHeight:.9, letterSpacing:5, marginBottom:32}}>COPA 2026</h2>
      <p style={{fontSize:18, color:"#6b8a62", maxWidth:480, lineHeight:1.7, marginBottom:40}}>
        Escolha 3 seleções favoritas, acompanhe cada jogo, responda quizzes e dispute o prêmio em tempo real.
      </p>
      <div style={{display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center"}}>
        <button onClick={()=>navigate('/inscricao')}
          style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:12,
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700,
            letterSpacing:1.5, padding:"16px 36px", cursor:"pointer"}}>
          PARTICIPAR AGORA →
        </button>
        <button onClick={()=>navigate('/ranking')}
          style={{background:"transparent", color:"#00C853", border:"1.5px solid #00C853",
            borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:18,
            fontWeight:700, letterSpacing:1.5, padding:"16px 36px", cursor:"pointer"}}>
          VER RANKING
        </button>
      </div>
    </div>
  )
}