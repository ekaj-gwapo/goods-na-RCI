const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Seeding dummy transactions into Supabase...')

  // 1. Get the entry user ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'entry@demo.com')
    .single()

  if (userError || !userData) {
    console.error('Error: Could not find entry@demo.com user. Please run npm run db:seed first.')
    return
  }

  const userId = userData.id
  console.log(`Found entry user ID: ${userId}`)

  // 2. Define dummy transactions
  const now = new Date()
  const dummyTransactions = [
    {
      user_id: userId,
      bank_name: 'Landbank - 43',
      payee: 'Juan Dela Cruz',
      particulars: 'Payment for office supplies',
      amount: 4500.50,
      date: now.toISOString().split('T')[0],
      check_number: 'CK-001234',
      dv_number: 'DV-2024-001',
      account_code: '50203010',
      fund: 'General Fund',
      responsibility_center: 'Administrative Office'
    },
    {
      user_id: userId,
      bank_name: 'Landbank - 45',
      payee: 'Maria Clara Services',
      particulars: 'Janitorial services for Feb 2024',
      amount: 15600.00,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().split('T')[0],
      check_number: 'CK-001235',
      dv_number: 'DV-2024-002',
      account_code: '50212020',
      fund: 'Development Fund',
      responsibility_center: 'Maintenance Unit'
    },
    {
      user_id: userId,
      bank_name: 'Landbank - 43',
      payee: 'Power Supply Inc.',
      particulars: 'Electricity bill payment',
      amount: 8200.75,
      date: now.toISOString().split('T')[0],
      check_number: 'CK-001236',
      dv_number: 'DV-2024-003',
      account_code: '50204010',
      fund: 'General Fund',
      responsibility_center: 'General Services'
    },
    {
      user_id: userId,
      bank_name: 'Landbank - 45',
      payee: 'St. Peter Medical Supplies',
      particulars: 'Purchase of first aid kits',
      amount: 12400.00,
      date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0],
      check_number: '987654321',
      dv_number: 'DV-2024-004',
      account_code: '50203080',
      fund: 'Hospital Fund',
      responsibility_center: 'Health Center'
    },
    {
      user_id: userId,
      bank_name: 'Landbank - 43',
      payee: 'Local Bookstore',
      particulars: 'Training materials for HR seminar',
      amount: 2150.25,
      date: now.toISOString().split('T')[0],
      check_number: 'CK-001237',
      dv_number: 'DV-2024-005',
      account_code: '50203010',
      fund: 'General Fund',
      responsibility_center: 'Human Resources'
    }
  ]

  // 3. Insert transactions
  const { data, error } = await supabase
    .from('transactions')
    .insert(dummyTransactions)
    .select()

  if (error) {
    console.error('Error seeding transactions:', error.message)
  } else {
    console.log(`Successfully seeded ${data.length} transactions!`)
  }

  console.log('\nSupabase transaction seeding complete!')
}

main().catch(console.error)
