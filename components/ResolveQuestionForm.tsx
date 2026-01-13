'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Question, Prediction } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface ResolveQuestionFormProps {
  question: Question
  predictions: Prediction[]
  onSuccess?: () => void
}

export default function ResolveQuestionForm({
  question,
  predictions,
  onSuccess
}: ResolveQuestionFormProps) {
  const [correctAnswerBoolean, setCorrectAnswerBoolean] = useState<boolean | null>(null)
  const [correctAnswerText, setCorrectAnswerText] = useState('')
  const [correctAnswerFloat, setCorrectAnswerFloat] = useState('')
  const [predictionsCorrectness, setPredictionsCorrectness] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update question with correct answer
      const questionUpdate: any = {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        correct_answer_boolean: question.question_type === 'boolean' ? correctAnswerBoolean : null,
        correct_answer_text: question.question_type === 'text' ? correctAnswerText : null,
        correct_answer_float: question.question_type === 'float' ? parseFloat(correctAnswerFloat) : null,
      }

      const { error: questionError } = await supabase
        .from('questions')
        .update(questionUpdate)
        .eq('id', question.id)

      if (questionError) throw questionError

      // Update predictions with correctness
      for (const prediction of predictions) {
        let isCorrect = false

        if (question.question_type === 'boolean') {
          isCorrect = prediction.prediction_boolean === correctAnswerBoolean
        } else {
          // For text and float, use manual marking
          isCorrect = predictionsCorrectness[prediction.id] || false
        }

        const { error: predictionError } = await supabase
          .from('predictions')
          .update({ is_correct: isCorrect })
          .eq('id', prediction.id)

        if (predictionError) throw predictionError
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Correct Answer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.question_type === 'boolean' && (
            <div className="space-y-2">
              <Label htmlFor="answer">Correct Answer</Label>
              <Select
                id="answer"
                value={correctAnswerBoolean === null ? '' : correctAnswerBoolean.toString()}
                onChange={(e) => setCorrectAnswerBoolean(e.target.value === 'true')}
                required
              >
                <option value="">Select answer</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
          )}

          {question.question_type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="answer">Correct Answer</Label>
              <Textarea
                id="answer"
                value={correctAnswerText}
                onChange={(e) => setCorrectAnswerText(e.target.value)}
                placeholder="Enter the correct answer"
                required
              />
            </div>
          )}

          {question.question_type === 'float' && (
            <div className="space-y-2">
              <Label htmlFor="answer">Correct Answer</Label>
              <Input
                id="answer"
                type="number"
                step="any"
                value={correctAnswerFloat}
                onChange={(e) => setCorrectAnswerFloat(e.target.value)}
                placeholder="Enter the correct number"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {(question.question_type === 'text' || question.question_type === 'float') && predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {predictions.map((prediction) => (
              <div key={prediction.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{prediction.user?.display_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">
                    Prediction: {
                      question.question_type === 'text'
                        ? prediction.prediction_text
                        : prediction.prediction_float
                    } (Confidence: {prediction.confidence}%)
                  </div>
                </div>
                <Select
                  value={predictionsCorrectness[prediction.id]?.toString() || 'false'}
                  onChange={(e) => setPredictionsCorrectness({
                    ...predictionsCorrectness,
                    [prediction.id]: e.target.value === 'true'
                  })}
                >
                  <option value="false">Incorrect</option>
                  <option value="true">Correct</option>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Resolving...' : 'Resolve Question'}
      </Button>
    </form>
  )
}
