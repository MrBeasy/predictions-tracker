'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { ThemeToggle } from './ThemeToggle'
import { Home, ListTodo, CheckSquare, Trophy } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (pathname === '/login') {
    return null
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">Prediction Tracker</span>
            </Link>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/questions"
                  className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/questions')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <ListTodo className="h-4 w-4" />
                  Questions
                </Link>
                <Link
                  href="/my-predictions"
                  className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/my-predictions')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  My Predictions
                </Link>
                <Link
                  href="/leaderboard"
                  className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/leaderboard')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Link>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
