
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function Topic() {
  const router = useRouter()
  const { id } = router.query
  const [topic, setTopic] = useState(null)
  const [replies, setReplies] = useState([])

  useEffect(() => {
    if (id) load()
  }, [id])

  async function load() {
    const { data } = await supabase.from('topics').select('*').eq('id', id).single()
    setTopic(data)

    const { data: reps } = await supabase.from('replies').select('*').eq('topic_id', id)
    setReplies(reps || [])
  }

  return (
    <div>
      {topic && <h1>{topic.title}</h1>}
      {replies.map(r => (
        <div key={r.id}>{r.content}</div>
      ))}
    </div>
  )
}
