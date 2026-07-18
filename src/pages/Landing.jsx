import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const BANDEIRAS = {
  'México':'🇲🇽','África do Sul':'🇿🇦','Coreia do Sul':'🇰🇷','República Tcheca':'🇨🇿',
  'Canadá':'🇨🇦','Catar':'🇶🇦','Suíça':'🇨🇭','Itália':'🇮🇹',
  'Brasil':'🇧🇷','Marrocos':'🇲🇦','Haiti':'🇭🇹','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos':'🇺🇸','Paraguai':'🇵🇾','Austrália':'🇦🇺','Turquia':'🇹🇷',
  'Alemanha':'🇩🇪','Curaçao':'🇨🇼','Costa do Marfim':'🇨🇮','Equador':'🇪🇨',
  'Holanda':'🇳🇱','Japão':'🇯🇵','Tunísia':'🇹🇳','Ucrânia':'🇺🇦',
  'Bélgica':'🇧🇪','Egito':'🇪🇬','Irã':'🇮🇷','Nova Zelândia':'🇳🇿',
  'Espanha':'🇪🇸','Cabo Verde':'🇨🇻','Arábia Saudita':'🇸🇦','Uruguai':'🇺🇾',
  'França':'🇫🇷','Senegal':'🇸🇳','Noruega':'🇳🇴','Iraque':'🇮🇶',
  'Argentina':'🇦🇷','Argélia':'🇩🇿','Áustria':'🇦🇹','Jordânia':'🇯🇴',
  'Portugal':'🇵🇹','Uzbequistão':'🇺🇿','Colômbia':'🇨🇴','RD Congo':'🇨🇩',
  'Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croácia':'🇭🇷','Gana':'🇬🇭','Panamá':'🇵🇦'
}

export default function Landing() {
  const navigate = useNavigate()
  const [participantes, setParticipantes] = useState(null)
  const [premio, setPremio] = useState({ total: 0, primeiro: 0, segundo: 0, terceiro: 0 })
  const [partidas, setPartidas] = useState([])
  const [grupoAtivo, setGrupoAtivo] = useState('todos')

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

    supabase
      .from('matches')
      .select('*, team_a:teams!matches_team_a_id_fkey(nome, grupo), team_b:teams!matches_team_b_id_fkey(nome, grupo)')
      .in('fase', ['terceiro_lugar', 'final'])
      .order('data_hora')
      .then(({ data }) => setPartidas(data || []))
  }, [])

  const partidasFiltradas = partidas

  const formatData = (dt) => {
    const d = new Date(dt)
    return {
      data: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
      hora: d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
      diaSemana: d.toLocaleDateString('pt-BR', { weekday:'short' }).replace('.','')
    }
  }

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
        .glow-card { transition: all .25s ease; }
        .glow-gold:hover { box-shadow: 0 0 32px rgba(255,215,0,.25), 0 0 64px rgba(255,215,0,.08); border-color: rgba(255,215,0,.5) !important; transform: translateY(-4px); }
        .glow-green:hover { box-shadow: 0 0 32px rgba(0,200,83,.25), 0 0 64px rgba(0,200,83,.08); border-color: rgba(0,200,83,.5) !important; transform: translateY(-4px); }
        .match-card:hover { border-color: rgba(0,200,83,.3) !important; background: rgba(0,200,83,.04) !important; }
        .match-card { transition: all .15s ease; }
        .grupo-tab:hover { color: #dff0d8 !important; }
        .grupo-tab { transition: all .15s; }
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

        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center",
        padding:"120px 24px 80px", position:"relative"}}>
        <div style={{position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none"}}>
          <div style={{position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)",
            width:600, height:600, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(0,200,83,.06) 0%, transparent 70%)"}}/>
          <div style={{position:"absolute", top:100, left:"10%", width:2, height:120,
            background:"linear-gradient(to bottom, transparent, rgba(0,200,83,.3), transparent)"}}/>
          <div style={{position:"absolute", top:200, right:"8%", width:2, height:80,
            background:"linear-gradient(to bottom, transparent, rgba(0,200,83,.2), transparent)"}}/>
        </div>

        <div style={{animation:"fadeUp .6s ease both", background:"rgba(0,200,83,.08)",
          border:"1px solid rgba(0,200,83,.2)", borderRadius:20,
          padding:"6px 20px", fontSize:12, fontWeight:700,
          letterSpacing:2, color:"#00C853", textTransform:"uppercase", marginBottom:28,
          display:"inline-flex", alignItems:"center", gap:8}}>
          <span style={{animation:"pulse 2s infinite"}}>🌍</span>
          Copa do Mundo 2026 — México · EUA · Canadá
        </div>

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
            lineHeight:1, letterSpacing:5, margin:"8px 0 0", opacity:.7}}>
            COPA DO MUNDO 2026
          </h2>
        </div>

        <div style={{animation:"fadeUp .7s .2s ease both", width:80, height:3,
          background:"linear-gradient(to right, transparent, #00C853, transparent)",
          borderRadius:2, margin:"28px auto"}}/>

        {/* Cards lado a lado: Prêmio + Destaques */}
        <div style={{animation:"fadeUp .7s .3s ease both",
          display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center",
          marginBottom:40, width:"100%", maxWidth:820}}>

          {/* Card Prêmio */}
          {premio.total > 0 && (
            <div className="glow-card glow-gold" style={{
              flex:"1 1 300px", minWidth:260, maxWidth:380,
              background:"linear-gradient(135deg, rgba(255,215,0,.08), rgba(255,215,0,.04))",
              border:"1px solid rgba(255,215,0,.2)", borderRadius:20,
              padding:"24px 28px", textAlign:"center",
            }}>
              <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
                fontWeight:700, letterSpacing:3, color:"#FFD700", textTransform:"uppercase",
                marginBottom:10}}>🏆 Fundo de Prêmios</div>
              <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:54,
                color:"#FFD700", lineHeight:1, marginBottom:16,
                textShadow:"0 0 30px rgba(255,215,0,.3)"}}>
                R$ {premio.total.toLocaleString('pt-BR')}
              </div>
              <div style={{display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap"}}>
                {[
                  { pos:"🥇 1º", val: premio.primeiro, color:"#FFD700" },
                  { pos:"🥈 2º", val: premio.segundo, color:"#b0b0b0" },
                  { pos:"🥉 3º", val: premio.terceiro, color:"#cd7f32" },
                ].map(p => (
                  <div key={p.pos} style={{textAlign:"center"}}>
                    <div style={{fontSize:12, color:"#6b8a62", marginBottom:4}}>{p.pos}</div>
                    <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:20,
                      fontWeight:700, color:p.color}}>
                      R$ {p.val.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card Destaques */}
          <div className="glow-card glow-green" style={{
            flex:"1 1 300px", minWidth:260, maxWidth:380,
            background:"linear-gradient(135deg, rgba(0,200,83,.08), rgba(0,200,83,.03))",
            border:"1px solid rgba(0,200,83,.2)", borderRadius:20,
            padding:"24px 28px", textAlign:"left",
            display:"flex", flexDirection:"column", justifyContent:"center", gap:14,
          }}>
            {[
              { emoji:"🏳️", titulo:"Escolha 3 seleções", desc:"Aposte nas que você acredita que vão longe" },
              { emoji:"⚽", titulo:"Acompanhe cada jogo", desc:"Pontos a cada vitória, empate e fase superada" },
              { emoji:"🧠", titulo:"Responda quizzes", desc:"+0,5 ponto por acerto em 24h" },
              { emoji:"🏆", titulo:"Dispute o prêmio", desc:"Com seus amigos em tempo real" },
            ].map(item => (
              <div key={item.titulo} style={{display:"flex", alignItems:"flex-start", gap:12}}>
                <span style={{fontSize:22, lineHeight:1, marginTop:2}}>{item.emoji}</span>
                <div>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:15,
                    fontWeight:700, color:"#dff0d8", letterSpacing:.5}}>{item.titulo}</div>
                  <div style={{fontSize:13, color:"#6b8a62", marginTop:2}}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{animation:"fadeUp .7s .5s ease both",
          display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center"}}>

          <button className="hero-btn" onClick={()=>navigate('/ranking')}
            style={{background:"transparent", color:"#00C853", border:"1.5px solid rgba(0,200,83,.5)",
              borderRadius:12, fontFamily:"'Barlow Condensed', sans-serif", fontSize:20,
              fontWeight:700, letterSpacing:1.5, padding:"18px 44px", cursor:"pointer"}}>
            VER RANKING
          </button>
        </div>

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

      {/* JOGOS DA FASE DE GRUPOS */}
      {partidas.length > 0 && (
        <section style={{padding:"80px 24px", maxWidth:960, margin:"0 auto"}}>
          <div style={{textAlign:"center", marginBottom:40}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
              fontWeight:700, letterSpacing:3, color:"#00C853",
              textTransform:"uppercase", marginBottom:8}}>calendário</div>
            <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:52,
              color:"white", letterSpacing:3, margin:0}}>FINAL & 3º LUGAR</h2>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12}}>
            {partidasFiltradas.map(m => {
              const { data, hora, diaSemana } = formatData(m.data_hora)
              const encerrado = m.status === 'encerrado'
              const flagA = BANDEIRAS[m.team_a?.nome] || '🏴'
              const flagB = BANDEIRAS[m.team_b?.nome] || '🏴'
              return (
                <div key={m.id} className="match-card" style={{
                  background:"#0d1a0d",
                  border:`1px solid ${encerrado ? "rgba(0,200,83,.2)" : "rgba(255,255,255,.07)"}`,
                  borderRadius:14, padding:"16px 20px",
                }}>
                  {/* Cabeçalho */}
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                    <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
                      fontWeight:700, letterSpacing:1.5, color:"#FFD700", textTransform:"uppercase"}}>
                      ⚔️ Final & 3º Lugar
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:6}}>
                      {encerrado ? (
                        <span style={{background:"rgba(0,200,83,.12)", color:"#00C853",
                          border:"1px solid rgba(0,200,83,.25)", borderRadius:20,
                          padding:"2px 10px", fontSize:11, fontWeight:700}}>
                          Encerrado
                        </span>
                      ) : (
                        <span style={{background:"rgba(255,255,255,.05)", color:"#6b8a62",
                          border:"1px solid rgba(255,255,255,.08)", borderRadius:20,
                          padding:"2px 10px", fontSize:11, fontWeight:700}}>
                          {diaSemana} {data} · {hora}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Placar / Times */}
                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:8}}>
                    {/* Time A */}
                    <div style={{flex:1, textAlign:"center"}}>
                      <div style={{fontSize:28, marginBottom:4}}>{flagA}</div>
                      <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
                        fontWeight:700, color:"#dff0d8", lineHeight:1.2}}>
                        {m.team_a?.nome}
                      </div>
                    </div>

                    {/* Placar */}
                    <div style={{textAlign:"center", minWidth:64}}>
                      {encerrado ? (
                        <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:36,
                          color:"#00C853", letterSpacing:2, lineHeight:1}}>
                          {m.placar_a} <span style={{color:"rgba(0,200,83,.4)"}}>×</span> {m.placar_b}
                        </div>
                      ) : (
                        <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:28,
                          color:"rgba(255,255,255,.15)", letterSpacing:2}}>
                          VS
                        </div>
                      )}
                    </div>

                    {/* Time B */}
                    <div style={{flex:1, textAlign:"center"}}>
                      <div style={{fontSize:28, marginBottom:4}}>{flagB}</div>
                      <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
                        fontWeight:700, color:"#dff0d8", lineHeight:1.2}}>
                        {m.team_b?.nome}
                      </div>
                    </div>
                  </div>

                  {/* Data para jogos futuros */}
                  {!encerrado && (
                    <div style={{textAlign:"center", marginTop:12, fontSize:12, color:"#3a5a3a"}}>
                      ⏰ {diaSemana} {data} às {hora}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {partidasFiltradas.length === 0 && (
            <div style={{textAlign:"center", color:"#6b8a62", padding:"40px 0"}}>
              Nenhuma partida encontrada para este grupo.
            </div>
          )}
        </section>
      )}

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

      {/* CRITÉRIOS DE DESEMPATE */}
      <section style={{padding:"0 24px 80px", background:"#080f08"}}>
        <div style={{maxWidth:800, margin:"0 auto"}}>
          <div style={{background:"#0d1a0d", border:"1px solid rgba(0,200,83,.1)", borderRadius:16, padding:28}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
              fontWeight:700, color:"#FFD700", letterSpacing:2,
              textTransform:"uppercase", marginBottom:16,
              paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,.06)",
              display:"flex", alignItems:"center", gap:8}}>
              ⚖️ Critérios de Desempate
            </div>
            <p style={{fontSize:13, color:"#6b8a62", marginBottom:20, lineHeight:1.6}}>
              Em caso de empate na pontuação total ao final da Copa, os critérios são aplicados nesta ordem:
            </p>
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {[
                { n:"1º", cor:"#FFD700", desc:"Maior número de times classificados para as Oitavas dentre os 3 escolhidos" },
                { n:"2º", cor:"#00C853", desc:"Maior pontuação acumulada em quizzes" },
                { n:"3º", cor:"#60a0ff", desc:"Acerto do palpite bônus — artilheiro ou placar exato da final" },
                { n:"4º", cor:"#9b9b9b", desc:"Ordem cronológica de inscrição — quem se inscreveu primeiro" },
              ].map(c => (
                <div key={c.n} style={{display:"flex", alignItems:"center", gap:14,
                  background:"rgba(255,255,255,.03)", borderRadius:10, padding:"12px 16px"}}>
                  <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:22,
                    color:c.cor, minWidth:36, textAlign:"center", lineHeight:1}}>{c.n}</div>
                  <div style={{fontSize:14, color:"#dff0d8", lineHeight:1.5}}>{c.desc}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16, background:"rgba(255,70,70,.06)",
              border:"1px solid rgba(255,70,70,.15)", borderRadius:10,
              padding:"10px 16px", display:"flex", alignItems:"center", gap:10}}>
              <span style={{fontSize:16}}>⚠️</span>
              <span style={{fontSize:13, color:"#ff9090"}}>
                Empate no 4º critério: nenhum dos dois recebe o prêmio — o valor é dividido igualmente entre eles.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PONTUAÇÃO ESPECIAL FASE FINAL */}
      <section style={{padding:"60px 24px", maxWidth:800, margin:"0 auto"}}>
        <div style={{textAlign:"center", marginBottom:36}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:11,
            fontWeight:700, letterSpacing:3, color:"#FFD700",
            textTransform:"uppercase", marginBottom:8}}>finais copa 2026</div>
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:48,
            color:"white", letterSpacing:3, margin:0}}>SISTEMA DE PONTUAÇÃO DAS FINAIS</h2>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16}}>
          <div style={{background:"#0d1a0d", border:"1px solid rgba(205,127,50,.25)", borderRadius:16, padding:24}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
              fontWeight:700, color:"#cd7f32", letterSpacing:2,
              textTransform:"uppercase", marginBottom:16,
              paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              🥉 Disputa de 3º Lugar
            </div>
            {[
              { desc:"Vencer no tempo normal", pts:"+3 pts" },
              { desc:"Vencer nos pênaltis", pts:"+1 pt" },
            ].map(item => (
              <div key={item.desc} style={{display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:14, color:"#9ab89a"}}>{item.desc}</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                  fontSize:16, fontWeight:700, color:"#cd7f32"}}>{item.pts}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#0d1a0d", border:"1px solid rgba(255,215,0,.25)", borderRadius:16, padding:24}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
              fontWeight:700, color:"#FFD700", letterSpacing:2,
              textTransform:"uppercase", marginBottom:16,
              paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              🏆 Grande Final
            </div>
            {[
              { desc:"Vencer no tempo normal", pts:"+5 pts" },
              { desc:"Vencer nos pênaltis", pts:"+3 pts" },
            ].map(item => (
              <div key={item.desc} style={{display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:14, color:"#9ab89a"}}>{item.desc}</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                  fontSize:16, fontWeight:700, color:"#FFD700"}}>{item.pts}</span>
              </div>
            ))}
          </div>
          <div style={{background:"linear-gradient(135deg, rgba(255,215,0,.08), rgba(255,215,0,.03))",
            border:"1px solid rgba(255,215,0,.3)", borderRadius:16, padding:24}}>
            <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:14,
              fontWeight:700, color:"#FFD700", letterSpacing:2,
              textTransform:"uppercase", marginBottom:16,
              paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              🎖️ Bônus Colocação Final
            </div>
            <p style={{fontSize:12, color:"#6b8a62", marginBottom:12}}>
              Pontos extras para quem escolheu os times do pódio!
            </p>
            {[
              { desc:"🥇 Time Campeão", pts:"+10 pts", cor:"#FFD700" },
              { desc:"🥈 Vice-Campeão", pts:"+6 pts", cor:"#b0b0b0" },
              { desc:"🥉 3º Colocado", pts:"+3 pts", cor:"#cd7f32" },
            ].map(item => (
              <div key={item.desc} style={{display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:14, color:"#9ab89a"}}>{item.desc}</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif",
                  fontSize:16, fontWeight:700, color:item.cor}}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSCRIÇÕES ENCERRADAS */}
      <section style={{padding:"80px 24px", textAlign:"center"}}>
        <div style={{maxWidth:600, margin:"0 auto",
          background:"rgba(255,70,70,.05)", border:"1px solid rgba(255,70,70,.15)",
          borderRadius:20, padding:"48px 32px"}}>
          <div style={{fontSize:52, marginBottom:16}}>🔒</div>
          <h2 style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:52,
            color:"white", letterSpacing:3, margin:"0 0 12px"}}>INSCRIÇÕES ENCERRADAS</h2>
          <p style={{color:"#6b8a62", fontSize:16, lineHeight:1.8, marginBottom:32, maxWidth:400, margin:"0 auto 32px"}}>
            O prazo para participar do Bolão do DK Copa 2026 foi encerrado. Acompanhe os jogos e torça pelas suas seleções!
          </p>
          <div style={{display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap"}}>
            <button className="hero-btn" onClick={()=>navigate('/ranking')}
              style={{background:"#00C853", color:"#080d0a", border:"none", borderRadius:12,
                fontFamily:"'Barlow Condensed', sans-serif", fontSize:18, fontWeight:700,
                letterSpacing:1.5, padding:"14px 36px", cursor:"pointer"}}>
              VER RANKING 🏆
            </button>
            <button className="hero-btn" onClick={()=>navigate('/login')}
              style={{background:"transparent", color:"#00C853",
                border:"1.5px solid rgba(0,200,83,.4)", borderRadius:12,
                fontFamily:"'Barlow Condensed', sans-serif", fontSize:18,
                fontWeight:700, letterSpacing:1.5, padding:"14px 36px", cursor:"pointer"}}>
              ENTRAR NA MINHA CONTA
            </button>
          </div>
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