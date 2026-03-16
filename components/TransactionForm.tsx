'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from '@/components/DatePicker'
import { AlertCircle } from 'lucide-react'

type TransactionFormProps = {
  userId: string;
  onSuccess?: () => void
}

export default function TransactionForm({ userId, onSuccess }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCustomBank, setIsCustomBank] = useState(false)
  const [formData, setFormData] = useState({
    bank_name: '',
    payee: '',
    address: '',
    dv_number: '',
    particulars: '',
    amount: '',
    date: '',
    check_number: '',
    control_number: '',
    account_code: '',
    debit: '',
    credit: '',
    remarks: '',
    fund: '',
    moph_location: '',
    responsibility_center: '',
  })
  
  const standardBanks = [
    'DBP',
    'BDO',
    'BPI',
    'Metrobank',
  ]

  const fundOptions = [
    'General Fund',
    'Development Fund',
    'Trust Fund',
    'Hospital Fund',
  ]

  const mophOptions = [
    'Initao',
    'Balingasag',
    'Gingoog',
    'Manticao',
    'Talisayan',
    'Claveria',
    'Magsaysay',
    'Alubijid',
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!userId) throw new Error('User not authenticated')

      // Use MOPH location if selected, otherwise use fund
      const selectedFund = formData.moph_location || formData.fund

      if (!selectedFund) throw new Error('Please select either a Fund or MOPH location')
      if (!formData.check_number.trim()) throw new Error('Check number is required')

      const payload = JSON.stringify({
        bankName: formData.bank_name,
        payee: formData.payee,
        address: formData.address,
        dvNumber: formData.dv_number,
        particulars: formData.particulars,
        amount: parseFloat(formData.amount),
        date: formData.date,
        checkNumber: formData.check_number,
        controlNumber: formData.control_number,
        accountCode: formData.account_code,
        debit: parseFloat(formData.debit || '0'),
        credit: parseFloat(formData.credit || '0'),
        remarks: formData.remarks,
        fund: selectedFund,
        responsibilityCenter: formData.responsibility_center,
      })

      const response = await fetch(`/api/transactions?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create transaction')
      }

      setFormData({
        bank_name: '',
        payee: '',
        address: '',
        dv_number: '',
        particulars: '',
        amount: '',
        date: '',
        check_number: '',
        control_number: '',
        account_code: '',
        debit: '',
        credit: '',
        remarks: '',
        fund: '',
        moph_location: '',
        responsibility_center: '',
      })

      onSuccess?.()
      toast.success('Transaction created successfully!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bank_name">Bank Name *</Label>
          {!isCustomBank ? (
            <Select 
              value={(formData.bank_name === 'Landbank - 43' || formData.bank_name === 'Landbank - 45' || standardBanks.includes(formData.bank_name)) ? formData.bank_name : (formData.bank_name ? 'custom_prefill' : '')} 
              onValueChange={(val) => {
                if (val === 'add_new') {
                  setIsCustomBank(true)
                  setFormData(prev => ({ ...prev, bank_name: '' }))
                } else if (val === 'custom_prefill') {
                  // Do nothing, just a display placeholder if preexisting data doesn't match
                } else {
                  setFormData(prev => {
                    const updates = { ...prev, bank_name: val }
                    if (val === 'Landbank - 43' && !prev.check_number) updates.check_number = '43'
                    if (val === 'Landbank - 45' && !prev.check_number) updates.check_number = '45'
                    return updates
                  })
                }
              }}
            >
              <SelectTrigger id="bank_name" className="w-full bg-background" aria-required="true">
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
                {formData.bank_name && formData.bank_name !== 'Landbank - 43' && formData.bank_name !== 'Landbank - 45' && !standardBanks.includes(formData.bank_name) && (
                   <SelectItem value="custom_prefill" className="hidden">{formData.bank_name}</SelectItem>
                )}
                <div className="h-px bg-emerald-100 my-1 mx-2"></div>
                <SelectItem value="add_new" className="text-emerald-600 font-medium cursor-pointer">+ Add New Bank...</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                required
                placeholder="Enter custom bank name"
                className="w-full"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => {
                  setIsCustomBank(false)
                  setFormData(prev => ({ ...prev, bank_name: '' }))
                }}
                className="text-xs text-gray-500 hover:text-emerald-600 self-end px-1"
              >
                Return to dropdown
              </button>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="payee">Payee *</Label>
          <Input
            id="payee"
            name="payee"
            value={formData.payee}
            onChange={handleChange}
            required
            placeholder="Enter payee name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="dv_number">DV Number</Label>
          <Input
            id="dv_number"
            name="dv_number"
            value={formData.dv_number}
            onChange={handleChange}
            placeholder="Enter DV number"
          />
        </div>
        <div>
          <Label htmlFor="check_number">Check No.*</Label>
          <Input
            id="check_number"
            name="check_number"
            value={formData.check_number}
            onChange={handleChange}
            required
            placeholder="Enter check number"
          />
        </div>
        <div>
          <Label htmlFor="control_number">Control Number</Label>
          <Input
            id="control_number"
            name="control_number"
            value={formData.control_number}
            onChange={handleChange}
            placeholder="Enter control number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="particulars">Particulars (Nature of Payment) *</Label>
        <Input
          id="particulars"
          name="particulars"
          value={formData.particulars}
          onChange={handleChange}
          required
          placeholder="Enter nature of payment"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="debit">Debit</Label>
          <Input
            id="debit"
            name="debit"
            type="number"
            step="0.01"
            value={formData.debit}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="credit">Credit</Label>
          <Input
            id="credit"
            name="credit"
            type="number"
            step="0.01"
            value={formData.credit}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <DatePicker
            value={formData.date}
            onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
          />
        </div>
        <div>
          <Label htmlFor="account_code">Account Code *</Label>
          <Input
            id="account_code"
            name="account_code"
            value={formData.account_code}
            onChange={handleChange}
            required
            placeholder="Enter account code"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fund">Fund</Label>
          <Select
            disabled={formData.moph_location !== ''}
            value={formData.fund}
            onValueChange={(val) => setFormData(prev => ({ ...prev, fund: val === 'none' ? '' : val }))}
          >
            <SelectTrigger id="fund" className="w-full bg-background mt-2">
              <SelectValue placeholder="-- Select a Fund --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-gray-500 italic">-- Select a Fund --</SelectItem>
              {fundOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="moph_location">MOPH Location</Label>
          <Select
            disabled={formData.fund !== ''}
            value={formData.moph_location}
            onValueChange={(val) => setFormData(prev => ({ ...prev, moph_location: val === 'none' ? '' : val }))}
          >
            <SelectTrigger id="moph_location" className="w-full bg-background mt-2">
              <SelectValue placeholder="-- Select MOPH Location --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-gray-500 italic">-- Select MOPH Location --</SelectItem>
              {mophOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="remarks">Remarks</Label>
        <textarea
          id="remarks"
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          placeholder="Enter any additional remarks"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div>
        <Label htmlFor="responsibility_center">Responsibility Center</Label>
        <Input
          id="responsibility_center"
          name="responsibility_center"
          value={formData.responsibility_center}
          onChange={handleChange}
          placeholder="Enter responsibility center"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isLoading ? 'Submitting...' : 'Submit Transaction'}
        </Button>
      </div>
    </form>
  )
}
