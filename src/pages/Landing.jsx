import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Landing() {
  const navigate = useNavigate()
  const [participantes, setParticipantes] = useState(null)
  const [premio, setPremio] = useState({ total: 0, primeiro: 0, segundo: 0, terceiro: 0 })

  useEffect(() => {
    supabase
      .from('users')
      .select('id, status')
      .neq('status', 'admin')
      .then(({ data }) => {
        const total = (data || []).length
        const ativos = (data || []).filter(u => u.status === 'ativo').length
        setParticipantes(total)
        const fundo = Math.round(ativos * 50 * 0.85)
        setPremio({
          total: fundo,
          primeiro: Math.round(fundo * 0.60),
          segundo: Math.round(fundo * 0.25),
          terceiro: Math.round(fundo * 0.15),
        })
      })
  }, [])

  return (
    <div style={{background:"#060b08", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", overflowX:"hidden"}}>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:.5; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        .hero-btn:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 8px 32px rgba(0,200,83,.35); }
        .hero-btn { transition: all .2s ease; }
        .card-how:hover { border-color: rgba(0,200,83,.35) !important; transform: translateY(-4px); }
        .card-how { transition: all .2s ease; }
        .nav-btn:hover { background: rgba(0,200,83,.1) !important; }
        .nav-btn { transition: background .2s; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{position:"fixed", top:0, left:0, right:0, zIndex:100,
        background:"rgba(6,11,8,.95)", backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(0,200,83,.1)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 32px", height:64}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <span style={{fontSize:22}}>🌍</span>
          <div>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:20,
              color:"white", letterSpacing:3, lineHeight:1}}>BOLÃO DO DK</div>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:10,
              color:"#00C853", letterSpacing:2, textTransform:"uppercase"}}>Copa 2026</div>
          </div>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          {participantes !== null && participantes > 0 && (
            <div style={{background:"rgba(0,200,83,.1)", border:"1px solid rgba(0,200,83,.25)",
              borderRadius:20, padding:"4px 14px", fontSize:13, color:"#00C853", fontWeight:700}}>
              🟢 {participantes} {participantes === 1 ? 'participante' : 'participantes'}
            </div>
          )}
          <button className="nav-btn" onClick={()=>navigate('/login')}
            style={{background:"transparent", color:"#6b8a62",
              border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
              fontWeight:700, letterSpacing:1, padding:"7px 16px", cursor:"pointer"}}>
            JÁ TENHO CONTA
          </button>
          <button onClick={()=>navigate('/inscricao')}
            style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:8,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:13,
              fontWeight:700, letterSpacing:1, padding:"7px 16px", cursor:"pointer"}}>
            PARTICIPAR
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center",
        padding:"120px 24px 80px", position:"relative"}}>

        {/* Fundo decorativo */}
        <div style={{position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none"}}>
          <div style={{position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)",
            width:600, height:600, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(0,200,83,.06) 0%, transparent 70%)"}}/>
          <div style={{position:"absolute", top:100, left:"10%", width:2, height:120,
            background:"linear-gradient(to bottom, transparent, rgba(0,200,83,.3), transparent)"}}/>
          <div style={{position:"absolute", top:200, right:"8%", width:2, height:80,
            background:"linear-gradient(to bottom, transparent, rgba(0,200,83,.2), transparent)"}}/>
        </div>

        {/* Badge */}
        <div style={{animation:"fadeUp .6s ease both", background:"rgba(0,200,83,.08)",
          border:"1px solid rgba(0,200,83,.2)", borderRadius:20,
          padding:"6px 20px", fontSize:12, fontWeight:700,
          letterSpacing:2, color:"#00C853", textTransform:"uppercase", marginBottom:28,
          display:"inline-flex", alignItems:"center", gap:8}}>
          <span style={{animation:"pulse 2s infinite"}}>🌍</span>
          Copa do Mundo 2026 — México · EUA · Canadá
        </div>

        {/* Título principal */}
        <div style={{animation:"fadeUp .7s .1s ease both", marginBottom:8}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:"clamp(14px,2.5vw,20px)",
            fontWeight:700, letterSpacing:4, color:"#6b8a62", textTransform:"uppercase", marginBottom:4}}>
            Bolão dos Amigos do
          </div>
          <h1 style={{fontFamily:"'Bebas Neue', sans-serif",
            fontSize:"clamp(56px,10vw,120px)", color:"white",
            lineHeight:.85, letterSpacing:4, margin:"0 0 4px"}}>
            DIEGO <span style={{color:"#00C853"}}>(DK)</span>
          </h1>
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif",
            fontSize:"clamp(36px,6vw,72px)", color:"#dff0d8",
            lineHeight:1, letterSpacing:5, margin:"8px 0 0",
            opacity:.7}}>COPA DO MUNDO 2026</h2>
        </div>

        {/* Divisor */}
        <div style={{animation:"fadeUp .7s .2s ease both", width:80, height:3,
          background:"linear-gradient(to right, transparent, #00C853, transparent)",
          borderRadius:2, margin:"28px auto"}}/>

        {/* PRÊMIO */}
        {premio.total > 0 && (
          <div style={{animation:"fadeUp .7s .3s ease both",
            background:"linear-gradient(135deg, rgba(255,215,0,.08), rgba(255,215,0,.04))",
            border:"1px solid rgba(255,215,0,.2)", borderRadius:20,
            padding:"24px 40px", marginBottom:36, display:"inline-block",
            boxShadow:"0 0 40px rgba(255,215,0,.05)"}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
              fontWeight:700, letterSpacing:3, color:"#FFD700", textTransform:"uppercase",
              marginBottom:10}}>🏆 Fundo de Prêmios</div>
            <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:58,
              color:"#FFD700", lineHeight:1, marginBottom:18,
              textShadow:"0 0 30px rgba(255,215,0,.3)"}}>
              R$ {premio.total.toLocaleString('pt-BR')}
            </div>
            <div style={{display:"flex", gap:32, justifyContent:"center", flexWrap:"wrap"}}>
              {[
                { pos:"🥇 1º lugar", val: premio.primeiro, color:"#FFD700" },
                { pos:"🥈 2º lugar", val: premio.segundo, color:"#b0b0b0" },
                { pos:"🥉 3º lugar", val: premio.terceiro, color:"#cd7f32" },
              ].map(p => (
                <div key={p.pos} style={{textAlign:"center"}}>
                  <div style={{fontSize:12, color:"#6b8a62", marginBottom:4, letterSpacing:1}}>{p.pos}</div>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:24,
                    fontWeight:700, color:p.color}}>
                    R$ {p.val.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{animation:"fadeUp .7s .4s ease both",
          fontSize:17, color:"#6b8a62", maxWidth:480,
          lineHeight:1.9, marginBottom:44}}>
          Escolha 3 seleções, acompanhe cada jogo, responda quizzes e dispute o prêmio com os amigos em tempo real.
        </p>

        <div style={{animation:"fadeUp .7s .5s ease both",
          display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center"}}>
          <button className="hero-btn" onClick={()=>navigate('/inscricao')}
            style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:12,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700,
              letterSpacing:1.5, padding:"18px 44px", cursor:"pointer"}}>
            PARTICIPAR AGORA →
          </button>
          <button className="hero-btn" onClick={()=>navigate('/ranking')}
            style={{background:"transparent", color:"#00C853", border:"1.5px solid rgba(0,200,83,.5)",
              borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:20,
              fontWeight:700, letterSpacing:1.5, padding:"18px 44px", cursor:"pointer"}}>
            VER RANKING
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", alignItems:"center", gap:6,
          color:"#6b8a62", fontSize:11, letterSpacing:2, textTransform:"uppercase",
          animation:"float 2s infinite"}}>
          <span>Saiba mais</span>
          <span style={{fontSize:18}}>↓</span>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{background:"rgba(0,200,83,.05)", borderTop:"1px solid rgba(0,200,83,.1)",
        borderBottom:"1px solid rgba(0,200,83,.1)", padding:"20px 24px"}}>
        <div style={{maxWidth:800, margin:"0 auto", display:"flex",
          justifyContent:"center", gap:48, flexWrap:"wrap"}}>
          {[
            { val:"R$ 50", label:"Inscrição" },
            { val:"3", label:"Seleções por participante" },
            { val:"0,5 pt", label:"Por quiz respondido" },
            { val:"24h", label:"Para responder cada quiz" },
          ].map(s => (
            <div key={s.label} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:32,
                color:"#00C853", lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:11, color:"#6b8a62", letterSpacing:1,
                textTransform:"uppercase", marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <section style={{padding:"90px 24px", maxWidth:900, margin:"0 auto"}}>
        <div style={{textAlign:"center", marginBottom:52}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
            fontWeight:700, letterSpacing:3, color:"#00C853",
            textTransform:"uppercase", marginBottom:8}}>passo a passo</div>
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:52,
            color:"white", letterSpacing:3, margin:0}}>COMO FUNCIONA</h2>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:20}}>
          {[
            { n:"01", emoji:"💰", titulo:"Inscreva-se", desc:"Pague R$ 50 via PIX e garanta sua vaga no bolão dos amigos." },
            { n:"02", emoji:"🏳️", titulo:"Escolha 3 seleções", desc:"Selecione 3 seleções que você acredita que podem ir longe." },
            { n:"03", emoji:"⚽", titulo:"Acumule pontos", desc:"Ganhe pontos a cada vitória, empate e fase superada." },
            { n:"04", emoji:"🧠", titulo:"Responda quizzes", desc:"Participe dos quizzes temáticos e ganhe 0,5 ponto por acerto." },
          ].map(item=>(
            <div key={item.n} className="card-how" style={{background:"#0d1a0d",
              border:"1px solid rgba(0,200,83,.1)", borderRadius:16, padding:24,
              position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", top:12, right:16,
                fontFamily:"'Bebas Neue', sans-serif", fontSize:56,
                color:"rgba(0,200,83,.06)", lineHeight:1, pointerEvents:"none"}}>{item.n}</div>
              <div style={{fontSize:32, marginBottom:12}}>{item.emoji}</div>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:18,
                fontWeight:700, color:"white", marginBottom:8}}>{item.titulo}</div>
              <div style={{fontSize:14, color:"#6b8a62", lineHeight:1.7}}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PONTUAÇÃO */}
      <section style={{padding:"80px 24px", background:"#080f08"}}>
        <div style={{maxWidth:800, margin:"0 auto"}}>
          <div style={{textAlign:"center", marginBottom:52}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
              fontWeight:700, letterSpacing:3, color:"#00C853",
              textTransform:"uppercase", marginBottom:8}}>detalhes</div>
            <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:52,
              color:"white", letterSpacing:3, margin:0}}>SISTEMA DE PONTUAÇÃO</h2>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16}}>
            {[
              { fase:"Fase de Grupos", cor:"#00C853", itens:[
                { desc:"Vitória do seu time", pts:"+3 pts" },
                { desc:"Empate do seu time", pts:"+1 pt" },
                { desc:"Classificar em 1º", pts:"+5 pts" },
                { desc:"Classificar em 2º", pts:"+3 pts" },
              ]},
              { fase:"Mata-mata", cor:"#FFD700", itens:[
                { desc:"Passar direto", pts:"+3 pts" },
                { desc:"Passar nos pênaltis", pts:"+1 pt" },
                { desc:"Quiz correto", pts:"+0,5 pt" },
                { desc:"Segunda chance", pts:"Média geral" },
              ]},
            ].map(grupo=>(
              <div key={grupo.fase} style={{background:"#0d1a0d",
                border:"1px solid rgba(0,200,83,.1)", borderRadius:16, padding:24}}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
                  fontWeight:700, color:grupo.cor, letterSpacing:2,
                  textTransform:"uppercase", marginBottom:16,
                  paddingBottom:12, borderBottom:`1px solid rgba(255,255,255,.06)`}}>{grupo.fase}</div>
                {grupo.itens.map(item=>(
                  <div key={item.desc} style={{display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"10px 0",
                    borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <span style={{fontSize:14, color:"#9ab89a"}}>{item.desc}</span>
                    <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                      fontSize:16, fontWeight:700, color:grupo.cor}}>{item.pts}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:"110px 24px", textAlign:"center", position:"relative", overflow:"hidden"}}>
        <div style={{position:"absolute", inset:0, pointerEvents:"none"}}>
          <div style={{position:"absolute", bottom:"-20%", left:"50%", transform:"translateX(-50%)",
            width:700, height:400, borderRadius:"50%",
            background:"radial-gradient(ellipse, rgba(0,200,83,.05) 0%, transparent 70%)"}}/>
        </div>

        <div style={{background:"rgba(0,200,83,.08)", border:"1px solid rgba(0,200,83,.2)",
          borderRadius:20, padding:"6px 20px", fontSize:11, fontWeight:700,
          letterSpacing:3, color:"#00C853", textTransform:"uppercase",
          display:"inline-block", marginBottom:28}}>
          🎯 INSCRIÇÕES ABERTAS AGORA
        </div>
        <h2 style={{fontFamily:"'Bebas Neue', sans-serif",
          fontSize:"clamp(60px,10vw,110px)", color:"white",
          lineHeight:.85, letterSpacing:4, margin:"0 0 12px"}}>GARANTA</h2>
        <h3 style={{fontFamily:"'Bebas Neue', sans-serif",
          fontSize:"clamp(50px,8vw,90px)", color:"#FFD700",
          lineHeight:.85, letterSpacing:4, margin:"0 0 32px"}}>SUA VAGA</h3>

        <div style={{background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)",
          borderRadius:12, padding:"16px 32px", display:"inline-block", marginBottom:40}}>
          <p style={{color:"#6b8a62", fontSize:14, margin:"0 0 8px"}}>
            Inscrições abertas até 24h antes da primeira partida.
          </p>
          <p style={{fontSize:14, margin:0}}>
            <strong style={{color:"#00C853"}}>Segunda chance disponível</strong>
            {" "}até o início das Oitavas — mesmo sem seleção classificada.
          </p>
        </div>

        <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12}}>
          <button className="hero-btn" onClick={()=>navigate('/inscricao')}
            style={{background:"#FFD700", color:"#080d0a", border:"none", borderRadius:12,
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:22, fontWeight:700,
              letterSpacing:1.5, padding:"20px 60px", cursor:"pointer"}}>
            PARTICIPAR POR R$ 50 →
          </button>
          <p style={{fontSize:12, color:"#6b8a62", margin:0}}>
            Pagamento 100% via PIX · Confirmação instantânea · Suporte via WhatsApp
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid rgba(255,255,255,.05)", padding:"24px",
        textAlign:"center", color:"#3a5a3a", fontSize:12, letterSpacing:1}}>
        BOLÃO DOS AMIGOS DO DIEGO (DK) · COPA DO MUNDO 2026
      </footer>

    </div>
  )
}