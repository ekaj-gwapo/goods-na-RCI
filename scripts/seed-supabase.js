const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: Using Anon Key. Seeding might fail if RLS is enabled without policies.')
  console.warn('To fix this, add SUPABASE_SERVICE_ROLE_KEY to your .env file.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Seeding Supabase database...')

  // Demo users
  const demoUsers = [
    {
      email: 'entry@demo.com',
      password: await bcrypt.hash('Demo123456!', 10),
      role: 'entry_user',
    },
    {
      email: 'viewer@demo.com',
      password: await bcrypt.hash('Demo123456!', 10),
      role: 'viewer_user',
    }
  ]

  for (const user of demoUsers) {
    const { data, error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'email' })
      .select()
      .single()

    if (error) {
      console.error(`Error seeding user ${user.email}:`, error.message)
    } else {
      console.log(`Seeded user: ${user.email} (ID: ${data.id})`)
    }
  }

  console.log('\nSupabase seeding complete!')
  console.log('Note: Assignments and Transactions can now be added via the UI.')
}

main().catch(console.error)
