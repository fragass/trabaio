
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Home() {
  const [categories, setCategories] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('categories').select('*')
    setCategories(data || [])
  }

  return (
    <div>
      <h1>Forum</h1>
      {categories.map(c => (
        <div key={c.id}>
          <a href={`/category/${c.id}`}>{c.name}</a>
        </div>
      ))}
    </div>
  )
}
