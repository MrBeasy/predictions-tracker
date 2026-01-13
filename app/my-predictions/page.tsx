import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, calculateUserScore } from '@/lib/utils'
import UserScore from '@/components/UserScore'

export default async function MyPredictionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, question:questions(*, creator:profiles!questions_creator_id_fkey(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const userScore = predictions ? calculateUserScore(predictions) : null

  const resolvedPredictions = predictions?.filter(p => p.is_correct !== null) || []
  const pendingPredictions = predictions?.filter(p => p.is_correct === null) || []

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">My Predictions</h1>
        <p className="mt-2 text-muted-foreground">Track your prediction history and accuracy</p>
      </div>

      {userScore && (
        <div className="mb-8 max-w-md">
          <UserScore
            userName={profile?.display_name || 'You'}
            totalPredictions={userScore.total_predictions}
            correctPredictions={userScore.correct_predictions}
            scorePercentage={userScore.score_percentage}
          />
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Resolved Predictions ({resolvedPredictions.length})</h2>
          <div className="space-y-4">
            {resolvedPredictions.length > 0 ? (
              resolvedPredictions.map((prediction) => {
                const question = prediction.question
                return (
                  <Card key={prediction.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{question.title}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-2">
                            Deadline: {formatDate(question.deadline)}
                          </div>
                        </div>
                        <div className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold ${
                          prediction.is_correct
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prediction.is_correct ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Your Prediction: </span>
                          {question.question_type === 'boolean' && (
                            <span>{prediction.prediction_boolean ? 'Yes' : 'No'}</span>
                          )}
                          {question.question_type === 'text' && (
                            <span>{prediction.prediction_text}</span>
                          )}
                          {question.question_type === 'float' && (
                            <span>{prediction.prediction_float}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Correct Answer: </span>
                          {question.question_type === 'boolean' && (
                            <span>{question.correct_answer_boolean ? 'Yes' : 'No'}</span>
                          )}
                          {question.question_type === 'text' && (
                            <span>{question.correct_answer_text}</span>
                          )}
                          {question.question_type === 'float' && (
                            <span>{question.correct_answer_float}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Confidence: </span>
                          {prediction.confidence}%
                        </div>
                        <div>
                          <Link href={`/questions/${question.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No resolved predictions yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Predictions ({pendingPredictions.length})</h2>
          <div className="space-y-4">
            {pendingPredictions.length > 0 ? (
              pendingPredictions.map((prediction) => {
                const question = prediction.question
                return (
                  <Card key={prediction.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{question.title}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-2">
                            Deadline: {formatDate(question.deadline)}
                          </div>
                        </div>
                        <div className="ml-4 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                          Pending
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Your Prediction: </span>
                          {question.question_type === 'boolean' && (
                            <span>{prediction.prediction_boolean ? 'Yes' : 'No'}</span>
                          )}
                          {question.question_type === 'text' && (
                            <span>{prediction.prediction_text}</span>
                          )}
                          {question.question_type === 'float' && (
                            <span>{prediction.prediction_float}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Confidence: </span>
                          {prediction.confidence}%
                        </div>
                        <div className="col-span-2">
                          <Link href={`/questions/${question.id}`}>
                            <Button variant="outline" size="sm">View Question</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No pending predictions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
