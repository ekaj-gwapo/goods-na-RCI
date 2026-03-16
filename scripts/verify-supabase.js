const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
  console.log('Verifying Supabase connection and tables...')
  
  const tables = ['users', 'transactions', 'viewer_access', 'transaction_batches', 'batch_transactions']
  const results = []

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .limit(0)

    if (error) {
      results.push({ table, status: '❌ Error', message: error.message })
    } else {
      results.push({ table, status: '✅ OK' })
    }
  }

  console.table(results)
  
  const failed = results.filter(r => r.status.includes('❌'))
  if (failed.length > 0) {
    console.log('\nSome tables are missing or inaccessible. Make sure you ran the SQL migration script in the Supabase Dashboard.')
  } else {
    console.log('\nAll tables verified successfully!')
  }
}

verify().catch(console.error)
