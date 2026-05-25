import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing    from './pages/Landing'
import Inscricao  from './pages/Inscricao'
import Dashboard  from './pages/Dashboard'
import Ranking    from './pages/Ranking'
import Admin     from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing/>}/>
        <Route path="/inscricao"  element={<Inscricao/>}/>
        <Route path="/dashboard"  element={<Dashboard/>}/>
        <Route path="/ranking"    element={<Ranking/>}/>
        <Route path="/admin"      element={<Admin/>}/>
        <Route path="*"           element={<Navigate to="/"/>}/>
      </Routes>
    </BrowserRouter>
  )
}