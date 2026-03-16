'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { X, ArrowUpDown, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Transaction = {
  id: string
  bankName: string
  payee: string
  address: string
  dvNumber: string
  particulars: string
  amount: number
  date: string
  checkNumber?: string
  controlNumber: string
  accountCode: string
  debit: number
  credit: number
  remarks: string
  createdAt: string
  fund: string
  responsibilityCenter?: string
}

type TransactionTableProps = {
  transactions: Transaction[]
  onTransactionDeleted?: () => void
  onTransactionUpdated?: () => void
}

type SortField = 'date' | 'checkNumber' | 'dvNumber' | 'accountCode' | 'payee' | 'particulars' | 'amount' | 'remarks' | 'bankName' | 'controlNumber' | 'fund'

export default function TransactionTable({ transactions, onTransactionDeleted, onTransactionUpdated }: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Transaction> | null>(null)
  const [isCustomBank, setIsCustomBank] = useState(false)

  const standardBanks = [
    'DBP',
    'BDO',
    'BPI',
    'Metrobank',
  ]

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      // For date sorting, only consider Month and Year (ignore day)
      if (sortField === 'date') {
        const dateA = new Date(aVal as string)
        const dateB = new Date(bVal as string)
        
        // Zero out the day and time to only compare YYYY-MM
        const monthYearA = new Date(dateA.getFullYear(), dateA.getMonth(), 1).getTime()
        const monthYearB = new Date(dateB.getFullYear(), dateB.getMonth(), 1).getTime()
        
        return sortDirection === 'asc' ? monthYearA - monthYearB : monthYearB - monthYearA
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string)
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
    return sorted
  }, [transactions, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleEditStart = () => {
    if (selectedTransaction) {
      setEditFormData({ ...selectedTransaction })
      setIsEditing(true)
      setIsCustomBank(false)
    }
  }

  const handleEditChange = (field: keyof Transaction, value: any) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleEditSave = async () => {
    if (!editFormData || !selectedTransaction) return

    setIsEditing(false)
    try {
      const response = await fetch(`/api/transactions?id=${selectedTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update transaction')
      }

      const updatedTx = await response.json()
      setSelectedTransaction(updatedTx)
      setEditFormData(null)
      onTransactionUpdated?.()
      toast.success('Transaction updated successfully!')
    } catch (error) {
      console.error('Error updating transaction:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Update failed: ${msg}`)
    }
  }

  const handleDelete = async () => {
    if (!selectedTransaction) return

    if (!confirm('Are you sure you want to delete this transaction?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/transactions?id=${selectedTransaction.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete transaction')
      }

      setSelectedTransaction(null)
      setIsEditing(false)
      onTransactionDeleted?.()
      toast.success('Transaction deleted successfully!')
    } catch (error) {
      console.error('Error deleting transaction:', error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Delete failed: ${msg}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const SortableHeader = ({ label, field }: { label: string; field: SortField }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-6 py-3 text-left text-sm font-semibold text-emerald-900 cursor-pointer hover:bg-emerald-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && <ArrowUpDown className="w-4 h-4" />}
      </div>
    </th>
  )

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-emerald-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">No transactions yet. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Table */}
      <div className="flex-1 bg-white border border-emerald-100 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-y-auto max-h-[600px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-emerald-100 bg-emerald-100 sticky top-0">
                <SortableHeader label="Date" field="date" />
                <SortableHeader label="Check No." field="checkNumber" />
                <SortableHeader label="DV #" field="dvNumber" />
                <SortableHeader label="Control No." field="controlNumber" />
                <SortableHeader label="Account Code" field="accountCode" />
                <th className="px-6 py-3 text-sm font-semibold text-emerald-900">Responsibility Center</th>
                <SortableHeader label="Payee" field="payee" />
                <SortableHeader label="Particulars" field="particulars" />
                <th className="px-6 py-3 text-right text-sm font-semibold text-emerald-900 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-2 justify-end">
                    Amount
                    {sortField === 'amount' && <ArrowUpDown className="w-4 h-4" />}
                  </div>
                </th>
                <SortableHeader label="Remarks" field="remarks" />
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className={`border-b border-emerald-100 cursor-pointer transition-colors ${
                    selectedTransaction?.id === tx.id
                      ? 'bg-emerald-100'
                      : idx % 2 === 0
                        ? 'bg-white hover:bg-emerald-50'
                        : 'bg-[#f9f6f0] hover:bg-emerald-50'
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-gray-900">{new Date(tx.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{tx.checkNumber || '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{tx.dvNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{tx.controlNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{tx.accountCode}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{tx.responsibilityCenter || '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 whitespace-nowrap">{tx.payee}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">{tx.particulars}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-900 font-medium">
                    {idx === 0 ? '₱ ' : ''}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">{tx.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Panel */}
      {selectedTransaction && (
        <div className="w-96 bg-white border border-emerald-100 rounded-lg p-6 h-[600px] overflow-y-auto flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Transaction' : 'Transaction Details'}
            </h3>
            <button
              onClick={() => {
                setSelectedTransaction(null)
                setIsEditing(false)
                setEditFormData(null)
                setIsCustomBank(false)
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {isEditing && editFormData ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Date</label>
                  <input
                    type="date"
                    value={editFormData.date || ''}
                    onChange={(e) => handleEditChange('date', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Bank Name</label>
                  {!isCustomBank ? (
                    <Select 
                      value={(editFormData.bankName === 'Landbank - 43' || editFormData.bankName === 'Landbank - 45' || standardBanks.includes(editFormData.bankName as string)) ? editFormData.bankName as string : (editFormData.bankName ? 'custom_prefill' : '')} 
                      onValueChange={(val) => {
                        if (val === 'add_new') {
                          setIsCustomBank(true)
                          handleEditChange('bankName', '')
                        } else if (val === 'custom_prefill') {
                          // Do nothing
                        } else {
                          handleEditChange('bankName', val)
                          if (val === 'Landbank - 43' && !(editFormData as any).checkNumber) {
                            handleEditChange('checkNumber' as any, '43')
                          }
                          if (val === 'Landbank - 45' && !(editFormData as any).checkNumber) {
                            handleEditChange('checkNumber' as any, '45')
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-sm bg-white">
                        <SelectValue placeholder="Select a bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="font-bold text-emerald-800">Landbank of the Philippines</SelectLabel>
                          <SelectItem value="Landbank - 43" className="pl-6">Landbank - 43</SelectItem>
                          <SelectItem value="Landbank - 45" className="pl-6">Landbank - 45</SelectItem>
                        </SelectGroup>
                        <div className="h-px bg-emerald-100 my-1 mx-2"></div>
                        <SelectGroup>
                          {standardBanks.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectGroup>
                        {editFormData.bankName && editFormData.bankName !== 'Landbank - 43' && editFormData.bankName !== 'Landbank - 45' && !standardBanks.includes(editFormData.bankName as string) && (
                           <SelectItem value="custom_prefill" className="hidden">{editFormData.bankName}</SelectItem>
                        )}
                        <div className="h-px bg-emerald-100 my-1 mx-2"></div>
                        <SelectItem value="add_new" className="text-emerald-600 font-medium cursor-pointer">+ Add New Bank...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1">
                      <input
                        type="text"
                        value={editFormData.bankName || ''}
                        onChange={(e) => handleEditChange('bankName', e.target.value)}
                        placeholder="Enter custom bank name"
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsCustomBank(false)
                          handleEditChange('bankName', '')
                        }}
                        className="text-xs text-gray-500 hover:text-emerald-600 self-end"
                      >
                        Return to dropdown
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Payee</label>
                  <input
                    type="text"
                    value={editFormData.payee || ''}
                    onChange={(e) => handleEditChange('payee', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">DV Number</label>
                  <input
                    type="text"
                    value={editFormData.dvNumber || ''}
                    onChange={(e) => handleEditChange('dvNumber', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Check Number</label>
                  <input
                    type="text"
                    value={(editFormData as any).checkNumber || ''}
                    onChange={(e) => handleEditChange('checkNumber' as any, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Control Number</label>
                  <input
                    type="text"
                    value={editFormData.controlNumber || ''}
                    onChange={(e) => handleEditChange('controlNumber', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Particulars</label>
                  <input
                    type="text"
                    value={editFormData.particulars || ''}
                    onChange={(e) => handleEditChange('particulars', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase mb-1 block">Fund</label>
                  <Select
                    value={editFormData.fund || 'General Fund'}
                    onValueChange={(val) => handleEditChange('fund', val)}
                  >
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue placeholder="Select Fund" />
                    </SelectTrigger>
                    <SelectContent>
                      {['General Fund', 'Development Fund', 'Trust Fund', 'Hospital Fund', 'MOPH'].map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.amount || ''}
                    onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-emerald-600 uppercase">Debit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.debit || ''}
                      onChange={(e) => handleEditChange('debit', parseFloat(e.target.value))}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-600 uppercase">Credit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.credit || ''}
                      onChange={(e) => handleEditChange('credit', parseFloat(e.target.value))}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Account Code</label>
                  <input
                    type="text"
                    value={editFormData.accountCode || ''}
                    onChange={(e) => handleEditChange('accountCode', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Responsibility Center</label>
                  <input
                    type="text"
                    value={(editFormData as any).responsibilityCenter || ''}
                    onChange={(e) => handleEditChange('responsibilityCenter' as any, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedTransaction.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Bank Name</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.bankName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Payee</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.payee}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Address</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.address}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">DV Number</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.dvNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Check Number</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.checkNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Control Number</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.controlNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Particulars</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.particulars}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Fund</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.fund}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Amount</label>
                  <p className="text-sm text-gray-900 font-medium">₱ {selectedTransaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-emerald-600 uppercase">Debit</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.debit > 0 ? `₱ ${selectedTransaction.debit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-600 uppercase">Credit</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.credit > 0 ? `₱ ${selectedTransaction.credit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Account Code</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.accountCode}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Responsibility Center</label>
                  <p className="text-sm text-gray-900">{(selectedTransaction as any).responsibilityCenter || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Remarks</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.remarks || '-'}</p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-emerald-100 pt-4 mt-4 flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleEditSave}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setEditFormData(null)
                  }}
                  variant="outline"
                  className="flex-1 text-gray-600 border-gray-300 text-sm"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleEditStart}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Update
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
