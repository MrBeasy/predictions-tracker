import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UserScore from '@/components/UserScore'
import { PredictionRow } from '@/components/PredictionRow'
import { UserScore as UserScoreType } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all predictions with questions
  const { data: allPredictions } = await supabase
    .from('predictions')
    .select('*, user:profiles(*), question:questions(*)')
    .not('is_correct', 'is', null)
    .order('created_at', { ascending: false })

  // Group predictions by user and calculate scores
  const userScoresMap = new Map<string, UserScoreType & { predictions: any[] }>()

  allPredictions?.forEach(prediction => {
    const userId = prediction.user_id
    if (!userScoresMap.has(userId)) {
      userScoresMap.set(userId, {
        user_id: userId,
        user_name: prediction.user?.display_name || 'Unknown',
        total_predictions: 0,
        correct_predictions: 0,
        score_percentage: 0,
        predictions: []
      })
    }

    const userScore = userScoresMap.get(userId)!
    userScore.total_predictions++
    if (prediction.is_correct) {
      userScore.correct_predictions++
    }
    // Store only the first 3 predictions for preview
    if (userScore.predictions.length < 3) {
      userScore.predictions.push(prediction)
    }
  })

  // Calculate percentages and sort
  const userScores = Array.from(userScoresMap.values())
    .map(score => ({
      ...score,
      score_percentage: (score.correct_predictions / score.total_predictions) * 100
    }))
    .filter(score => score.total_predictions > 0)
    .sort((a, b) => b.score_percentage - a.score_percentage)

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">See how everyone is performing</p>
      </div>

      {userScores.length > 0 ? (
        <div className="space-y-6">
          {userScores.map((score, index) => (
            <Card key={score.user_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-muted-foreground w-12 text-center">
                      #{index + 1}
                    </div>
                    <div>
                      <CardTitle>{score.user_name}</CardTitle>
                      <CardDescription>
                        {score.correct_predictions} correct out of {score.total_predictions} predictions ({score.score_percentage.toFixed(1)}%)
                      </CardDescription>
                    </div>
                  </div>
                  <Link href={`/leaderboard/${score.user_id}`}>
                    <Button variant="outline" size="sm">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Predictions</h3>
                  {score.predictions.length > 0 ? (
                    <div className="space-y-2">
                      {score.predictions.map(prediction => (
                        <PredictionRow
                          key={prediction.id}
                          prediction={prediction}
                          question={prediction.question}
                          showUser={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No predictions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No resolved predictions yet. Make some predictions and wait for questions to be resolved!
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
