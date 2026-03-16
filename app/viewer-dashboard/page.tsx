'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ViewerTransactionTable from '@/components/ViewerTransactionTable'
import PrintReport from '@/components/PrintReport'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { LogOut, ChevronDown, Settings, Printer, Archive, Search } from 'lucide-react'
import Link from 'next/link'

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
  userId: string
  fund: string
  responsibilityCenter?: string
}

export default function ViewerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [assignedEntryUsers, setAssignedEntryUsers] = useState<any[]>([])
  const [selectedEntryUser, setSelectedEntryUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntryUserEmail, setSelectedEntryUserEmail] = useState<string>('')
  const [bankNames, setBankNames] = useState<string[]>([])
  const [selectedBankName, setSelectedBankName] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedFund, setSelectedFund] = useState<string>('')
  const [selectedPlace, setSelectedPlace] = useState<string>('')
  const [places, setPlaces] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [batchId, setBatchId] = useState<string | null>(null)
  const [isCreatingBatch, setIsCreatingBatch] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fundOptions = [
    'General Fund',
    'Development Fund',
    'Trust Fund',
    'Hospital Fund',

  ]

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        router.push('/auth/login')
        return
      }

      const user = JSON.parse(userStr)
      if (user.role !== 'viewer_user') {
        router.push('/entry-dashboard')
        return
      }

      setUser(user)
      fetchAssignedEntryUsers(user.id)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const fetchAssignedEntryUsers = async (viewerId: string) => {
    try {
      const response = await fetch(`/api/viewer-assignments?viewerId=${viewerId}`)
      if (response.ok) {
        const data = await response.json()
        setAssignedEntryUsers(data)
        if (data.length > 0) {
          setSelectedEntryUser(data[0].entryUserId)
          setSelectedEntryUserEmail(data[0].email || '')
          await fetchTransactions(data[0].entryUserId)
        }
      }
    } catch (error) {
      console.error('Error fetching assigned users:', error)
    }
  }

  const fetchTransactions = async (entryUserId: string) => {
    try {
      const response = await fetch(`/api/transactions?userId=${entryUserId}`)
      if (response.ok) {
        const data = await response.json()
        setAllTransactions(data)
        extractBankNames(data)
        extractPlaces(data)
        applyFilters(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const extractBankNames = (txs: Transaction[]) => {
    const names = Array.from(new Set(txs.map(tx => tx.bankName).filter(Boolean)))
    setBankNames(names.sort())
  }

  const extractPlaces = (txs: Transaction[]) => {
    const regularFunds = ['General Fund', 'Development Fund', 'Trust Fund', 'Hospital Fund']
    const placeList = Array.from(new Set(
      txs
        .map(tx => tx.fund)
        .filter(Boolean)
        .filter(fund => !regularFunds.includes(fund))
    ))
    setPlaces(placeList.sort())
  }

  const applyFilters = (data: Transaction[]) => {
    let filtered = [...data]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(tx =>
        tx.checkNumber?.toLowerCase().includes(q) ||
        tx.dvNumber?.toLowerCase().includes(q) ||
        tx.accountCode?.toLowerCase().includes(q) ||
        tx.responsibilityCenter?.toLowerCase().includes(q) ||
        tx.payee?.toLowerCase().includes(q) ||
        tx.amount?.toString().includes(q)
      )
    }

    if (selectedBankName && selectedBankName !== 'none') {
      filtered = filtered.filter(tx => tx.bankName === selectedBankName)
    }

    if (selectedDate) {
      const filterDate = new Date(selectedDate)
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date)
        return txDate.getMonth() === filterDate.getMonth() && 
               txDate.getFullYear() === filterDate.getFullYear()
      })
    }

    if (selectedFund && selectedFund !== 'none') {
      filtered = filtered.filter(tx => tx.fund === selectedFund)
    }

    if (selectedPlace && selectedPlace !== 'none') {
      filtered = filtered.filter(tx => tx.fund === selectedPlace)
    }

    // Sort by date (newest first) as default
    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setTransactions(sorted)
  }

  useEffect(() => {
    if (allTransactions.length > 0) {
      applyFilters(allTransactions)
    }
  }, [selectedBankName, selectedDate, selectedFund, selectedPlace, searchQuery, allTransactions])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const createBatchAndPrint = async () => {
    if (!user || !selectedEntryUser || transactions.length === 0) {
      toast.error('No transactions to print')
      return
    }

    try {
      setIsCreatingBatch(true)

      // Extract unique banks and funds from transactions
      const uniqueBanks = [...new Set(transactions.map((tx: any) => tx.bankName))].filter(Boolean)
      const uniqueFunds = [...new Set(transactions.map((tx: any) => tx.fund))].filter(Boolean)

      // Create batch
      const batchResponse = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerId: user.id,
          entryUserId: selectedEntryUser,
          transactions: transactions,
          appliedFilters: {
            bankNames: uniqueBanks,
            funds: uniqueFunds,
            date: selectedDate,
          },
        }),
      })

      if (!batchResponse.ok) {
        throw new Error('Failed to create batch')
      }

      const batch = await batchResponse.json()
      setBatchId(batch.id)

      // Show success message
      toast.success(`Batch created successfully! ID: ${batch.id.slice(0, 8)}`)

      // Open print dialog and ONLY refresh state after a delay or dialog close
      setTimeout(async () => {
        window.print()
        
        // Ask the user if the print was successful
        const confirmed = confirm("Did the document print successfully?\n\nClick OK to confirm batch creation.\nClick Cancel to undo this batch and restore the transactions.")
        
        if (confirmed) {
          // Refresh transactions to remove printed ones AFTER printing
          await fetchTransactions(selectedEntryUser)
        } else {
          // Undo batch creation
          try {
            setIsCreatingBatch(true)
            await fetch(`/api/batches/${batch.id}`, { method: 'DELETE' })
            setBatchId(null)
            toast.info("Batch creation undone. Transactions restored.")
          } catch (error) {
            console.error('Error undoing batch:', error)
            toast.error('Failed to undo batch creation.')
          } finally {
            setIsCreatingBatch(false)
            await fetchTransactions(selectedEntryUser)
          }
        }
      }, 500)
    } catch (error) {
      console.error('Error creating batch:', error)
      toast.error('Failed to create batch. Please try again.')
    } finally {
      setIsCreatingBatch(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f6f0] print:bg-white">
      {/* Header - Hidden on Print */}
      <div className="bg-white border-b border-emerald-100 sticky top-0 z-40 print:hidden">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Viewer Dashboard</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Hidden on Print */}
      <div className="w-full px-6 py-8 print:hidden">
        {/* Search Bar */}
        <div className="flex justify-end mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus-visible:ring-emerald-600 bg-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-emerald-100 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <Select value={selectedBankName} onValueChange={setSelectedBankName}>
                <SelectTrigger className="w-full bg-white border-emerald-200 focus:ring-emerald-600">
                  <SelectValue placeholder="All Bank Names" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-gray-500 italic">All Bank Names</SelectItem>
                  
                  {(bankNames.includes('Landbank - 43') || bankNames.includes('Landbank - 45')) && (
                    <SelectGroup>
                      <SelectLabel className="font-bold text-emerald-800">Landbank of the Philippines</SelectLabel>
                      {bankNames.includes('Landbank - 43') && <SelectItem value="Landbank - 43" className="pl-6">Landbank - 43</SelectItem>}
                      {bankNames.includes('Landbank - 45') && <SelectItem value="Landbank - 45" className="pl-6">Landbank - 45</SelectItem>}
                    </SelectGroup>
                  )}
                  
                  {bankNames.some(b => b === 'Landbank - 43' || b === 'Landbank - 45') && bankNames.some(b => b !== 'Landbank - 43' && b !== 'Landbank - 45') && (
                    <div className="h-px bg-emerald-100 my-1 mx-2"></div>
                  )}
                  
                  {bankNames.some(b => b !== 'Landbank - 43' && b !== 'Landbank - 45') && (
                    <SelectGroup>
                      {bankNames.filter(name => name !== 'Landbank - 43' && name !== 'Landbank - 45').map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {selectedBankName && selectedBankName !== 'none' && !bankNames.includes(selectedBankName) && (
                    <SelectItem value={selectedBankName}>{selectedBankName}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <MonthYearPicker
                value={selectedDate}
                onChange={setSelectedDate}
                className="w-full rounded-lg border-emerald-200 bg-white px-4 py-2 text-gray-900 focus-visible:ring-2 focus-visible:ring-emerald-600 font-normal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fund
              </label>
              <Select value={selectedFund} onValueChange={setSelectedFund}>
                <SelectTrigger className="w-full bg-white border-emerald-200 focus:ring-emerald-600">
                  <SelectValue placeholder="All Funds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-gray-500 italic">All Funds</SelectItem>
                  {fundOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MOPH
              </label>
              <Select value={selectedPlace} onValueChange={setSelectedPlace}>
                <SelectTrigger className="w-full bg-white border-emerald-200 focus:ring-emerald-600">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-gray-500 italic">All Locations</SelectItem>
                  {selectedPlace && selectedPlace !== 'none' && !places.includes(selectedPlace) && (
                    <SelectItem value={selectedPlace}>{selectedPlace}</SelectItem>
                  )}
                  {places.map((place) => (
                    <SelectItem key={place} value={place}>
                      {place}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(selectedBankName || selectedDate || selectedFund || selectedPlace) && (
            <button
              onClick={() => {
                setSelectedBankName('')
                setSelectedDate('')
                setSelectedFund('')
                setSelectedPlace('')
              }}
              className="mt-4 text-emerald-600 text-sm hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Transaction Table */}
        <div>
          <div className="flex justify-between items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/batch-management')}
                variant="outline"
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              >
                <Archive className="w-4 h-4 mr-2" />
                View Batches
              </Button>
              <Button
                onClick={createBatchAndPrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={transactions.length === 0 || isCreatingBatch}
              >
                <Printer className="w-4 h-4 mr-2" />
                {isCreatingBatch ? 'Creating Batch...' : 'Print Report'}
              </Button>
            </div>
          </div>
          <ViewerTransactionTable transactions={transactions} />
        </div>
      </div>

      {/* Print Report - Visible only on Print */}
      <div className="hidden print:block w-full bg-white relative z-50">
        <PrintReport
          ref={printRef}
          transactions={transactions}
          logo={null}
          entryUserEmail={selectedEntryUserEmail}
          batchId={batchId || undefined}
          fund={selectedPlace && selectedPlace !== 'none' ? `MOPH - ${selectedPlace}` : selectedFund}
          bankName={selectedBankName}
        />
      </div>
    </div>
  )
}
