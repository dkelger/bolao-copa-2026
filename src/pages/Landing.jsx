import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Landing() {
  const navigate = useNavigate()
  const [participantes, setParticipantes] = useState(null)

  useEffect(() => {
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setParticipantes(count || 0))
  }, [])

  return (
    <div style={{background:"#080d0a", color:"#dff0d8", fontFamily:"'Barlow', sans-serif"}}>

      {/* NAVBAR */}
      <nav style={{position:"fixed", top:0, left:0, right:0, zIndex:100,
        background:"rgba(8,13,10,.92)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(0,200,83,.1)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 32px", height:60}}>
        <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:24,
          color:"white", letterSpacing:3}}>BOLÃO 🌍 2026</div>
        <div style={{display:"flex", gap:12, alignItems:"center"}}>
          {participantes !== null && (
            <div style={{background:"rgba(0,200,83,.12)", border:"1px solid rgba(0,200,83,.3)",
              borderRadius:20, padding:"4px 14px", fontSize:13, color:"#00C853", fontWeight:700}}>
              🟢 {participantes} participantes
            </div>
          )}
          <button onClick={()=>navigate('/login')}
            style={{background:"transparent", color:"#6b8a62",
              border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
              fontWeight:700, letterSpacing:1, padding:"6px 16px", cursor:"pointer"}}>
            JÁ TENHO CONTA
          </button>
          <button onClick={()=>navigate('/inscricao')}
            style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:8,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
              fontWeight:700, letterSpacing:1, padding:"6px 16px", cursor:"pointer"}}>
            PARTICIPAR
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center",
        padding:"100px 24px 60px"}}>
        <div style={{background:"rgba(0,200,83,.08)", border:"1px solid rgba(0,200,83,.2)",
          borderRadius:20, padding:"6px 18px", fontSize:12, fontWeight:700,
          letterSpacing:2, color:"#00C853", textTransform:"uppercase", marginBottom:24}}>
          🌍 Copa do Mundo 2026 — México · EUA · Canadá
        </div>
        <h1 style={{fontFamily:"'Bebas Neue', sans-serif",
          fontSize:"clamp(80px,14vw,160px)", color:"white",
          lineHeight:.85, letterSpacing:4, margin:"0 0 4px"}}>BOLÃO</h1>
        <h2 style={{fontFamily:"'Bebas Neue', sans-serif",
          fontSize:"clamp(60px,10vw,120px)", color:"#00C853",
          lineHeight:.85, letterSpacing:5, margin:"0 0 32px"}}>COPA 2026</h2>
        <p style={{fontSize:18, color:"#6b8a62", maxWidth:520,
          lineHeight:1.8, marginBottom:48}}>
          Escolha 3 seleções favoritas, acompanhe cada jogo, responda quizzes temáticos e dispute o prêmio em tempo real.
        </p>
        <div style={{display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center"}}>
          <button onClick={()=>navigate('/inscricao')}
            style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:12,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700,
              letterSpacing:1.5, padding:"18px 44px", cursor:"pointer"}}>
            PARTICIPAR AGORA →
          </button>
          <button onClick={()=>navigate('/ranking')}
            style={{background:"transparent", color:"#00C853", border:"1.5px solid #00C853",
              borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:20,
              fontWeight:700, letterSpacing:1.5, padding:"18px 44px", cursor:"pointer"}}>
            VER RANKING
          </button>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section style={{padding:"80px 24px", maxWidth:900, margin:"0 auto"}}>
        <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:52,
          color:"white", textAlign:"center", letterSpacing:3, marginBottom:48}}>
          COMO FUNCIONA
        </h2>
        <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:20}}>
          {[
            { n:"01", titulo:"Inscreva-se", desc:"Pague a taxa de R$ 50 via PIX e garanta sua vaga no bolão." },
            { n:"02", titulo:"Escolha 3 times", desc:"Selecione 3 seleções que você acredita que podem ser campeãs." },
            { n:"03", titulo:"Acumule pontos", desc:"Ganhe pontos a cada vitória, empate, classificação e fase superada." },
            { n:"04", titulo:"Responda quizzes", desc:"Participe de quizzes temáticos durante a Copa e ganhe 0,5 ponto por acerto." },
          ].map(item=>(
            <div key={item.n} style={{background:"#0f1a0f",
              border:"1px solid rgba(0,200,83,.12)", borderRadius:16, padding:24}}>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:48,
                color:"rgba(0,200,83,.2)", lineHeight:1}}>{item.n}</div>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:20,
                fontWeight:700, color:"white", margin:"8px 0"}}>{item.titulo}</div>
              <div style={{fontSize:14, color:"#6b8a62", lineHeight:1.7}}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PONTUAÇÃO */}
      <section style={{padding:"80px 24px", background:"#0a120a"}}>
        <div style={{maxWidth:800, margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:52,
            color:"white", textAlign:"center", letterSpacing:3, marginBottom:48}}>
            SISTEMA DE PONTUAÇÃO
          </h2>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16}}>
            {[
              { fase:"Fase de Grupos", itens:[
                { desc:"Vitória do seu time", pts:"+3 pts" },
                { desc:"Empate do seu time", pts:"+1 pt" },
                { desc:"Classificar em 1º", pts:"+5 pts" },
                { desc:"Classificar em 2º", pts:"+3 pts" },
              ]},
              { fase:"Mata-mata", itens:[
                { desc:"Passar direto", pts:"+3 pts" },
                { desc:"Passar nos pênaltis", pts:"+1 pt" },
                { desc:"Quiz correto", pts:"+0,5 pt" },
                { desc:"Segunda chance", pts:"Média geral" },
              ]},
            ].map(grupo=>(
              <div key={grupo.fase} style={{background:"#0f1a0f",
                border:"1px solid rgba(0,200,83,.12)", borderRadius:16, padding:24}}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:16,
                  fontWeight:700, color:"#00C853", letterSpacing:2,
                  textTransform:"uppercase", marginBottom:16}}>{grupo.fase}</div>
                {grupo.itens.map(item=>(
                  <div key={item.desc} style={{display:"flex", justifyContent:"space-between",
                    padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <span style={{fontSize:14, color:"#dff0d8"}}>{item.desc}</span>
                    <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                      fontSize:16, fontWeight:700, color:"#00C853"}}>{item.pts}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:"100px 24px", textAlign:"center"}}>
        <div style={{background:"rgba(0,200,83,.06)", border:"1px solid rgba(0,200,83,.15)",
          borderRadius:20, padding:"6px 18px", fontSize:12, fontWeight:700,
          letterSpacing:2, color:"#00C853", textTransform:"uppercase",
          display:"inline-block", marginBottom:24}}>
          🎯 INSCRIÇÕES ABERTAS AGORA
        </div>
        <h2 style={{fontFamily:"'Bebas Neue', sans-serif",
          fontSize:"clamp(60px,10vw,120px)", color:"white",
          lineHeight:.85, letterSpacing:4, margin:"0 0 16px"}}>GARANTA</h2>
        <h3 style={{fontFamily:"'Bebas Neue', sans-serif",
          fontSize:"clamp(50px,8vw,100px)", color:"#FFD700",
          lineHeight:.85, letterSpacing:4, margin:"0 0 32px"}}>SUA VAGA</h3>
        <p style={{color:"#6b8a62", marginBottom:12, fontSize:15}}>
          Inscrições abertas até 24h antes da primeira partida da Copa.
        </p>
        <p style={{marginBottom:48, fontSize:15}}>
          <strong style={{color:"#00C853"}}>Segunda chance disponível</strong>
          {" "}até o início das Oitavas de Final — mesmo para quem não acertou nenhuma seleção classificada.
        </p>
        <button onClick={()=>navigate('/inscricao')}
          style={{background:"#FFD700", color:"#080d0a", border:"none", borderRadius:12,
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:700,
            letterSpacing:1.5, padding:"20px 56px", cursor:"pointer", display:"block",
            margin:"0 auto 16px"}}>
          PARTICIPAR POR R$ 50 →
        </button>
        <p style={{fontSize:13, color:"#6b8a62"}}>
          Pagamento 100% via PIX · Confirmação instantânea · Suporte via WhatsApp
        </p>
      </section>

    </div>
  )
}