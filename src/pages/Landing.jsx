import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const BANDEIRAS = {
  'México':'🇲🇽','África do Sul':'🇿🇦','Coreia do Sul':'🇰🇷','República Tcheca':'🇨🇿',
  'Canadá':'🇨🇦','Catar':'🇶🇦','Suíça':'🇨🇭','Itália':'🇮🇹',
  'Brasil':'🇧🇷','Marrocos':'🇲🇦','Haiti':'🇭🇹','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Estados Unidos':'🇺🇸','Paraguai':'🇵🇾','Austrália':'🇦🇺','Turquia':'🇹🇷',
  'Alemanha':'🇩🇪','Curaçao':'🇨🇼','Costa do Marfim':'🇨🇮','Equador':'🇪🇨',
  'Holanda':'🇳🇱','Japão':'🇯🇵','Tunísia':'🇹🇳','Ucrânia':'🇺🇦','Suécia':'🇸🇪',
  'Bélgica':'🇧🇪','Egito':'🇪🇬','Irã':'🇮🇷','Nova Zelândia':'🇳🇿',
  'Espanha':'🇪🇸','Cabo Verde':'🇨🇻','Arábia Saudita':'🇸🇦','Uruguai':'🇺🇾',
  'França':'🇫🇷','Senegal':'🇸🇳','Noruega':'🇳🇴','Iraque':'🇮🇶',
  'Argentina':'🇦🇷','Argélia':'🇩🇿','Áustria':'🇦🇹','Jordânia':'🇯🇴',
  'Portugal':'🇵🇹','Uzbequistão':'🇺🇿','Colômbia':'🇨🇴','RD Congo':'🇨🇩',
  'Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croácia':'🇭🇷','Gana':'🇬🇭','Panamá':'🇵🇦',
  'Bósnia e Herzegovina':'🇧🇦'
}

const TOP3_IDS = [
  'deea9a77-dfc9-4d10-833d-44effeeb6200', // Fernandes
  'd3346cdf-7470-4971-bba6-7827af9c1494', // Nilo
  '483a4a7f-8395-48b0-aa60-2f0b2213c2d8', // Paulo
]

const FASE_LABEL = {
  grupos: 'Fase de Grupos',
  dezasseis: '16 avos',
  oitavas: 'Oitavas',
  quartas: 'Quartas',
  semi: 'Semifinal',
  terceiro_lugar: '3º Lugar',
  final: 'Final',
}

const TIPO_LABEL = {
  vitoria_grupo: 'Vitória',
  empate_grupo: 'Empate',
  classificacao_grupo: 'Classificação',
  mata_mata_normal: 'Passou (tempo normal)',
  mata_mata_penaltis: 'Passou (pênaltis)',
  terceiro_lugar: '3º lugar',
  campeao: 'Campeão',
  colocacao_final: 'Colocação final',
  quiz: 'Quiz',
  quiz_bonus: 'Quiz Bônus',
  artilheiro: 'Artilheiro',
}

export default function Landing() {
  const navigate = useNavigate()
  const [participantes, setParticipantes] = useState(null)
  const [premio, setPremio] = useState({ total:0, primeiro:0, segundo:0, terceiro:0 })
  const [top3, setTop3] = useState([])

  useEffect(() => {
    supabase.from('users').select('id, status').neq('status', 'admin').then(({ data }) => {
      const total = (data||[]).length
      const ativos = (data||[]).filter(u=>u.status==='ativo').length
      setParticipantes(total)
      const fundo = Math.round(ativos * 50 * 0.85)
      setPremio({ total:fundo, primeiro:Math.round(fundo*.60), segundo:Math.round(fundo*.25), terceiro:Math.round(fundo*.15) })
    })

    // Busca dados dos top 3
    Promise.all([
      supabase.from('users').select('id, nome').in('id', TOP3_IDS),
      supabase.from('picks').select('user_id, team_id, teams(nome)').in('user_id', TOP3_IDS),
      supabase.from('points_log').select('user_id, team_id, tipo, fase, pontos, descricao').in('user_id', TOP3_IDS),
    ]).then(([{ data: users }, { data: picks }, { data: pts }]) => {
      const order = TOP3_IDS
      const resultado = order.map((id, idx) => {
        const user = (users||[]).find(u => u.id === id)
        const userPicks = (picks||[]).filter(p => p.user_id === id)
        const userPts = (pts||[]).filter(p => p.user_id === id)
        const total = userPts.reduce((a,b) => a + Number(b.pontos), 0)

        // Pontos por time
        const timesPontos = userPicks.map(pick => {
          const timePts = userPts.filter(p => p.team_id === pick.team_id)
          return {
            nome: pick.teams?.nome,
            total: timePts.reduce((a,b) => a + Number(b.pontos), 0),
            fases: timePts.map(p => ({
              tipo: p.tipo,
              fase: p.fase,
              pontos: Number(p.pontos),
              desc: p.descricao
            }))
          }
        })

        // Pontos sem time (quiz, artilheiro)
        const semTime = userPts.filter(p => !p.team_id)

        return { id, nome: user?.nome, total, timesPontos, semTime, pos: idx+1 }
      })
      setTop3(resultado)
    })
  }, [])

  const medalEmoji = ['🥇','🥈','🥉']
  const medalCor = ['#FFD700','#b0b0b0','#cd7f32']
  const posCor = ['rgba(255,215,0,.08)','rgba(180,180,180,.06)','rgba(205,127,50,.06)']
  const posBorder = ['rgba(255,215,0,.3)','rgba(180,180,180,.2)','rgba(205,127,50,.2)']

  return (
    <div style={{background:"#060b08", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", overflowX:"hidden"}}>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .hero-btn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 8px 32px rgba(0,200,83,.35)}
        .hero-btn{transition:all .2s ease}
        .nav-btn:hover{background:rgba(0,200,83,.1)!important}
        .nav-btn{transition:background .2s}
        .card-how:hover{border-color:rgba(0,200,83,.35)!important;transform:translateY(-4px)}
        .card-how{transition:all .2s ease}
        .glow-card{transition:all .25s ease}
        .glow-gold:hover{box-shadow:0 0 32px rgba(255,215,0,.25),0 0 64px rgba(255,215,0,.08);border-color:rgba(255,215,0,.5)!important;transform:translateY(-4px)}
        .glow-green:hover{box-shadow:0 0 32px rgba(0,200,83,.25),0 0 64px rgba(0,200,83,.08);border-color:rgba(0,200,83,.5)!important;transform:translateY(-4px)}
      `}</style>

      {/* NAVBAR */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(6,11,8,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(0,200,83,.1)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:64}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🌍</span>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"white",letterSpacing:3,lineHeight:1}}>BOLÃO DO DK</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,color:"#00C853",letterSpacing:2,textTransform:"uppercase"}}>Copa 2026</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {participantes !== null && participantes > 0 && (
            <div style={{background:"rgba(0,200,83,.1)",border:"1px solid rgba(0,200,83,.25)",borderRadius:20,padding:"4px 14px",fontSize:13,color:"#00C853",fontWeight:700}}>
              🟢 {participantes} participantes
            </div>
          )}
          <button className="nav-btn" onClick={()=>navigate('/login')} style={{background:"transparent",color:"#6b8a62",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:1,padding:"7px 16px",cursor:"pointer"}}>
            JA TENHO CONTA
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"120px 24px 60px",position:"relative"}}>
        <div style={{animation:"fadeUp .6s ease both",background:"rgba(0,200,83,.08)",border:"1px solid rgba(0,200,83,.2)",borderRadius:20,padding:"6px 20px",fontSize:12,fontWeight:700,letterSpacing:2,color:"#00C853",textTransform:"uppercase",marginBottom:20,display:"inline-flex",alignItems:"center",gap:8}}>
          <span style={{animation:"pulse 2s infinite"}}>🌍</span>
          Copa do Mundo 2026 — Mexico · EUA · Canada
        </div>
        <div style={{animation:"fadeUp .7s .1s ease both",marginBottom:8}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(14px,2.5vw,18px)",fontWeight:700,letterSpacing:4,color:"#6b8a62",textTransform:"uppercase",marginBottom:4}}>Bolão dos Amigos do</div>
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(56px,10vw,120px)",color:"white",lineHeight:.85,letterSpacing:4,margin:"0 0 4px"}}>DIEGO <span style={{color:"#00C853"}}>(DK)</span></h1>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(36px,6vw,72px)",color:"#dff0d8",lineHeight:1,letterSpacing:5,margin:"8px 0 0",opacity:.7}}>COPA DO MUNDO 2026</h2>
        </div>
        <div style={{animation:"fadeUp .7s .2s ease both",width:80,height:3,background:"linear-gradient(to right,transparent,#FFD700,transparent)",borderRadius:2,margin:"24px auto"}}/>
        <div style={{animation:"fadeUp .7s .3s ease both",background:"rgba(255,215,0,.06)",border:"1px solid rgba(255,215,0,.2)",borderRadius:12,padding:"10px 24px",fontSize:14,color:"#FFD700",fontWeight:700,marginBottom:28}}>
          🏁 ENCERRADO — Confira o resultado final abaixo!
        </div>
        <button className="hero-btn" onClick={()=>navigate('/ranking')} style={{background:"#00C853",color:"#080d0a",border:"none",borderRadius:12,fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,letterSpacing:1.5,padding:"16px 40px",cursor:"pointer"}}>
          VER RANKING COMPLETO
        </button>
      </section>

      {/* PÓDIO — TOP 3 */}
      <section style={{padding:"60px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:3,color:"#FFD700",textTransform:"uppercase",marginBottom:8}}>resultado final</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:"white",letterSpacing:3,margin:0}}>PODIO DO BOLAO</h2>
        </div>

        {top3.map((p, idx) => (
          <div key={p.id} style={{background:posCor[idx],border:`1px solid ${posBorder[idx]}`,borderRadius:16,padding:24,marginBottom:20}}>
            {/* Cabeçalho */}
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,lineHeight:1}}>{medalEmoji[idx]}</div>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:2,color:medalCor[idx],textTransform:"uppercase"}}>{idx===0?'Campeao':idx===1?'Vice-Campeao':'3 Lugar'}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"white",letterSpacing:2,lineHeight:1}}>{p.nome?.trim()}</div>
              </div>
              <div style={{marginLeft:"auto",textAlign:"right"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:medalCor[idx],lineHeight:1}}>{p.total?.toFixed(1)}</div>
                <div style={{fontSize:12,color:"#6b8a62"}}>pontos totais</div>
              </div>
            </div>

            {/* Times e linha do tempo */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:16}}>
              {(p.timesPontos||[]).map(time => (
                <div key={time.nome} style={{background:"rgba(0,0,0,.2)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                    <span style={{fontSize:28}}>{BANDEIRAS[time.nome]||'🏴'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:"#dff0d8"}}>{time.nome}</div>
                    </div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#00C853",lineHeight:1}}>+{time.total.toFixed(1)}</div>
                  </div>
                  {/* Linha do tempo por fase */}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {(time.fases||[]).sort((a,b)=>{
                      const order = ['grupos','dezasseis','oitavas','quartas','semi','terceiro_lugar','final']
                      return (order.indexOf(a.fase)||0) - (order.indexOf(b.fase)||0)
                    }).map((f,i) => (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:"rgba(255,255,255,.03)",borderRadius:6,borderLeft:`2px solid ${f.pontos>=3?"#FFD700":f.pontos>=2?"#00C853":"#6b8a62"}`}}>
                        <div>
                          <div style={{fontSize:11,color:"#6b8a62"}}>{FASE_LABEL[f.fase]||f.fase}</div>
                          <div style={{fontSize:12,color:"#dff0d8"}}>{TIPO_LABEL[f.tipo]||f.tipo}</div>
                        </div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:f.pontos>=3?"#FFD700":f.pontos>=2?"#00C853":"#6b8a62"}}>+{f.pontos.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pontos sem time (quiz, artilheiro) */}
            {(p.semTime||[]).length > 0 && (
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {p.semTime.map((s,i) => (
                  <div key={i} style={{background:"rgba(0,200,83,.08)",border:"1px solid rgba(0,200,83,.2)",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>{s.tipo==='quiz'?'🧠':s.tipo==='quiz_bonus'?'⚡':s.tipo==='artilheiro'?'⚽':'🎖️'}</span>
                    <div>
                      <div style={{fontSize:11,color:"#6b8a62"}}>{TIPO_LABEL[s.tipo]||s.tipo}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:"#00C853"}}>+{s.pontos.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* FUNDO DE PRÊMIOS */}
      {premio.total > 0 && (
        <section style={{padding:"60px 24px",background:"#080f08"}}>
          <div style={{maxWidth:800,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:36}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:3,color:"#FFD700",textTransform:"uppercase",marginBottom:8}}>premiacao</div>
              <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:"white",letterSpacing:3,margin:0}}>FUNDO DE PREMIOS</h2>
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,215,0,.04))",border:"1px solid rgba(255,215,0,.2)",borderRadius:20,padding:"32px",textAlign:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:3,color:"#FFD700",marginBottom:8}}>TOTAL ARRECADADO (85% das inscricoes)</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:64,color:"#FFD700",lineHeight:1,marginBottom:24,textShadow:"0 0 30px rgba(255,215,0,.3)"}}>R$ {premio.total.toLocaleString('pt-BR')}</div>
              <div style={{display:"flex",gap:32,justifyContent:"center",flexWrap:"wrap"}}>
                {[
                  {pos:"🥇 1 Lugar",val:premio.primeiro,cor:"#FFD700"},
                  {pos:"🥈 2 Lugar",val:premio.segundo,cor:"#b0b0b0"},
                  {pos:"🥉 3 Lugar",val:premio.terceiro,cor:"#cd7f32"},
                ].map(p => (
                  <div key={p.pos} style={{textAlign:"center"}}>
                    <div style={{fontSize:13,color:"#6b8a62",marginBottom:4}}>{p.pos}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:700,color:p.cor}}>R$ {p.val.toLocaleString('pt-BR')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"16px 24px"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:"#6b8a62",letterSpacing:2,marginBottom:12}}>COMO FOI FORMADO</div>
              {[
                "Cada participante pagou R$ 50,00 de inscricao",
                "85% do valor arrecadado foi destinado ao fundo de premios",
                "15% foi destinado a custos operacionais",
                "Premiacao dividida: 60% para o 1 lugar, 25% para o 2 e 15% para o 3",
              ].map((item,i) => (
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                  <span style={{color:"#00C853",fontSize:14,marginTop:1}}>✓</span>
                  <span style={{fontSize:14,color:"#9ab89a"}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOTÃO RANKING */}
      <section style={{padding:"40px 24px",textAlign:"center"}}>
        <button className="hero-btn" onClick={()=>navigate('/ranking')} style={{background:"transparent",color:"#00C853",border:"1.5px solid rgba(0,200,83,.5)",borderRadius:12,fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,letterSpacing:1.5,padding:"16px 48px",cursor:"pointer"}}>
          VER RANKING COMPLETO
        </button>
      </section>

      {/* COMO FUNCIONOU */}
      <section style={{padding:"60px 24px",maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:3,color:"#00C853",textTransform:"uppercase",marginBottom:8}}>passo a passo</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:"white",letterSpacing:3,margin:0}}>COMO FUNCIONOU</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
          {[
            {n:"01",emoji:"💰",titulo:"Inscricao",desc:"Cada participante pagou R$ 50 via PIX para garantir sua vaga no bolao."},
            {n:"02",emoji:"🏳️",titulo:"Escolha de 3 selecoes",desc:"Cada participante escolheu 3 selecoes que acreditava que iriam longe na Copa."},
            {n:"03",emoji:"⚽",titulo:"Acumulo de pontos",desc:"Pontos a cada vitoria, empate, classificacao de fase e avanco no mata-mata."},
            {n:"04",emoji:"🧠",titulo:"Quizzes e bonus",desc:"Quizzes tematicos valendo 0,5pt cada, quiz extra com ate 5pts e palpites bonus."},
          ].map(item => (
            <div key={item.n} className="card-how" style={{background:"#0d1a0d",border:"1px solid rgba(0,200,83,.1)",borderRadius:16,padding:24,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:12,right:16,fontFamily:"'Bebas Neue',sans-serif",fontSize:56,color:"rgba(0,200,83,.06)",lineHeight:1,pointerEvents:"none"}}>{item.n}</div>
              <div style={{fontSize:32,marginBottom:12}}>{item.emoji}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:"white",marginBottom:8}}>{item.titulo}</div>
              <div style={{fontSize:14,color:"#6b8a62",lineHeight:1.7}}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SISTEMA DE PONTUAÇÃO */}
      <section style={{padding:"60px 24px",background:"#080f08"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:3,color:"#00C853",textTransform:"uppercase",marginBottom:8}}>detalhes</div>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:"white",letterSpacing:3,margin:0}}>SISTEMA DE PONTUACAO</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
            {[
              {fase:"Fase de Grupos",cor:"#00C853",itens:[
                {desc:"Vitoria do seu time",pts:"+3 pts"},
                {desc:"Empate do seu time",pts:"+1 pt"},
                {desc:"Classificar em 1",pts:"+5 pts"},
                {desc:"Classificar em 2",pts:"+3 pts"},
                {desc:"Classificar em 3 (passa)",pts:"+1 pt"},
              ]},
              {fase:"Mata-mata",cor:"#FFD700",itens:[
                {desc:"Passar no tempo normal",pts:"+3 pts"},
                {desc:"Passar nos penaltis",pts:"+1 pt"},
                {desc:"Quiz correto",pts:"+0,5 pt"},
                {desc:"Quiz bonus — acerto",pts:"+5 pts"},
                {desc:"Quiz bonus — erro",pts:"+2 pts"},
                {desc:"Quiz bonus — timeout",pts:"+1 pt"},
              ]},
            ].map(grupo => (
              <div key={grupo.fase} style={{background:"#0d1a0d",border:"1px solid rgba(0,200,83,.1)",borderRadius:16,padding:24}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:grupo.cor,letterSpacing:2,textTransform:"uppercase",marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)"}}>{grupo.fase}</div>
                {grupo.itens.map(item => (
                  <div key={item.desc} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <span style={{fontSize:14,color:"#9ab89a"}}>{item.desc}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:grupo.cor}}>{item.pts}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SISTEMA DE PONTUAÇÃO DAS FINAIS */}
      <section style={{padding:"60px 24px",maxWidth:800,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:3,color:"#FFD700",textTransform:"uppercase",marginBottom:8}}>finais copa 2026</div>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"white",letterSpacing:3,margin:0}}>SISTEMA DE PONTUACAO DAS FINAIS</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
          <div style={{background:"#0d1a0d",border:"1px solid rgba(205,127,50,.25)",borderRadius:16,padding:24}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:"#cd7f32",letterSpacing:2,textTransform:"uppercase",marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)"}}>3 Lugar</div>
            {[{desc:"Vencer no tempo normal",pts:"+3 pts"},{desc:"Vencer nos penaltis",pts:"+1 pt"}].map(item => (
              <div key={item.desc} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:14,color:"#9ab89a"}}>{item.desc}</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:"#cd7f32"}}>{item.pts}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#0d1a0d",border:"1px solid rgba(255,215,0,.25)",borderRadius:16,padding:24}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:"#FFD700",letterSpacing:2,textTransform:"uppercase",marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)"}}>Grande Final</div>
            {[{desc:"Vencer no tempo normal",pts:"+5 pts"},{desc:"Vencer nos penaltis",pts:"+3 pts"}].map(item => (
              <div key={item.desc} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:14,color:"#9ab89a"}}>{item.desc}</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:"#FFD700"}}>{item.pts}</span>
              </div>
            ))}
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,215,0,.03))",border:"1px solid rgba(255,215,0,.3)",borderRadius:16,padding:24}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:"#FFD700",letterSpacing:2,textTransform:"uppercase",marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)"}}>Bonus Colocacao Final</div>
            <p style={{fontSize:12,color:"#6b8a62",marginBottom:12}}>Pontos extras para quem escolheu os times do podio!</p>
            {[{desc:"1 Time Campeao",pts:"+10 pts",cor:"#FFD700"},{desc:"2 Vice-Campeao",pts:"+6 pts",cor:"#b0b0b0"},{desc:"3 Colocado",pts:"+3 pts",cor:"#cd7f32"}].map(item => (
              <div key={item.desc} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <span style={{fontSize:14,color:"#9ab89a"}}>{item.desc}</span>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:item.cor}}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRITÉRIOS DE DESEMPATE */}
      <section style={{padding:"0 24px 60px",background:"#080f08"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{background:"#0d1a0d",border:"1px solid rgba(0,200,83,.1)",borderRadius:16,padding:28}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:"#FFD700",letterSpacing:2,textTransform:"uppercase",marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:8}}>
              Criterios de Desempate
            </div>
            <p style={{fontSize:13,color:"#6b8a62",marginBottom:20,lineHeight:1.6}}>Em caso de empate na pontuacao total ao final da Copa, os criterios sao aplicados nesta ordem:</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {n:"1",cor:"#FFD700",desc:"Maior numero de times classificados para as Oitavas dentre os 3 escolhidos"},
                {n:"2",cor:"#00C853",desc:"Maior pontuacao acumulada em quizzes"},
                {n:"3",cor:"#60a0ff",desc:"Acerto do palpite bonus — artilheiro ou placar exato da final"},
                {n:"4",cor:"#9b9b9b",desc:"Ordem cronologica de inscricao — quem se inscreveu primeiro"},
              ].map(c => (
                <div key={c.n} style={{display:"flex",alignItems:"center",gap:14,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"12px 16px"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:c.cor,minWidth:36,textAlign:"center",lineHeight:1}}>{c.n}</div>
                  <div style={{fontSize:14,color:"#dff0d8",lineHeight:1.5}}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid rgba(255,255,255,.05)",padding:"24px",textAlign:"center",color:"#3a5a3a",fontSize:12,letterSpacing:1}}>
        BOLAO DOS AMIGOS DO DIEGO (DK) · COPA DO MUNDO 2026 · ENCERRADO
      </footer>

    </div>
  )
}