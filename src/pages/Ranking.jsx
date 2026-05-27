import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
 
const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8",
    fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:680, margin:"0 auto" },
  card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)",
    borderRadius:14, padding:"8px 0" },
}
 
export default function Ranking() {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
 
  useEffect(()=>{
    loadRanking()
    const interval = setInterval(loadRanking, 30000)
    return () => clearInterval(interval)
  },[])
 
  async function loadRanking() {
    // Busca todos os usuários ativos
    const { data: users } = await supabase
      .from('users')
      .select('id, nome')
      .eq('status', 'ativo')
 
    if (!users) { setLoading(false); return }
 
    // Busca pontos
    const { data: pts } = await supabase
      .from('points_log')
      .select('user_id, pontos')
 
    const map = {}
    users.forEach(u => { map[u.id] = { nome: u.nome, total: 0 } })
    ;(pts || []).forEach(row => {
      if (map[row.user_id]) map[row.user_id].total += Number(row.pontos)
    })
 
    const sorted = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a,b) => b.total - a.total)
 
    setRanking(sorted)
    setLoading(false)
  }
 
  const medals = ['🥇','🥈','🥉']
 
  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        <button onClick={()=>navigate('/dashboard')}
          style={{background:"transparent", border:"none", color:"#6b8a62",
            fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700,
            letterSpacing:1, cursor:"pointer", marginBottom:24, padding:0}}>
          ← VOLTAR
        </button>
 
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:12,
            fontWeight:700, letterSpacing:2, textTransform:"uppercase",
            color:"#6b8a62", marginBottom:4}}>Classificação geral</div>
          <div style={{fontFamily:"'Bebas Neue', sans-serif", fontSize:44,
            color:"white", letterSpacing:3}}>CLASSIFICAÇÃO</div>
        </div>
 
        {loading ? (
          <p style={{color:"#FFD700"}}>Carregando classificação...</p>
        ) : ranking.length === 0 ? (
          <div style={s.card}>
            <div style={{padding:"32px 24px", textAlign:"center", color:"#6b8a62"}}>
              <div style={{fontSize:40, marginBottom:12}}>⚽</div>
              <p>Nenhum participante ativo ainda.</p>
            </div>
          </div>
        ) : (
          <div style={s.card}>
            {ranking.map((r,i)=>(
              <div key={r.id}>
                <div style={{display:"flex", alignItems:"center", gap:14,
                  padding:"13px 20px", borderRadius:10}}>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontSize:22,
                    fontWeight:900, minWidth:36, textAlign:"center",
                    color:i===0?"#FFD700":i===1?"#b0b0b0":i===2?"#cd7f32":"#6b8a62"}}>
                    {i<3 ? medals[i] : i+1}
                  </div>
                  <div style={{width:40, height:40, borderRadius:"50%",
                    background:"#1f2d1b", border:"2px solid rgba(0,200,83,.2)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:18, flexShrink:0}}>
                    {r.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15, fontWeight:600}}>{r.nome}</div>
                  </div>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif",
                    fontSize:28, fontWeight:900, color:"#00C853"}}>
                    {r.total.toFixed(1)}
                  </div>
                </div>
                {i<ranking.length-1&&<div style={{height:1,
                  background:"rgba(255,255,255,.04)", margin:"0 16px"}}/>}
              </div>
            ))}
          </div>
        )}
 
        <div style={{textAlign:"center", marginTop:16, fontSize:13, color:"#6b8a62"}}>
          Atualizado automaticamente a cada 30 segundos
        </div>
      </div>
    </div>
  )
}