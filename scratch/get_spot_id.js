import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function getSpot() {
  const { data, error } = await supabase.from('parking_spots').select('id').limit(1).single()
  if (error) console.error(error)
  else console.log('SPOT_ID:', data.id)
}

getSpot()
