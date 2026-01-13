import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PredictionRow } from '@/components/PredictionRow'
import { ArrowLeft } from 'lucide-react'

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch all predictions for this user
  const { data: allPredictions } = await supabase
    .from('predictions')
    .select('*, question:questions(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Calculate stats
  const resolvedPredictions = allPredictions?.filter(p => p.is_correct !== null) || []
  const correctPredictions = resolvedPredictions.filter(p => p.is_correct)
  const scorePercentage = resolvedPredictions.length > 0
    ? (correctPredictions.length / resolvedPredictions.length) * 100
    : 0

  // Group predictions by status
  const pendingPredictions = allPredictions?.filter(p => p.is_correct === null) || []

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaderboard
          </Button>
        </Link>
        <h1 className="text-4xl font-bold">{profile.display_name || profile.email}</h1>
        <p className="mt-2 text-muted-foreground">Prediction history and statistics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Predictions</CardDescription>
            <CardTitle className="text-3xl">{allPredictions?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-3xl">{resolvedPredictions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Correct</CardDescription>
            <CardTitle className="text-3xl text-green-600">{correctPredictions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Accuracy</CardDescription>
            <CardTitle className="text-3xl">{scorePercentage.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* All Predictions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Predictions ({allPredictions?.length || 0})</CardTitle>
          <CardDescription>Complete prediction history</CardDescription>
        </CardHeader>
        <CardContent>
          {allPredictions && allPredictions.length > 0 ? (
            <div className="space-y-2">
              {allPredictions.map(prediction => (
                <PredictionRow
                  key={prediction.id}
                  prediction={prediction}
                  question={prediction.question}
                  showUser={false}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No predictions yet</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
