import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UserScore from '@/components/UserScore'
import { UserScore as UserScoreType } from '@/lib/types'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all predictions grouped by user
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, user:profiles(*)')
    .not('is_correct', 'is', null)

  // Group predictions by user and calculate scores
  const userScoresMap = new Map<string, UserScoreType>()

  predictions?.forEach(prediction => {
    const userId = prediction.user_id
    if (!userScoresMap.has(userId)) {
      userScoresMap.set(userId, {
        user_id: userId,
        user_name: prediction.user?.display_name || 'Unknown',
        total_predictions: 0,
        correct_predictions: 0,
        score_percentage: 0
      })
    }

    const userScore = userScoresMap.get(userId)!
    userScore.total_predictions++
    if (prediction.is_correct) {
      userScore.correct_predictions++
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
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">See how everyone is performing</p>
      </div>

      {userScores.length > 0 ? (
        <div className="space-y-4">
          {userScores.map((score, index) => (
            <div key={score.user_id} className="flex items-center gap-4">
              <div className="text-3xl font-bold text-muted-foreground w-12 text-center">
                #{index + 1}
              </div>
              <div className="flex-1">
                <UserScore
                  userName={score.user_name}
                  totalPredictions={score.total_predictions}
                  correctPredictions={score.correct_predictions}
                  scorePercentage={score.score_percentage}
                />
              </div>
            </div>
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
