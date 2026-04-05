
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function Topic() {
  const { id } = useRouter().query
  const [topic, setTopic] = useState(null)
  const [replies, setReplies] = useState([])
  const [text, setText] = useState("")

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    const { data } = await supabase.from('topics').select('*').eq('id', id).single()
    setTopic(data)

    const { data: reps } = await supabase.from('replies').select('*').eq('topic_id', id)
    setReplies(reps || [])
  }

  async function sendReply() {
    await supabase.from('replies').insert({ topic_id: id, content: text })
    setText("")
    load()
  }

  return (
    <div>
      {topic && <h1>{topic.title}</h1>}
      <p>{topic?.content}</p>

      {replies.map(r => (
        <div key={r.id}>{r.content}</div>
      ))}

      <textarea value={text} onChange={e=>setText(e.target.value)} />
      <button onClick={sendReply}>Reply</button>
    </div>
  )
}
