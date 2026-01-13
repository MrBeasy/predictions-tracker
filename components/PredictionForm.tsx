'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Slider } from './ui/slider'
import { Textarea } from './ui/textarea'
import { Question, Prediction } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface PredictionFormProps {
  question: Question
  existingPrediction?: Prediction
  onSuccess?: () => void
}

export default function PredictionForm({ question, existingPrediction, onSuccess }: PredictionFormProps) {
  const [confidence, setConfidence] = useState(existingPrediction?.confidence || 50)
  const [predictionBoolean, setPredictionBoolean] = useState<boolean | null>(
    existingPrediction?.prediction_boolean ?? null
  )
  const [predictionText, setPredictionText] = useState(existingPrediction?.prediction_text || '')
  const [predictionFloat, setPredictionFloat] = useState(
    existingPrediction?.prediction_float?.toString() || ''
  )
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

      const predictionData: any = {
        question_id: question.id,
        user_id: user.id,
        confidence,
        prediction_boolean: question.question_type === 'boolean' ? predictionBoolean : null,
        prediction_text: question.question_type === 'text' ? predictionText : null,
        prediction_float: question.question_type === 'float' ? parseFloat(predictionFloat) : null,
      }

      const { error: upsertError } = await supabase
        .from('predictions')
        .upsert(predictionData, { onConflict: 'question_id,user_id' })

      if (upsertError) throw upsertError

      if (onSuccess) {
        onSuccess()
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {question.question_type === 'boolean' && (
        <div className="space-y-2">
          <Label htmlFor="prediction">Your Prediction</Label>
          <Select
            id="prediction"
            value={predictionBoolean === null ? '' : predictionBoolean.toString()}
            onChange={(e) => setPredictionBoolean(e.target.value === 'true')}
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
          <Label htmlFor="prediction">Your Prediction</Label>
          <Textarea
            id="prediction"
            value={predictionText}
            onChange={(e) => setPredictionText(e.target.value)}
            placeholder="Enter your prediction"
            required
          />
        </div>
      )}

      {question.question_type === 'float' && (
        <div className="space-y-2">
          <Label htmlFor="prediction">Your Prediction</Label>
          <Input
            id="prediction"
            type="number"
            step="any"
            value={predictionFloat}
            onChange={(e) => setPredictionFloat(e.target.value)}
            placeholder="Enter a number"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="confidence">Confidence: {confidence}%</Label>
        <Slider
          id="confidence"
          min={0}
          max={100}
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
        />
        <p className="text-sm text-muted-foreground">
          How confident are you in this prediction?
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : existingPrediction ? 'Update Prediction' : 'Submit Prediction'}
      </Button>
    </form>
  )
}
