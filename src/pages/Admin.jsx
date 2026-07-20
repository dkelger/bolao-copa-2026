import { useState, useEffect } from 'react'
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

const s = {
  wrap: { background:"#080d0a", minHeight:"100vh", color:"#dff0d8", fontFamily:"'Barlow', sans-serif", padding:"32px 24px" },
  inner: { maxWidth:960, margin:"0 auto" },
  card: { background:"#1a2418", border:"1px solid rgba(0,200,83,.16)", borderRadius:14, padding:20, marginBottom:16 },
  btn: { background:"#00C853", color:"#080d0a", border:"none", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, letterSpacing:1.5, padding:"10px 20px", cursor:"pointer" },
  btnRed: { background:"rgba(255,70,70,.15)", color:"#ff7070", border:"1px solid rgba(255,70,70,.3)", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, padding:"8px 16px", cursor:"pointer" },
  btnOut: { background:"transparent", color:"#6b8a62", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, padding:"8px 16px", cursor:"pointer" },
  btnYellow: { background:"rgba(255,215,0,.15)", color:"#FFD700", border:"1px solid rgba(255,215,0,.3)", borderRadius:10, fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, padding:"8px 16px", cursor:"pointer" },
  input: { background:"rgba(255,255,255,.05)", border:"1.5px solid rgba(0,200,83,.16)", borderRadius:8, color:"#dff0d8", fontFamily:"'Barlow', sans-serif", fontSize:14, padding:"10px 14px", outline:"none" },
  tab: (active) => ({ fontFamily:"'Barlow Condensed', sans-serif", fontSize:13, fontWeight:700, letterSpacing:1, textTransform:"uppercase", padding:"8px 18px", borderRadius:10, border: active?"none":"1px solid rgba(0,200,83,.16)", background: active?"#00C853":"transparent", color: active?"#080d0a":"#6b8a62", cursor:"pointer" }),
  th: { fontFamily:"'Barlow Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#6b8a62", padding:"10px 14px", textAlign:"left", borderBottom:"1px solid rgba(0,200,83,.16)" },
  td: { padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,.05)", fontSize:14, verticalAlign:"top" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 },
  modal: { background:"#1a2418", border:"1px solid rgba(0,200,83,.25)", borderRadius:16, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" },
}

const CLASSIFICACAO_PTS = { 1:5, 2:3, 3:1, 4:0 }
const CLASSIFICACAO_LABEL = { 1:'🥇 1º lugar', 2:'🥈 2º lugar', 3:'🥉 3º lugar', 4:'❌ Eliminado' }
const CLASSIFICACAO_COR = { 1:'#FFD700', 2:'#b0b0b0', 3:'#00C853', 4:'#ff7070' }

// Chaveamento oficial FIFA 16 avos
// tipo '1'=lider, '2'=vice, '3'=terceiro(opcoes=grupos possiveis)
const CHAVEAMENTO = [
  { slot:'M1',  a:{tipo:'2',grupo:'A'}, b:{tipo:'2',grupo:'B'} },
  { slot:'M2',  a:{tipo:'1',grupo:'C'}, b:{tipo:'2',grupo:'F'} },
  { slot:'M3',  a:{tipo:'1',grupo:'E'}, b:{tipo:'3',opcoes:'ABCDF'} },
  { slot:'M4',  a:{tipo:'1',grupo:'F'}, b:{tipo:'2',grupo:'C'} },
  { slot:'M5',  a:{tipo:'1',grupo:'I'}, b:{tipo:'3',opcoes:'CDFGH'} },
  { slot:'M6',  a:{tipo:'1',grupo:'A'}, b:{tipo:'3',opcoes:'CEFHI'} },
  { slot:'M7',  a:{tipo:'1',grupo:'D'}, b:{tipo:'3',opcoes:'BEFIJ'} },
  { slot:'M8',  a:{tipo:'1',grupo:'G'}, b:{tipo:'3',opcoes:'AEHIJ'} },
  { slot:'M9',  a:{tipo:'2',grupo:'E'}, b:{tipo:'2',grupo:'I'} },
  { slot:'M10', a:{tipo:'2',grupo:'D'}, b:{tipo:'2',grupo:'G'} },
  { slot:'M11', a:{tipo:'1',grupo:'H'}, b:{tipo:'2',grupo:'J'} },
  { slot:'M12', a:{tipo:'1',grupo:'J'}, b:{tipo:'2',grupo:'H'} },
  { slot:'M13', a:{tipo:'1',grupo:'B'}, b:{tipo:'3',opcoes:'EFGIJ'} },
  { slot:'M14', a:{tipo:'2',grupo:'K'}, b:{tipo:'2',grupo:'L'} },
  { slot:'M15', a:{tipo:'1',grupo:'L'}, b:{tipo:'3',opcoes:'EHIJK'} },
  { slot:'M16', a:{tipo:'1',grupo:'K'}, b:{tipo:'3',opcoes:'DEIJL'} },
]

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('partidas')
  const [matches, setMatches] = useState([])
  const [users, setUsers] = useState([])
  const [picks, setPicks] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [allTeams, setAllTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [editMatch, setEditMatch] = useState(null)
  const [placar, setPlacar] = useState({ a:'', b:'', penaltis:false, penaltis_a:'', penaltis_b:'' })
  const [newQuiz, setNewQuiz] = useState(false)
  const [tipoNovoQuiz, setTipoNovoQuiz] = useState('normal')
  const [quiz, setQuiz] = useState({ pergunta:'', a:'', b:'', c:'', d:'', correta:'A', expira:'' })
  const [notif, setNotif] = useState({ titulo:'', mensagem:'' })
  const [stats, setStats] = useState({ participantes:0, arrecadado:0, ativos:0 })
  const [autorizado, setAutorizado] = useState(null)
  const [classificacoes, setClassificacoes] = useState({})
  const [terceirosClassificados, setTerceirosClassificados] = useState([]) // grupos dos 8 terceiros que passam
  const [savingClassif, setSavingClassif] = useState(false)
  const [classificMsg, setClassificMsg] = useState('')
  const [gerandoJogos, setGerandoJogos] = useState(false)
  const [jogosGerados, setJogosGerados] = useState(false)
  const [colocacaoFinal, setColocacaoFinal] = useState({ primeiro:'', segundo:'', terceiro:'' })
  const [savingColocacao, setSavingColocacao] = useState(false)
  const [colocacaoMsg, setColocacaoMsg] = useState('')

  // Modal inscrever seleções
  const [modalUser, setModalUser] = useState(null)
  const [modalPicks, setModalPicks] = useState([])
  const [teamSearch, setTeamSearch] = useState('')
  const [savingPicks, setSavingPicks] = useState(false)
  const [pickError, setPickError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data?.session?.user?.email
      if (!email || !['dkelger@gmail.com','diego_admin@bolao2026.com'].includes(email)) {
        setAutorizado(false); navigate('/')
      } else {
        setAutorizado(true); loadAll()
      }
    })
  }, [])

  async function loadAll() {
    const [{ data: m }, { data: u }, { data: q }, { data: p }, { data: t }] = await Promise.all([
      supabase.from('matches').select('*, team_a:teams!matches_team_a_id_fkey(nome), team_b:teams!matches_team_b_id_fkey(nome)').order('data_hora'),
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
      supabase.from('picks').select('user_id, teams(nome)'),
      supabase.from('teams').select('*').order('grupo'),
    ])
    setMatches(m || [])
    setUsers(u || [])
    setQuizzes(q || [])
    setPicks(p || [])
    setAllTeams(t || [])

    const classifMap = {}
    ;(t || []).forEach(team => { if (team.classificacao) classifMap[team.id] = team.classificacao })
    setClassificacoes(classifMap)

    // Verifica se jogos dos 16 avos já foram gerados
    const temDezesseis = (m || []).some(x => x.fase === 'dezasseis')
    setJogosGerados(!!(m || []).some(x => x.fase === 'dezasseis'))

    const naoAdmin = (u || []).filter(x => x.status !== 'admin')
    const ativos = naoAdmin.filter(x => x.status === 'ativo').length
    setStats({ participantes: naoAdmin.length, arrecadado: ativos * 50, ativos })
  }

  const grupos = {}
  allTeams.forEach(t => {
    if (!grupos[t.grupo]) grupos[t.grupo] = []
    grupos[t.grupo].push(t)
  })

  // Terceiros de cada grupo (os que têm classificacao = 3)
  const terceirosDisponiveis = allTeams.filter(t => classificacoes[t.id] === 3)

  function setClassif(teamId, pos) {
    setClassificacoes(prev => ({ ...prev, [teamId]: pos }))
  }

  function toggleTerceiro(grupo) {
    if (terceirosClassificados.includes(grupo)) {
      setTerceirosClassificados(prev => prev.filter(g => g !== grupo))
    } else {
      if (terceirosClassificados.length >= 8) return
      setTerceirosClassificados(prev => [...prev, grupo])
    }
  }

  // Resolve qual time ocupa um slot do chaveamento
  function resolverSlot(slot, teamsByClassif) {
    if (slot.tipo === '1') {
      return teamsByClassif[`1_${slot.grupo}`] || null
    }
    if (slot.tipo === '2') {
      return teamsByClassif[`2_${slot.grupo}`] || null
    }
    if (slot.tipo === '3') {
      // Pega o terceiro classificado cujo grupo está nas opções
      const opcoes = slot.opcoes.split('')
      for (const g of terceirosClassificados) {
        if (opcoes.includes(g)) {
          const candidato = teamsByClassif[`3_${g}`]
          if (candidato) return candidato
        }
      }
      return null
    }
    return null
  }

  async function salvarClassificacoes() {
    setSavingClassif(true); setClassificMsg('')
    try {
      for (const [teamId, pos] of Object.entries(classificacoes)) {
        await supabase.from('teams').update({ classificacao: pos }).eq('id', teamId)
      }

      const logs = []
      for (const [teamId, pos] of Object.entries(classificacoes)) {
        // Só dá pontos para 1º e 2º agora; 3º só se estiver na lista dos classificados
        const team = allTeams.find(t => t.id === teamId)
        let ptsEfetivos = 0

        if (pos === 1) ptsEfetivos = 5
        else if (pos === 2) ptsEfetivos = 3
        else if (pos === 3 && terceirosClassificados.includes(team?.grupo)) ptsEfetivos = 1
        else ptsEfetivos = 0

        if (ptsEfetivos === 0) continue

        const { data: jaExiste } = await supabase
          .from('points_log').select('id')
          .eq('team_id', teamId).eq('tipo', 'classificacao_grupo').limit(1)
        if (jaExiste && jaExiste.length > 0) continue

        const { data: teamPicks } = await supabase
          .from('picks').select('user_id').eq('team_id', teamId)
        ;(teamPicks || []).forEach(p => {
          logs.push({
            user_id: p.user_id, team_id: teamId,
            tipo: 'classificacao_grupo', pontos: ptsEfetivos,
            descricao: `${CLASSIFICACAO_LABEL[pos]} no grupo +${ptsEfetivos}pts`
          })
        })
      }

      if (logs.length > 0) await supabase.from('points_log').insert(logs)
      setClassificMsg(`✅ Classificações salvas! ${logs.length} pontos distribuídos.`)
      await loadAll()
    } catch (err) {
      setClassificMsg('❌ Erro: ' + err.message)
    } finally {
      setSavingClassif(false)
    }
  }

  async function gerarJogos16Avos() {
    if (terceirosClassificados.length !== 8) {
      setClassificMsg('❌ Selecione exatamente 8 terceiros classificados antes de gerar os jogos!')
      return
    }
    setGerandoJogos(true); setClassificMsg('')
    try {
      // Monta mapa grupo+pos → team
      const teamsByClassif = {}
      allTeams.forEach(t => {
        const pos = classificacoes[t.id]
        if (pos) teamsByClassif[`${pos}_${t.grupo}`] = t
      })

      // Mapeia terceiros classificados: para cada slot de 3º, usa o terceiro do grupo correto
      // Precisamos distribuir os 8 terceiros pelos slots que os aceitam
      const terceirosMap = {} // grupo → time
      terceirosClassificados.forEach(g => {
        const t = teamsByClassif[`3_${g}`]
        if (t) terceirosMap[g] = t
      })

      // Gera os jogos
      const jogos = []
      const dataBase = new Date('2026-06-28T18:00:00Z')

      for (let i = 0; i < CHAVEAMENTO.length; i++) {
        const jogo = CHAVEAMENTO[i]
        let timeA = null, timeB = null

        // Resolve time A
        if (jogo.a.tipo === '3') {
          const opcoes = jogo.a.opcoes.split('')
          for (const g of terceirosClassificados) {
            if (opcoes.includes(g) && terceirosMap[g]) {
              timeA = terceirosMap[g]
              break
            }
          }
        } else {
          timeA = teamsByClassif[`${jogo.a.tipo}_${jogo.a.grupo}`]
        }

        // Resolve time B
        if (jogo.b.tipo === '3') {
          const opcoes = jogo.b.opcoes.split('')
          for (const g of terceirosClassificados) {
            if (opcoes.includes(g) && terceirosMap[g]) {
              timeB = terceirosMap[g]
              break
            }
          }
        } else {
          timeB = teamsByClassif[`${jogo.b.tipo}_${jogo.b.grupo}`]
        }

        if (!timeA || !timeB) {
          console.warn(`Slot ${jogo.slot}: não foi possível resolver times`, jogo, timeA, timeB)
          continue
        }

        const dataJogo = new Date(dataBase.getTime() + i * 8 * 3600 * 1000)
        jogos.push({
          team_a_id: timeA.id,
          team_b_id: timeB.id,
          fase: 'dezasseis',
          data_hora: dataJogo.toISOString(),
          status: 'agendado',
        })
      }

      if (jogos.length === 0) {
        setClassificMsg('❌ Não foi possível gerar os jogos. Verifique as classificações.')
        return
      }

      const { error } = await supabase.from('matches').insert(jogos)
      if (error) throw error

      setClassificMsg(`✅ ${jogos.length} jogos dos 16 avos gerados com sucesso! Veja na aba Partidas.`)
      await loadAll()
    } catch (err) {
      setClassificMsg('❌ Erro ao gerar jogos: ' + err.message)
    } finally {
      setGerandoJogos(false)
    }
  }

  function getPicksDoUsuario(userId) { return picks.filter(p => p.user_id === userId) }
  function abrirModalInscrever(user) { setModalUser(user); setModalPicks([]); setTeamSearch(''); setPickError('') }
  function fecharModal() { setModalUser(null); setModalPicks([]); setTeamSearch(''); setPickError('') }
  function toggleModalPick(team) {
    const jaEsta = modalPicks.find(t => t.id === team.id)
    if (jaEsta) { setModalPicks(modalPicks.filter(t => t.id !== team.id)); return }
    if (modalPicks.length >= 3) { setPickError('Máximo de 3 seleções permitido.'); return }
    setModalPicks([...modalPicks, team]); setPickError('')
  }
  async function salvarPicksAdmin() {
    if (modalPicks.length !== 3) { setPickError('Escolha exatamente 3 seleções.'); return }
    setSavingPicks(true); setPickError('')
    try {
      await supabase.from('picks').delete().eq('user_id', modalUser.id)
      const { error } = await supabase.from('picks').insert(modalPicks.map(t => ({ user_id: modalUser.id, team_id: t.id })))
      if (error) throw error
      fecharModal(); await loadAll()
    } catch (err) { setPickError('Erro: ' + err.message) }
    finally { setSavingPicks(false) }
  }

  async function lancarResultado(match) {
    setLoading(true)
    const pa = parseInt(placar.a), pb = parseInt(placar.b)
    const isMataaMata = match.fase !== 'grupos'
    const comPenaltis = isMataaMata && placar.penaltis
    const pen_a = comPenaltis ? parseInt(placar.penaltis_a) : null
    const pen_b = comPenaltis ? parseInt(placar.penaltis_b) : null
    let vencedor = null
    if (isMataaMata) {
      vencedor = comPenaltis ? (pen_a > pen_b ? match.team_a_id : match.team_b_id) : (pa > pb ? match.team_a_id : match.team_b_id)
    } else {
      vencedor = pa > pb ? match.team_a_id : pb > pa ? match.team_b_id : null
    }
    await supabase.from('matches').update({
      placar_a: pa, placar_b: pb, penaltis_a: pen_a, penaltis_b: pen_b,
      vencedor_id: vencedor, passou_penaltis: comPenaltis || false,
      status: 'encerrado', updated_at: new Date().toISOString()
    }).eq('id', match.id)
    setEditMatch(null); setPlacar({ a:'', b:'', penaltis:false, penaltis_a:'', penaltis_b:'' })
    await calcularPontos(match, pa, pb, vencedor, comPenaltis)
    await loadAll(); setLoading(false)
  }

  async function calcularPontos(match, pa, pb, vencedor, comPenaltis) {
    const { data: picks } = await supabase.from('picks').select('user_id, team_id').in('team_id', [match.team_a_id, match.team_b_id])
    if (!picks) return
    const logs = []
    for (const pick of picks) {
      const isTeamA = pick.team_id === match.team_a_id
      const teamScore = isTeamA ? pa : pb
      const opponentScore = isTeamA ? pb : pa
      let pontos = 0, tipo = '', desc = ''

      if (match.fase === 'grupos') {
        if (teamScore > opponentScore) { pontos = 3; tipo = 'vitoria_grupo'; desc = 'Vitoria na fase de grupos +3pts' }
        else if (teamScore === opponentScore) { pontos = 1; tipo = 'empate_grupo'; desc = 'Empate na fase de grupos +1pt' }
      } else if (match.fase === 'terceiro_lugar') {
        if (pick.team_id === vencedor) {
          if (comPenaltis) { pontos = 1; tipo = 'terceiro_lugar'; desc = '3º lugar nos pênaltis +1pt' }
          else { pontos = 3; tipo = 'terceiro_lugar'; desc = '3º lugar no tempo normal +3pts' }
        }
      } else if (match.fase === 'final') {
        if (pick.team_id === vencedor) {
          if (comPenaltis) { pontos = 3; tipo = 'campeao'; desc = 'Campeão nos pênaltis +3pts' }
          else { pontos = 5; tipo = 'campeao'; desc = 'Campeão no tempo normal +5pts' }
        }
      } else {
        if (pick.team_id === vencedor) {
          if (comPenaltis) { pontos = 1; tipo = 'mata_mata_penaltis'; desc = `Avancou nos pênaltis (${match.fase}) +1pt` }
          else { pontos = 3; tipo = 'mata_mata_normal'; desc = `Avancou no tempo normal (${match.fase}) +3pts` }
        }
      }
      if (pontos > 0) logs.push({ user_id: pick.user_id, team_id: pick.team_id, match_id: match.id, tipo, pontos, descricao: desc, fase: match.fase })
    }
    if (logs.length > 0) await supabase.from('points_log').insert(logs)
  }

  async function distribuirColocacaoFinal() {
    if (!colocacaoFinal.primeiro || !colocacaoFinal.segundo || !colocacaoFinal.terceiro) {
      setColocacaoMsg('❌ Selecione os 3 times colocados!'); return
    }
    setSavingColocacao(true); setColocacaoMsg('')
    try {
      const times = [
        { teamId: colocacaoFinal.primeiro, pontos: 10, desc: '🥇 1º lugar final +10pts', tipo: 'colocacao_final' },
        { teamId: colocacaoFinal.segundo, pontos: 6, desc: '🥈 2º lugar final +6pts', tipo: 'colocacao_final' },
        { teamId: colocacaoFinal.terceiro, pontos: 3, desc: '🥉 3º lugar final +3pts', tipo: 'colocacao_final' },
      ]
      const logs = []
      for (const t of times) {
        const { data: jaExiste } = await supabase.from('points_log').select('id')
          .eq('team_id', t.teamId).eq('tipo', 'colocacao_final').limit(1)
        if (jaExiste && jaExiste.length > 0) continue
        const { data: teamPicks } = await supabase.from('picks').select('user_id').eq('team_id', t.teamId)
        ;(teamPicks || []).forEach(p => {
          logs.push({ user_id: p.user_id, team_id: t.teamId, tipo: t.tipo, pontos: t.pontos, descricao: t.desc, fase: 'final' })
        })
      }
      if (logs.length > 0) await supabase.from('points_log').insert(logs)
      setColocacaoMsg(`✅ Pontos de colocação distribuídos! ${logs.length} registros inseridos.`)
      await loadAll()
    } catch (err) {
      setColocacaoMsg('❌ Erro: ' + err.message)
    } finally {
      setSavingColocacao(false)
    }
  }


  async function ativarUsuario(userId) {
    await supabase.from('users').update({ status: 'ativo' }).eq('id', userId); loadAll()
  }

  async function publicarQuiz() {
    setLoading(true)
    const alternativas = [
      { id:'A', texto: quiz.a }, { id:'B', texto: quiz.b },
      { id:'C', texto: quiz.c }, { id:'D', texto: quiz.d },
    ].filter(x => x.texto)
    await supabase.from('quizzes').insert({
      pergunta: quiz.pergunta, alternativas, resposta_correta: quiz.correta, publicado: true,
      publicado_em: new Date().toISOString(),
      expira_em: tipoNovoQuiz === 'bonus' ? new Date(Date.now() + 100*60*1000).toISOString() : (quiz.expira || new Date(Date.now() + 24*60*60*1000).toISOString()),
      tipo: tipoNovoQuiz,
    })
    setQuiz({ pergunta:'', a:'', b:'', c:'', d:'', correta:'A', expira:'' })
    setTipoNovoQuiz('normal'); setNewQuiz(false); loadAll(); setLoading(false)
  }

  const FASE_LABEL = { grupos:'Grupos', dezasseis:'16 avos', oitavas:'Oitavas', quartas:'Quartas', semi:'Semi', final:'Final', terceiro_lugar:'3º Lugar' }
  const FASE_COR = { grupos:'#6b8a62', dezasseis:'#00C853', oitavas:'#FFD700', quartas:'#ff8c00', semi:'#ff4444', final:'#FFD700' }

  const formatData = (dt) => {
    const d = new Date(dt)
    return {
      data: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
      hora: d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    }
  }

  const teamsFiltered = allTeams.filter(t => t.nome.toLowerCase().includes(teamSearch.toLowerCase()))
  const partidasGrupos = matches.filter(m => m.fase === 'grupos')
  const partidasMataaMata = matches.filter(m => m.fase !== 'grupos')
  const totalGruposEncerrados = partidasGrupos.filter(m => m.status === 'encerrado').length
  const gruposFinalizado = totalGruposEncerrados === partidasGrupos.length && partidasGrupos.length > 0

  if (autorizado === null) return <div style={{background:'#080d0a',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#00C853',fontSize:18}}>Verificando acesso...</div>
  if (!autorizado) return null

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#6b8a62",marginBottom:4}}>PAINEL</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:"white",letterSpacing:3}}>ADMINISTRADOR</div>
          </div>
          <button style={s.btnOut} onClick={() => navigate('/')}>← INICIO</button>
        </div>

        {/* STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
          {[
            { val: stats.participantes, label:"Inscritos", color:"#dff0d8" },
            { val: stats.ativos, label:"Pagamentos confirmados", color:"#00C853" },
            { val: `R$ ${(stats.arrecadado).toLocaleString('pt-BR')}`, label:"Arrecadado", color:"#FFD700" },
            { val: `R$ ${Math.round(stats.arrecadado * 0.85).toLocaleString('pt-BR')}`, label:"Fundo premios", color:"#00C853" },
          ].map(st => (
            <div key={st.label} style={s.card}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,color:st.color,lineHeight:1}}>{st.val}</div>
              <div style={{fontSize:12,color:"#6b8a62",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginTop:4}}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {[['partidas','⚽ Partidas'],['grupos','🏆 Grupos'],['participantes','👥 Participantes'],['quizzes','🧠 Quizzes'],['notif','🔔 Notificacoes']].map(([id,label]) => (
            <button key={id} style={s.tab(tab===id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ===== PARTIDAS ===== */}
        {tab==='partidas' && (
          <div>
            {/* Fase de grupos */}
            <div style={s.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:gruposFinalizado?0:16}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>⚽ Fase de Grupos</div>
                <span style={{fontSize:12,color:gruposFinalizado?"#00C853":"#FFD700",fontWeight:700}}>
                  {totalGruposEncerrados}/{partidasGrupos.length} encerrados
                </span>
              </div>
              {!gruposFinalizado ? (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>
                      <th style={s.th}>Data</th><th style={s.th}>Partida</th>
                      <th style={s.th}>Placar</th><th style={s.th}>Status</th><th style={s.th}>Acao</th>
                    </tr></thead>
                    <tbody>
                      {partidasGrupos.filter(m => m.status !== 'encerrado').map(m => {
                        const { data, hora } = formatData(m.data_hora)
                        return (
                          <tr key={m.id}>
                            <td style={s.td}><div style={{fontSize:13,fontWeight:600}}>{data}</div><div style={{fontSize:12,color:"#6b8a62"}}>{hora}</div></td>
                            <td style={s.td}><strong>{m.team_a?.nome}</strong> vs <strong>{m.team_b?.nome}</strong></td>
                            <td style={s.td}>
                              {editMatch===m.id ? (
                                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                  <input style={{...s.input,width:48,textAlign:"center"}} value={placar.a} onChange={e=>setPlacar({...placar,a:e.target.value})} placeholder="0"/>
                                  <span style={{color:"#6b8a62"}}>x</span>
                                  <input style={{...s.input,width:48,textAlign:"center"}} value={placar.b} onChange={e=>setPlacar({...placar,b:e.target.value})} placeholder="0"/>
                                </div>
                              ) : <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:"#6b8a62"}}>- x -</span>}
                            </td>
                            <td style={s.td}><span style={{background:"rgba(255,255,255,.06)",color:"#6b8a62",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>{m.status}</span></td>
                            <td style={s.td}>
                              {editMatch===m.id ? (
                                <div style={{display:"flex",gap:6}}>
                                  <button style={s.btn} onClick={()=>lancarResultado(m)} disabled={loading}>SALVAR</button>
                                  <button style={s.btnOut} onClick={()=>setEditMatch(null)}>X</button>
                                </div>
                              ) : <button style={s.btnOut} onClick={()=>{setEditMatch(m.id);setPlacar({a:'',b:'',penaltis:false,penaltis_a:'',penaltis_b:''})}}>LANCAR</button>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{color:"#00C853",fontSize:14}}>✅ Fase de grupos encerrada! Vá para a aba <strong>🏆 Grupos</strong> para definir as classificações e gerar os 16 avos.</div>
              )}
            </div>

            {/* Mata-mata */}
            {partidasMataaMata.length > 0 && (
              <div style={s.card}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,marginBottom:16}}>⚔️ Mata-Mata</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>
                      <th style={s.th}>Data</th><th style={s.th}>Fase</th><th style={s.th}>Partida</th>
                      <th style={s.th}>Placar</th><th style={s.th}>Status</th><th style={s.th}>Acao</th>
                    </tr></thead>
                    <tbody>
                      {partidasMataaMata.map(m => {
                        const { data, hora } = formatData(m.data_hora)
                        return (
                          <tr key={m.id}>
                            <td style={s.td}><div style={{fontSize:13,fontWeight:600}}>{data}</div><div style={{fontSize:12,color:"#6b8a62"}}>{hora}</div></td>
                            <td style={s.td}><span style={{background:`${FASE_COR[m.fase]}18`,color:FASE_COR[m.fase]||'#6b8a62',border:`1px solid ${FASE_COR[m.fase]}44`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{FASE_LABEL[m.fase]||m.fase}</span></td>
                            <td style={s.td}><strong>{m.team_a?.nome}</strong> vs <strong>{m.team_b?.nome}</strong></td>
                            <td style={s.td}>
                              {editMatch===m.id ? (
                                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                    <input style={{...s.input,width:48,textAlign:"center"}} value={placar.a} onChange={e=>setPlacar({...placar,a:e.target.value})} placeholder="0"/>
                                    <span style={{color:"#6b8a62"}}>x</span>
                                    <input style={{...s.input,width:48,textAlign:"center"}} value={placar.b} onChange={e=>setPlacar({...placar,b:e.target.value})} placeholder="0"/>
                                  </div>
                                  <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                                    <input type="checkbox" checked={placar.penaltis} onChange={e=>setPlacar({...placar,penaltis:e.target.checked})}/>
                                    <span style={{fontSize:12,color:"#FFD700"}}>Foi para pênaltis?</span>
                                  </label>
                                  {placar.penaltis && (
                                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                      <span style={{fontSize:11,color:"#6b8a62"}}>PEN:</span>
                                      <input style={{...s.input,width:44,textAlign:"center",fontSize:12}} value={placar.penaltis_a} onChange={e=>setPlacar({...placar,penaltis_a:e.target.value})} placeholder="0"/>
                                      <span style={{color:"#6b8a62"}}>x</span>
                                      <input style={{...s.input,width:44,textAlign:"center",fontSize:12}} value={placar.penaltis_b} onChange={e=>setPlacar({...placar,penaltis_b:e.target.value})} placeholder="0"/>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,color:m.status==='encerrado'?"#00C853":"#6b8a62"}}>
                                    {m.status==='encerrado'?`${m.placar_a} x ${m.placar_b}`:'- x -'}
                                  </span>
                                  {m.passou_penaltis && m.penaltis_a!==null && <div style={{fontSize:11,color:"#FFD700"}}>Pên: {m.penaltis_a} x {m.penaltis_b}</div>}
                                </div>
                              )}
                            </td>
                            <td style={s.td}><span style={{background:m.status==='encerrado'?"rgba(0,200,83,.12)":"rgba(255,255,255,.06)",color:m.status==='encerrado'?"#00C853":"#6b8a62",border:`1px solid ${m.status==='encerrado'?"rgba(0,200,83,.25)":"rgba(255,255,255,.1)"}`,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>{m.status}</span></td>
                            <td style={s.td}>
                              {m.status !== 'encerrado' && (
                                editMatch===m.id ? (
                                  <div style={{display:"flex",gap:6}}>
                                    <button style={s.btn} onClick={()=>lancarResultado(m)} disabled={loading}>SALVAR</button>
                                    <button style={s.btnOut} onClick={()=>setEditMatch(null)}>X</button>
                                  </div>
                                ) : <button style={s.btnOut} onClick={()=>{setEditMatch(m.id);setPlacar({a:'',b:'',penaltis:false,penaltis_a:'',penaltis_b:''})}}>LANCAR</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== GRUPOS ===== */}
        {tab==='grupos' && (
          <div>
            <div style={{background:"rgba(255,215,0,.07)",border:"1px solid rgba(255,215,0,.2)",borderRadius:12,padding:"14px 18px",marginBottom:20,fontSize:13}}>
              <strong style={{color:"#FFD700"}}>Como funciona:</strong> 1º clique nos botões para definir a posição de cada time.
              2º selecione os 8 terceiros que se classificaram. 3º salve os pontos. 4º gere os jogos dos 16 avos.
              🥇+5pts · 🥈+3pts · 🥉+1pt (só se classificado) · ❌=0pts
            </div>

            {/* Grid dos grupos */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16,marginBottom:24}}>
              {Object.entries(grupos).sort().map(([grupo, times]) => (
                <div key={grupo} style={s.card}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,letterSpacing:2,color:"#00C853",marginBottom:12}}>GRUPO {grupo}</div>
                  {times.map(t => {
                    const pos = classificacoes[t.id]
                    return (
                      <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"8px 12px",background:"rgba(255,255,255,.03)",borderRadius:10}}>
                        <span style={{fontSize:20}}>{BANDEIRAS[t.nome]||'🏴'}</span>
                        <div style={{flex:1,fontSize:14,fontWeight:600}}>{t.nome}</div>
                        <div style={{display:"flex",gap:4}}>
                          {[1,2,3,4].map(p => (
                            <button key={p} onClick={() => setClassif(t.id, p)}
                              style={{width:32,height:32,borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,background:pos===p?CLASSIFICACAO_COR[p]:"rgba(255,255,255,.08)",color:pos===p?"#080d0a":"#6b8a62",transition:"all .15s"}}>
                              {p===4?'✕':p+'º'}
                            </button>
                          ))}
                        </div>
                        {pos && <span style={{fontSize:11,color:CLASSIFICACAO_COR[pos],fontWeight:700,minWidth:48}}>{pos<4?`+${CLASSIFICACAO_PTS[pos]}pts`:'0pts'}</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Terceiros classificados */}
            {terceirosDisponiveis.length > 0 && (
              <div style={s.card}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,marginBottom:8}}>
                  🥉 Terceiros classificados ({terceirosClassificados.length}/8)
                </div>
                <p style={{fontSize:13,color:"#6b8a62",marginBottom:16}}>
                  Selecione exatamente os 8 terceiros colocados que se classificaram para os 16 avos:
                </p>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {terceirosDisponiveis.map(t => {
                    const selecionado = terceirosClassificados.includes(t.grupo)
                    const desabilitado = !selecionado && terceirosClassificados.length >= 8
                    return (
                      <div key={t.id} onClick={() => !desabilitado && toggleTerceiro(t.grupo)}
                        style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:10,cursor:desabilitado?"not-allowed":"pointer",opacity:desabilitado?0.4:1,background:selecionado?"rgba(0,200,83,.15)":"rgba(255,255,255,.04)",border:`1.5px solid ${selecionado?"rgba(0,200,83,.5)":"rgba(255,255,255,.08)"}`,transition:"all .15s"}}>
                        <span style={{fontSize:20}}>{BANDEIRAS[t.nome]||'🏴'}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:selecionado?"#00C853":"#dff0d8"}}>{t.nome}</div>
                          <div style={{fontSize:11,color:"#6b8a62"}}>Grupo {t.grupo}</div>
                        </div>
                        {selecionado && <span style={{color:"#00C853",fontSize:16}}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mensagem */}
            {classificMsg && (
              <div style={{background:classificMsg.includes('✅')?"rgba(0,200,83,.1)":"rgba(255,70,70,.1)",border:`1px solid ${classificMsg.includes('✅')?"rgba(0,200,83,.3)":"rgba(255,70,70,.3)"}`,borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:14,color:classificMsg.includes('✅')?"#00C853":"#ff7070"}}>
                {classificMsg}
              </div>
            )}

            {/* Botões */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button style={{...s.btn,padding:"14px 28px"}} onClick={salvarClassificacoes} disabled={savingClassif}>
                {savingClassif?'Salvando...':'💾 SALVAR CLASSIFICAÇÕES E PONTUAR'}
              </button>
              {!jogosGerados && (
                <button
                  style={{...s.btn,background:terceirosClassificados.length===8?"#FFD700":"rgba(255,215,0,.3)",color:"#080d0a",padding:"14px 28px",opacity:terceirosClassificados.length===8?1:0.6}}
                  onClick={gerarJogos16Avos}
                  disabled={gerandoJogos||terceirosClassificados.length!==8}>
                  {gerandoJogos?'Gerando...':'⚡ GERAR JOGOS DOS 16 AVOS'}
                </button>
              )}
              {jogosGerados && (
                <div style={{padding:"14px 20px",background:"rgba(0,200,83,.1)",border:"1px solid rgba(0,200,83,.3)",borderRadius:10,fontSize:14,color:"#00C853",fontWeight:700}}>
                  ✅ Jogos dos 16 avos já gerados!
                </div>
              )}
            </div>

            {/* COLOCAÇÃO FINAL */}
            <div style={{...s.card, marginTop:20}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,marginBottom:8}}>
                🏆 Colocação Final — Distribuir Pontos Bônus
              </div>
              <p style={{fontSize:13,color:"#6b8a62",marginBottom:16}}>
                Após a final, selecione 1º, 2º e 3º colocados para distribuir +10/+6/+3pts.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                {[
                  { label:"🥇 1º Lugar (+10pts)", key:"primeiro", cor:"#FFD700" },
                  { label:"🥈 2º Lugar (+6pts)", key:"segundo", cor:"#b0b0b0" },
                  { label:"🥉 3º Lugar (+3pts)", key:"terceiro", cor:"#cd7f32" },
                ].map(item => (
                  <div key={item.key} style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:item.cor,minWidth:180}}>{item.label}</span>
                    <select style={{...s.input,flex:1,minWidth:200}}
                      value={colocacaoFinal[item.key]}
                      onChange={e=>setColocacaoFinal(prev=>({...prev,[item.key]:e.target.value}))}>
                      <option value="">Selecione o time...</option>
                      {allTeams.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {colocacaoMsg && (
                <div style={{background:colocacaoMsg.includes('✅')?"rgba(0,200,83,.1)":"rgba(255,70,70,.1)",
                  border:`1px solid ${colocacaoMsg.includes('✅')?"rgba(0,200,83,.3)":"rgba(255,70,70,.3)"}`,
                  borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,
                  color:colocacaoMsg.includes('✅')?"#00C853":"#ff7070"}}>
                  {colocacaoMsg}
                </div>
              )}
              <button style={{...s.btn,background:"#FFD700",color:"#080d0a",padding:"14px 28px"}}
                onClick={distribuirColocacaoFinal} disabled={savingColocacao}>
                {savingColocacao?"Distribuindo...":"🏆 DISTRIBUIR PONTOS DE COLOCAÇÃO FINAL"}
              </button>
            </div>
          </div>
        )}

        {/* ===== PARTICIPANTES ===== */}
        {tab==='participantes' && (
          <div style={s.card}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,marginBottom:16}}>Participantes ({users.filter(u=>u.status!=='admin').length})</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>
                  <th style={s.th}>Nome</th><th style={s.th}>E-mail</th><th style={s.th}>WhatsApp</th>
                  <th style={s.th}>Seleções</th><th style={s.th}>Status</th><th style={s.th}>Acao</th>
                </tr></thead>
                <tbody>
                  {users.filter(u=>u.status!=='admin').map(u => {
                    const userPicks = getPicksDoUsuario(u.id)
                    const semSelecoes = userPicks.length === 0
                    return (
                      <tr key={u.id}>
                        <td style={s.td}><strong>{u.nome}</strong></td>
                        <td style={s.td}><span style={{color:"#6b8a62"}}>{u.email}</span></td>
                        <td style={s.td}>{u.whatsapp||'-'}</td>
                        <td style={s.td}>
                          {semSelecoes ? <span style={{color:"#ff7070",fontSize:12}}>Sem seleções</span> : (
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              {userPicks.map((p,i) => <span key={i} style={{background:"rgba(0,200,83,.08)",border:"1px solid rgba(0,200,83,.2)",borderRadius:20,padding:"2px 10px",fontSize:12,color:"#00C853",fontWeight:600,display:"inline-block",whiteSpace:"nowrap"}}>{p.teams?.nome}</span>)}
                            </div>
                          )}
                        </td>
                        <td style={s.td}><span style={{background:u.status==='ativo'?"rgba(0,200,83,.12)":"rgba(255,215,0,.1)",color:u.status==='ativo'?"#00C853":"#FFD700",border:`1px solid ${u.status==='ativo'?"rgba(0,200,83,.25)":"rgba(255,215,0,.25)"}`,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>{u.status}</span></td>
                        <td style={s.td}>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {u.status==='pendente' && <button style={s.btn} onClick={()=>ativarUsuario(u.id)}>ATIVAR</button>}
                            {semSelecoes && <button style={s.btnYellow} onClick={()=>abrirModalInscrever(u)}>+ INSCREVER</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== QUIZZES ===== */}
        {tab==='quizzes' && (
          <div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <button style={s.btn} onClick={()=>{setTipoNovoQuiz('normal');setNewQuiz(true)}}>+ CRIAR QUIZ NORMAL</button>
              <button style={{...s.btn,background:"#FFD700",color:"#080d0a"}} onClick={()=>{setTipoNovoQuiz('bonus');setNewQuiz(true)}}>⚡ CRIAR QUIZ PRÊMIO EXTRA</button>
            </div>
            {newQuiz && (
              <div style={s.card}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700}}>{tipoNovoQuiz==='bonus'?'⚡ Quiz Prêmio Extra':'Novo Quiz'}</div>
                  {tipoNovoQuiz==='bonus' && <span style={{background:"rgba(255,215,0,.15)",color:"#FFD700",border:"1px solid rgba(255,215,0,.3)",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}}>100min · +5/+2/+1pt</span>}
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:12,color:"#6b8a62",display:"block",marginBottom:6}}>PERGUNTA</label>
                  <textarea style={{...s.input,width:"100%",minHeight:80,resize:"vertical"}} value={quiz.pergunta} onChange={e=>setQuiz({...quiz,pergunta:e.target.value})} placeholder="Digite a pergunta..."/>
                </div>
                {[['a','A'],['b','B'],['c','C'],['d','D']].map(([key,label]) => (
                  <div key={key} style={{marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:900,width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>{label}</span>
                    <input style={{...s.input,flex:1}} value={quiz[key]} onChange={e=>setQuiz({...quiz,[key]:e.target.value})} placeholder={`Alternativa ${label}...`}/>
                  </div>
                ))}
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:12,color:"#6b8a62",display:"block",marginBottom:6}}>RESPOSTA CORRETA</label>
                  <select style={s.input} value={quiz.correta} onChange={e=>setQuiz({...quiz,correta:e.target.value})}>
                    {['A','B','C','D'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button style={s.btnOut} onClick={()=>setNewQuiz(false)}>CANCELAR</button>
                  <button style={s.btn} onClick={publicarQuiz} disabled={loading||!quiz.pergunta||!quiz.a||!quiz.b}>{loading?'Publicando...':'PUBLICAR'}</button>
                </div>
              </div>
            )}
            <div style={s.card}>
              {quizzes.length===0 ? <p style={{color:"#6b8a62",fontSize:14}}>Nenhum quiz criado ainda.</p> : quizzes.map(q => (
                <div key={q.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.05)",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      {q.tipo==='bonus' && <span style={{fontSize:14}}>⚡</span>}
                      <div style={{fontSize:15,fontWeight:600}}>{q.pergunta}</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{background:q.publicado?"rgba(0,200,83,.12)":"rgba(255,255,255,.06)",color:q.publicado?"#00C853":"#6b8a62",border:`1px solid ${q.publicado?"rgba(0,200,83,.25)":"rgba(255,255,255,.1)"}`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{q.publicado?'publicado':'rascunho'}</span>
                      {q.tipo==='bonus' && <span style={{background:"rgba(255,215,0,.12)",color:"#FFD700",border:"1px solid rgba(255,215,0,.25)",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>⚡ prêmio extra</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== NOTIFICACOES ===== */}
        {tab==='notif' && (
          <div style={s.card}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:700,marginBottom:16}}>Enviar Notificacao</div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:"#6b8a62",display:"block",marginBottom:6}}>TITULO</label>
              <input style={{...s.input,width:"100%"}} value={notif.titulo} onChange={e=>setNotif({...notif,titulo:e.target.value})} placeholder="Ex: Quiz novo disponivel!"/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:"#6b8a62",display:"block",marginBottom:6}}>MENSAGEM</label>
              <textarea style={{...s.input,width:"100%",minHeight:100,resize:"vertical"}} value={notif.mensagem} onChange={e=>setNotif({...notif,mensagem:e.target.value})} placeholder="Texto da notificacao..."/>
            </div>
            <button style={s.btn} onClick={async()=>{
              await supabase.from('notifications').insert({tipo:'custom',titulo:notif.titulo,mensagem:notif.mensagem,canal:'push'})
              setNotif({titulo:'',mensagem:''}); alert('Notificacao salva!')
            }}>SALVAR NOTIFICACAO</button>
          </div>
        )}

      </div>

      {/* MODAL INSCREVER */}
      {modalUser && (
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)fecharModal()}}>
          <div style={s.modal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:2,color:"#6b8a62",marginBottom:4}}>INSCREVENDO SELEÇÕES PARA</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700,color:"#dff0d8"}}>{modalUser.nome}</div>
              </div>
              <button style={{background:"none",border:"none",color:"#6b8a62",fontSize:22,cursor:"pointer"}} onClick={fecharModal}>✕</button>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#6b8a62",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Selecionadas ({modalPicks.length}/3)</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",minHeight:36}}>
                {modalPicks.length===0 ? <span style={{fontSize:13,color:"rgba(255,255,255,.2)"}}>Nenhuma seleção escolhida ainda</span> :
                  modalPicks.map(t => <span key={t.id} onClick={()=>toggleModalPick(t)} style={{background:"rgba(0,200,83,.15)",border:"1px solid rgba(0,200,83,.4)",borderRadius:20,padding:"4px 12px",fontSize:13,color:"#00C853",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>{t.nome} <span style={{opacity:.6,fontSize:11}}>✕</span></span>)}
              </div>
            </div>
            <input style={{...s.input,width:"100%",marginBottom:12,boxSizing:"border-box"}} placeholder="Buscar seleção..." value={teamSearch} onChange={e=>{setTeamSearch(e.target.value);setPickError('')}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:280,overflowY:"auto",marginBottom:16}}>
              {teamsFiltered.map(t => {
                const selecionado = !!modalPicks.find(p=>p.id===t.id)
                const desabilitado = !selecionado && modalPicks.length>=3
                return (
                  <div key={t.id} onClick={()=>!desabilitado&&toggleModalPick(t)}
                    style={{background:selecionado?"rgba(0,200,83,.15)":"rgba(255,255,255,.04)",border:`1.5px solid ${selecionado?"rgba(0,200,83,.5)":"rgba(255,255,255,.08)"}`,borderRadius:10,padding:"10px 14px",cursor:desabilitado?"not-allowed":"pointer",opacity:desabilitado?0.4:1,display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all .15s"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:selecionado?"#00C853":"#dff0d8"}}>{t.nome}</div>
                      {t.grupo && <div style={{fontSize:11,color:"#6b8a62"}}>Grupo {t.grupo}</div>}
                    </div>
                    {selecionado && <span style={{color:"#00C853",fontSize:16}}>✓</span>}
                  </div>
                )
              })}
            </div>
            {pickError && <div style={{color:"#ff7070",fontSize:13,marginBottom:12}}>{pickError}</div>}
            <div style={{display:"flex",gap:10}}>
              <button style={{...s.btnOut,flex:1}} onClick={fecharModal}>CANCELAR</button>
              <button style={{...s.btn,flex:2,opacity:modalPicks.length!==3?0.5:1}} onClick={salvarPicksAdmin} disabled={savingPicks||modalPicks.length!==3}>
                {savingPicks?'SALVANDO...':`CONFIRMAR ${modalPicks.length===3?'✓':`(${modalPicks.length}/3)`}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}