
import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function login() {
    await supabase.auth.signInWithPassword({ email, password })
    location.href="/"
  }

  return (
    <div>
      <input placeholder="email" onChange={e=>setEmail(e.target.value)} />
      <input type="password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  )
}
