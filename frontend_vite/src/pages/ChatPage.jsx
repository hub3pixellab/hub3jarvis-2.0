import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(c => { const t = localStorage.getItem('hub3_token'); if(t) c.headers.Authorization = `Bearer ${t}`; return c })

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [convId, setConvId] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    setMessages(m => [...m, {role:'user',text}])
    setMessages(m => [...m, {role:'assistant',text:'...'}]);

    (async () => {
      try {
        const { data } = await api.post('/chat/send', { text, conversation_id: convId })
        setConvId(data.conversation_id)
        setMessages(m => m.slice(0,-1).concat({role:'assistant',text:data.reply}))
      } catch {
        setMessages(m => m.slice(0,-1).concat({role:'assistant',text:'Erro ao responder'}))
      }
    })()
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',maxWidth:800,margin:'0 auto'}}>
      <div style={{padding:16,borderBottom:'1px solid #333',display:'flex',justifyContent:'space-between'}}>
        <h2 style={{color:'#7c3aed'}}>Jarvis Chat</h2>
        <a href="/dashboard" style={{color:'#7c3aed'}}>Dashboard</a>
      </div>
      <div style={{flex:1,overflow:'auto',padding:16,display:'flex',flexDirection:'column',gap:12}}>
        {messages.map((m,i) => (
          <div key={i} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'80%',padding:'10px 16px',borderRadius:12,background:m.role==='user'?'#7c3aed':'#1a1a2e',border:'1px solid #333'}}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{padding:16,borderTop:'1px solid #333',display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Digite sua mensagem..." style={{flex:1,padding:12,borderRadius:8,border:'1px solid #333',background:'#1a1a2e',color:'#e0e0e0',fontSize:16}} />
        <button onClick={send} style={{padding:'12px 24px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>Enviar</button>
      </div>
    </div>
  )
}
