import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET batch details with transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    // Get batch metadata
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('transaction_batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Get batch transactions
    const { data: batchTransactions, error: btError } = await supabaseAdmin
      .from('batch_transactions')
      .select('id, transaction_id, transaction_data, created_at')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false })

    if (btError) throw btError

    // Parse transaction data
    const transactions = batchTransactions.map((bt: any) => ({
      ...(typeof bt.transaction_data === 'string' ? JSON.parse(bt.transaction_data) : bt.transaction_data),
      batchTransactionId: bt.id,
    }))

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching batch details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch details' },
      { status: 500 }
    )
  }
}

// POST restore transactions from batch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const body = await request.json()

    const { transactionIds } = body

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'No transaction IDs provided' },
        { status: 400 }
      )
    }

    // Get the batch transactions data
    const { data: batchTxs, error: fetchError } = await supabaseAdmin
      .from('batch_transactions')
      .select('id, transaction_data')
      .eq('batch_id', batchId)
      .in('id', transactionIds)

    if (fetchError || !batchTxs || batchTxs.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in batch' },
        { status: 404 }
      )
    }

    const restoredTransactions = []
    const batchTxIds = []
    const failedTransactions = []

    for (const batchTx of batchTxs) {
      const txData = typeof batchTx.transaction_data === 'string' ? JSON.parse(batchTx.transaction_data) : batchTx.transaction_data

      try {
        // Delete first to ensure no duplicates (if any)
        await supabaseAdmin.from('transactions').delete().eq('id', txData.id)

        // Then re-insert the transaction with proper snake_case mapping
        const { error: insertError } = await supabaseAdmin
          .from('transactions')
          .insert([
            {
              id: txData.id,
              user_id: txData.userId || txData.user_id,
              bank_name: txData.bankName || txData.bank_name,
              payee: txData.payee,
              address: txData.address,
              dv_number: txData.dvNumber || txData.dv_number,
              particulars: txData.particulars,
              amount: txData.amount,
              date: txData.date,
              check_number: txData.checkNumber || txData.check_number,
              control_number: txData.controlNumber || txData.control_number,
              account_code: txData.accountCode || txData.account_code,
              debit: txData.debit,
              credit: txData.credit,
              remarks: txData.remarks,
              fund: txData.fund,
              responsibility_center: txData.responsibilityCenter || txData.responsibility_center,
              created_at: txData.createdAt || txData.created_at,
            }
          ])

        if (insertError) throw insertError

        restoredTransactions.push(txData)
        batchTxIds.push(batchTx.id)
      } catch (txError: any) {
        console.error(`Error restoring transaction ${txData.id}:`, txError.message)
        failedTransactions.push({ id: txData.id, error: txError.message })
        continue
      }
    }

    if (restoredTransactions.length === 0) {
      return NextResponse.json(
        { 
          error: `Failed to restore transactions.`,
          failedTransactions
        },
        { status: 400 }
      )
    }

    // Remove restored transactions from batch_transactions table
    let batchWasDeleted = false
    
    if (batchTxIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('batch_transactions')
        .delete()
        .in('id', batchTxIds)

      if (deleteError) throw deleteError

      // Update batch count and amount
      const { data: remainingTxs, error: remainingError } = await supabaseAdmin
        .from('batch_transactions')
        .select('transaction_data')
        .eq('batch_id', batchId)

      if (remainingError) throw remainingError

      if (remainingTxs.length === 0) {
        await supabaseAdmin.from('transaction_batches').delete().eq('id', batchId)
        batchWasDeleted = true
      } else {
        const totalAmount = remainingTxs.reduce((sum: number, bt: any) => {
          const data = typeof bt.transaction_data === 'string' ? JSON.parse(bt.transaction_data) : bt.transaction_data
          return sum + (data.amount || 0)
        }, 0)

        await supabaseAdmin
          .from('transaction_batches')
          .update({
            transaction_count: remainingTxs.length,
            total_amount: totalAmount,
          })
          .eq('id', batchId)
      }
    }

    return NextResponse.json({
      success: true,
      restoredCount: restoredTransactions.length,
      transactions: restoredTransactions,
      batchDeleted: batchWasDeleted,
    })
  } catch (error) {
    console.error('Error restoring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to restore transactions' },
      { status: 500 }
    )
  }
}

// DELETE batch completely and restore transactions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params

    // Get ALL transactions in this batch
    const { data: batchTxs, error: fetchError } = await supabaseAdmin
      .from('batch_transactions')
      .select('id, transaction_data')
      .eq('batch_id', batchId)

    if (fetchError) throw fetchError

    if (!batchTxs || batchTxs.length === 0) {
      await supabaseAdmin.from('transaction_batches').delete().eq('id', batchId)
      return NextResponse.json({ success: true, message: 'Empty batch deleted' })
    }

    // Restore transactions back to main transactions table
    for (const batchTx of batchTxs) {
      const txData = typeof batchTx.transaction_data === 'string' ? JSON.parse(batchTx.transaction_data) : batchTx.transaction_data
      try {
        await supabaseAdmin.from('transactions').delete().eq('id', txData.id)
        await supabaseAdmin
          .from('transactions')
          .insert([
            {
              id: txData.id,
              user_id: txData.userId || txData.user_id,
              bank_name: txData.bankName || txData.bank_name,
              payee: txData.payee,
              address: txData.address,
              dv_number: txData.dvNumber || txData.dv_number,
              particulars: txData.particulars,
              amount: txData.amount,
              date: txData.date,
              check_number: txData.checkNumber || txData.check_number,
              control_number: txData.controlNumber || txData.control_number,
              account_code: txData.accountCode || txData.account_code,
              debit: txData.debit,
              credit: txData.credit,
              remarks: txData.remarks,
              fund: txData.fund,
              responsibility_center: txData.responsibilityCenter || txData.responsibility_center,
              created_at: txData.createdAt || txData.created_at,
            }
          ])
      } catch (e: any) {
        console.error('Error restoring transaction', e.message)
      }
    }

    // Delete from transaction_batches (batch_transactions will cascade if FK is set, but we'll do it explicitly if needed)
    // Actually our SQL has ON DELETE CASCADE
    await supabaseAdmin.from('transaction_batches').delete().eq('id', batchId)

    return NextResponse.json({ success: true, message: 'Batch deleted and transactions restored' })
  } catch (error) {
    console.error('Error deleting batch:', error)
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    )
  }
}
