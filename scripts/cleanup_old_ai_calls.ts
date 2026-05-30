import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('Cleaning up old AI calls stuck in In Progress/Completed placeholder state...')
  
  // Find activities that match the placeholder pattern
  const { data, error } = await supabase
    .from('activities')
    .select('id, summary, description, status')
    .eq('type', 'Call')
    .ilike('summary', '%AI Arama başlatıldı%')
    
  if (error) {
    console.error('Error fetching activities:', error)
    return
  }

  console.log(`Found ${data.length} AI call activities. Checking for placeholders...`)

  let count = 0
  for (const act of data) {
    // Check if it lacks transcript (meaning it's just a placeholder)
    if (!act.description?.includes('📝 Transkript:')) {
      const { error: updateErr } = await supabase
        .from('activities')
        .update({
          status: 'Completed',
          summary: act.summary.replace('Arama başlatıldı', 'Cevapsız/Eski Arama'),
          description: act.description + '\n\n[Sistem: Bu çağrı geçmişten kaldığı için otomatik olarak tamamlandı işaretlenmiştir.]'
        })
        .eq('id', act.id)
        
      if (updateErr) {
        console.error(`Failed to update ${act.id}:`, updateErr)
      } else {
        console.log(`Updated ${act.id} -> Completed`)
        count++
      }
    }
  }

  console.log(`\nCleanup complete! ${count} old activities marked as Completed.`)
}

cleanup()
