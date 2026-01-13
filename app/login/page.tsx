'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      console.error('Error signing in:', error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-md border">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Prediction Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Track and score your yearly predictions
          </p>
        </div>
        {error === 'not_authorized' && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
            <p className="text-sm font-medium">Access Denied</p>
            <p className="text-sm mt-1">
              Your email is not authorized to access this application. Please contact the administrator for access.
            </p>
          </div>
        )}
        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-md border">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto mt-4"></div>
            <div className="h-12 bg-muted rounded w-full mt-8"></div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
