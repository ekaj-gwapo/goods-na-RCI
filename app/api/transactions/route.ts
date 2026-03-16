import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET transactions for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Map snake_case to camelCase for frontend compatibility
    const mappedTransactions = transactions.map((tx: any) => ({
      ...tx,
      userId: tx.user_id,
      bankName: tx.bank_name,
      dvNumber: tx.dv_number,
      checkNumber: tx.check_number,
      controlNumber: tx.control_number,
      accountCode: tx.account_code,
      responsibilityCenter: tx.responsibility_center,
      createdAt: tx.created_at,
    }))

    return NextResponse.json(mappedTransactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST new transaction
export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.bankName || body.bankName.trim() === '') {
      return NextResponse.json({ error: 'Bank Name is required' }, { status: 400 })
    }
    if (!body.payee || body.payee.trim() === '') {
      return NextResponse.json({ error: 'Payee is required' }, { status: 400 })
    }
    if (!body.particulars || body.particulars.trim() === '') {
      return NextResponse.json({ error: 'Particulars is required' }, { status: 400 })
    }
    if (!body.checkNumber || body.checkNumber.trim() === '') {
      return NextResponse.json({ error: 'Check Number is required' }, { status: 400 })
    }
    if (!body.amount || isNaN(parseFloat(body.amount))) {
      return NextResponse.json({ error: 'Amount is required and must be a valid number' }, { status: 400 })
    }
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    if (!body.accountCode || body.accountCode.trim() === '') {
      return NextResponse.json({ error: 'Account Code is required' }, { status: 400 })
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          bank_name: body.bankName.trim(),
          payee: body.payee.trim(),
          address: body.address ? body.address.trim() : '',
          dv_number: body.dvNumber ? body.dvNumber.trim() : '',
          particulars: body.particulars.trim(),
          amount: parseFloat(body.amount),
          date: body.date,
          check_number: body.checkNumber ? body.checkNumber.trim() : '',
          control_number: body.controlNumber ? body.controlNumber.trim() : '',
          account_code: body.accountCode.trim(),
          debit: parseFloat(body.debit || 0),
          credit: parseFloat(body.credit || 0),
          remarks: body.remarks ? body.remarks.trim() : '',
          fund: body.fund ? body.fund.trim() : 'General Fund',
          responsibility_center: body.responsibilityCenter ? body.responsibilityCenter.trim() : '',
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Map back to camelCase
    const mappedTx = {
      ...transaction,
      userId: transaction.user_id,
      bankName: transaction.bank_name,
      dvNumber: transaction.dv_number,
      checkNumber: transaction.check_number,
      controlNumber: transaction.control_number,
      accountCode: transaction.account_code,
      responsibilityCenter: transaction.responsibility_center,
      createdAt: transaction.created_at,
    }

    return NextResponse.json(mappedTx, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

// PUT update transaction
export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.bankName || body.bankName.trim() === '') {
      return NextResponse.json({ error: 'Bank Name is required' }, { status: 400 })
    }
    if (!body.payee || body.payee.trim() === '') {
      return NextResponse.json({ error: 'Payee is required' }, { status: 400 })
    }
    if (!body.particulars || body.particulars.trim() === '') {
      return NextResponse.json({ error: 'Particulars is required' }, { status: 400 })
    }
    if (!body.checkNumber || body.checkNumber.trim() === '') {
      return NextResponse.json({ error: 'Check Number is required' }, { status: 400 })
    }
    if (!body.amount || isNaN(parseFloat(body.amount))) {
      return NextResponse.json({ error: 'Amount is required and must be a valid number' }, { status: 400 })
    }
    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    if (!body.accountCode || body.accountCode.trim() === '') {
      return NextResponse.json({ error: 'Account Code is required' }, { status: 400 })
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({
        bank_name: body.bankName.trim(),
        payee: body.payee.trim(),
        address: body.address ? body.address.trim() : '',
        dv_number: body.dvNumber ? body.dvNumber.trim() : '',
        particulars: body.particulars.trim(),
        amount: parseFloat(body.amount),
        date: body.date,
        check_number: body.checkNumber ? body.checkNumber.trim() : '',
        control_number: body.controlNumber ? body.controlNumber.trim() : '',
        account_code: body.accountCode.trim(),
        debit: parseFloat(body.debit || 0),
        credit: parseFloat(body.credit || 0),
        remarks: body.remarks ? body.remarks.trim() : '',
        fund: body.fund ? body.fund.trim() : 'General Fund',
        responsibility_center: body.responsibilityCenter ? body.responsibilityCenter.trim() : '',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Map back to camelCase
    const mappedTx = {
      ...transaction,
      userId: transaction.user_id,
      bankName: transaction.bank_name,
      dvNumber: transaction.dv_number,
      checkNumber: transaction.check_number,
      controlNumber: transaction.control_number,
      accountCode: transaction.account_code,
      responsibilityCenter: transaction.responsibility_center,
      createdAt: transaction.created_at,
    }

    return NextResponse.json(mappedTx)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

// DELETE transaction
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
