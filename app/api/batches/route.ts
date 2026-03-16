import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// GET all batches for a viewer
export async function GET(request: NextRequest) {
  try {
    const viewerId = request.nextUrl.searchParams.get('viewerId')

    if (!viewerId) {
      return NextResponse.json(
        { error: 'Viewer ID required' },
        { status: 400 }
      )
    }

    const { data: batches, error } = await supabaseAdmin
      .from('transaction_batches')
      .select('*')
      .eq('viewer_id', viewerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Map snake_case to camelCase
    const mappedBatches = batches.map((batch: any) => ({
      ...batch,
      viewerId: batch.viewer_id,
      entryUserId: batch.entry_user_id,
      batchName: batch.batch_name,
      transactionCount: batch.transaction_count,
      totalAmount: batch.total_amount,
      appliedFilters: batch.applied_filters,
      createdAt: batch.created_at,
    }))

    return NextResponse.json(mappedBatches)
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    )
  }
}

// POST create a new batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      viewerId,
      entryUserId,
      transactions,
      appliedFilters,
    } = body

    if (!viewerId || !entryUserId || !transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const totalAmount = transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0)
    
    // Get the count of batches for this viewer to generate sequential number
    const { count, error: countError } = await supabaseAdmin
      .from('transaction_batches')
      .select('*', { count: 'exact', head: true })
      .eq('viewer_id', viewerId)

    if (countError) throw countError

    const sequentialNumber = String((count || 0) + 1).padStart(2, '0')
    const batchName = `Batch ${sequentialNumber}`

    // Create batch record
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('transaction_batches')
      .insert([
        {
          viewer_id: viewerId,
          entry_user_id: entryUserId,
          batch_name: batchName,
          transaction_count: transactions.length,
          total_amount: totalAmount,
          applied_filters: appliedFilters || {},
        }
      ])
      .select()
      .single()

    if (batchError) throw batchError

    // Create batch transaction records and delete from main transactions table
    for (const tx of transactions) {
      const { error: btError } = await supabaseAdmin
        .from('batch_transactions')
        .insert([
          {
            batch_id: batch.id,
            transaction_id: tx.id,
            transaction_data: tx,
          }
        ])

      if (btError) throw btError

      // Delete the transaction from main transactions table
      const { error: deleteError } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('id', tx.id)

      if (deleteError) throw deleteError
    }

    // Map back to camelCase
    const mappedBatch = {
      ...batch,
      viewerId: batch.viewer_id,
      entryUserId: batch.entry_user_id,
      batchName: batch.batch_name,
      transactionCount: batch.transaction_count,
      totalAmount: batch.total_amount,
      appliedFilters: batch.applied_filters,
      createdAt: batch.created_at,
    }

    return NextResponse.json(mappedBatch, { status: 201 })
  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    )
  }
}
