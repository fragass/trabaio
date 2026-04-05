
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Home() {
  const [topics, setTopics] = useState([])

  useEffect(() => {
    fetchTopics()
  }, [])

  async function fetchTopics() {
    const { data } = await supabase.from('topics').select('*')
    setTopics(data || [])
  }

  return (
    <div>
      <h1>Forum</h1>
      {topics.map(t => (
        <div key={t.id}>
          <a href={`/topic/${t.id}`}>{t.title}</a>
        </div>
      ))}
    </div>
  )
}
