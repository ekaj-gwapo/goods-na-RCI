'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Confetti from 'react-confetti'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Easter egg states
  const [isEggRevealed, setIsEggRevealed] = useState(false)
  const [eggPosition, setEggPosition] = useState(50)
  const [isEggBroken, setIsEggBroken] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === 'entry_user') {
          router.push('/entry-dashboard')
        } else if (user.role === 'viewer_user') {
          router.push('/viewer-dashboard')
        }
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }

    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [router])

  const handleTitleClick = () => {
    if (!isEggRevealed && !isEggBroken) {
      setIsEggRevealed(true)
      setEggPosition(50)
    }
  }

  const handleEggHover = () => {
    if (!isEggRevealed || isEggBroken) return
    // Move egg to a random position between 10% and 90%
    let newPos = Math.floor(Math.random() * 80) + 10
    // Ensure it moves a decent distance from the current position
    while (Math.abs(newPos - eggPosition) < 30) {
      newPos = Math.floor(Math.random() * 80) + 10
    }
    setEggPosition(newPos)
  }

  const handleEggClick = () => {
    if (!isEggRevealed || isEggBroken) return
    setIsEggBroken(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      const user = data.user

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user))

      // Redirect based on role
      if (user.role === 'entry_user') {
        router.push('/entry-dashboard')
      } else if (user.role === 'viewer_user') {
        router.push('/viewer-dashboard')
      } else {
        router.push('/')
      }

      toast.success('Login successful!')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'An error occurred'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#f9f6f0] overflow-hidden">

      {/* Surprise Overlay */}
      {isEggBroken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={true}
            numberOfPieces={200}
            style={{ zIndex: 51 }}
          />
          <div className="relative p-6 bg-white rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300 max-w-sm mx-4 z-52">
            <button
              onClick={() => { setIsEggBroken(false); setIsEggRevealed(false); setEggPosition(50); }}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">You caught Esther's egg! 🎉</h2>
            <div className="w-full max-w-[250px] rounded-lg shadow-md mb-2 overflow-hidden">
              <Image
                src="/logos/esther egg.jpg"
                alt="You got Esthers Egg!"
                width={250}
                height={250}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">I guess you really wanted to log in.</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative">
        {/* Egg Element */}
        <div
          className={`absolute text-4xl cursor-pointer select-none z-0 ${isEggRevealed && !isEggBroken ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{
            top: isEggRevealed ? '-36px' : '20px',
            left: `${eggPosition}%`,
            transform: 'translateX(-50%)',
            transition: 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), left 0.8s ease-out, opacity 0.2s ease-in-out',
          }}
          onMouseEnter={handleEggHover}
          onClick={handleEggClick}
        >
          🥚
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <Card className="shadow-lg bg-white">
            <CardHeader>
              <CardTitle
                className="text-2xl inline-block cursor-help select-none transition-colors hover:text-green-600 focus:outline-none w-max"
                onClick={handleTitleClick}
                title="Click me!"
              >
                Login
              </CardTitle>
              <CardDescription>Enter your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="entry@demo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Demo123456!"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
