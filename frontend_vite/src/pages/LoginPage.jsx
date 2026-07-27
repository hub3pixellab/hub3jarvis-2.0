import React, { useState } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default function LoginPage() {
  const [email, setEmail] = useState('admin@jarvis.ai')
  const [password, setPassword] = useState('admin123')
  const [msg, setMsg] = useState('')

  const login = async () => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('hub3_token', data.token)
      window.location.href = '/dashboard'
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Erro ao logar')
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:16}}>
      <h1 style={{fontSize:32,color:'#7c3aed'}}>Jarvis AI</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={s} />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Senha" style={s} />
      <button onClick={login} style={{...s,background:'#7c3aed',color:'#fff',border:'none',cursor:'pointer',fontWeight:600}}>Entrar</button>
      {msg && <p style={{color:'#ef4444'}}>{msg}</p>}
    </div>
  )
}
const s = {width:300,padding:12,borderRadius:8,border:'1px solid #333',background:'#1a1a2e',color:'#e0e0e0',fontSize:16}
