import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QuestionCard from '@/components/QuestionCard'
import UserScore from '@/components/UserScore'
import { calculateUserScore } from '@/lib/utils'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, question:questions(*)')
    .eq('user_id', user.id)

  // Fetch recent questions
  const { data: recentQuestions } = await supabase
    .from('questions')
    .select('*, creator:profiles!questions_creator_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch upcoming deadlines
  const { data: upcomingQuestions } = await supabase
    .from('questions')
    .select('*, creator:profiles!questions_creator_id_fkey(*)')
    .eq('resolved', false)
    .not('deadline', 'is', null)
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true })
    .limit(5)

  const userScore = predictions ? calculateUserScore(predictions) : null
  const totalPredictions = predictions?.length || 0
  const pendingPredictions = predictions?.filter(p => p.is_correct === null).length || 0

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userScore ? `${userScore.score_percentage.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {userScore ? `${userScore.correct_predictions} / ${userScore.total_predictions} correct` : 'No resolved predictions yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPredictions}</div>
            <p className="text-sm text-muted-foreground mt-1">Predictions made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingPredictions}</div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting resolution</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Questions</h2>
            <Link href="/questions/new">
              <Button>Create Question</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentQuestions && recentQuestions.length > 0 ? (
              recentQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No questions yet</p>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="mt-4">
            <Link href="/questions">
              <Button variant="outline" className="w-full">View All Questions</Button>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-4">
            {upcomingQuestions && upcomingQuestions.length > 0 ? (
              upcomingQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} showResolveButton />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No upcoming deadlines</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
