
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function Category() {
  const { id } = useRouter().query
  const [topics, setTopics] = useState([])

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    const { data } = await supabase.from('topics').select('*').eq('category_id', id)
    setTopics(data || [])
  }

  return (
    <div>
      <h2>Topics</h2>
      {topics.map(t => (
        <div key={t.id}>
          <a href={`/topic/${t.id}`}>{t.title}</a>
        </div>
      ))}
    </div>
  )
}
