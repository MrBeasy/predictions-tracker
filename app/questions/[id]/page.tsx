import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import PredictionForm from '@/components/PredictionForm'
import { formatDate } from '@/lib/utils'

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*, creator:profiles!questions_creator_id_fkey(*)')
    .eq('id', id)
    .single()

  if (questionError) {
    console.error('Error fetching question:', questionError)
  }

  if (!question) {
    console.log('Question not found for ID:', id)
    notFound()
  }

  const { data: existingPrediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('question_id', id)
    .eq('user_id', user.id)
    .single()

  const { data: allPredictions } = await supabase
    .from('predictions')
    .select('*, user:profiles(*)')
    .eq('question_id', id)

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{question.title}</CardTitle>
          <CardDescription>
            <div className="space-y-1 mt-2">
              <div>Type: {question.question_type}</div>
              <div>Deadline: {formatDate(question.deadline)}</div>
              <div>Created by: {question.creator?.display_name || 'Unknown'}</div>
              {question.resolved && <div className="font-semibold text-green-600">Status: Resolved</div>}
            </div>
          </CardDescription>
        </CardHeader>
        {question.resolved && (
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-semibold mb-1">Correct Answer:</div>
              <div>
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
            </div>
          </CardContent>
        )}
      </Card>

      {!question.resolved ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {existingPrediction ? 'Update Your Prediction' : 'Make a Prediction'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionForm
              question={question}
              existingPrediction={existingPrediction || undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {existingPrediction && (
            <Card>
              <CardHeader>
                <CardTitle>Your Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Prediction: </span>
                    {question.question_type === 'boolean' && (
                      <span>{existingPrediction.prediction_boolean ? 'Yes' : 'No'}</span>
                    )}
                    {question.question_type === 'text' && (
                      <span>{existingPrediction.prediction_text}</span>
                    )}
                    {question.question_type === 'float' && (
                      <span>{existingPrediction.prediction_float}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Confidence: </span>
                    {existingPrediction.confidence}%
                  </div>
                  <div>
                    <span className="font-medium">Result: </span>
                    <span className={existingPrediction.is_correct ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {existingPrediction.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Predictions ({allPredictions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allPredictions && allPredictions.length > 0 ? (
                  allPredictions.map((prediction) => (
                    <div key={prediction.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{prediction.user?.display_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            Prediction: {
                              question.question_type === 'boolean'
                                ? (prediction.prediction_boolean ? 'Yes' : 'No')
                                : question.question_type === 'text'
                                ? prediction.prediction_text
                                : prediction.prediction_float
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: {prediction.confidence}%
                          </div>
                        </div>
                        <div className={prediction.is_correct ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {prediction.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No predictions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
