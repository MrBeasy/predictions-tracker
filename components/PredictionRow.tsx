import { Badge } from '@/components/ui/badge'
import { ConfidenceIndicator } from '@/components/ConfidenceIndicator'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PredictionRowProps {
  prediction: {
    id: string
    prediction_boolean?: boolean | null
    prediction_text?: string | null
    prediction_float?: number | null
    confidence: number
    is_correct?: boolean | null
    created_at: string
    user?: {
      display_name?: string
      email?: string
    }
  }
  question: {
    title: string
    question_type: string
  }
  showUser?: boolean
}

export function PredictionRow({ prediction, question, showUser = false }: PredictionRowProps) {
  const getPredictionValue = () => {
    if (question.question_type === 'boolean') {
      return prediction.prediction_boolean ? 'Yes' : 'No'
    }
    if (question.question_type === 'text') {
      return prediction.prediction_text || 'N/A'
    }
    if (question.question_type === 'float') {
      return prediction.prediction_float?.toString() || 'N/A'
    }
    return 'N/A'
  }

  const getResultBadge = () => {
    if (prediction.is_correct === null || prediction.is_correct === undefined) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    }
    if (prediction.is_correct) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Correct
        </Badge>
      )
    }
    return (
      <Badge variant="error" className="gap-1">
        <XCircle className="h-3 w-3" />
        Incorrect
      </Badge>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{question.title}</div>
        {showUser && prediction.user && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {prediction.user.display_name || prediction.user.email}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Prediction: </span>
            <span className="font-medium">{getPredictionValue()}</span>
          </div>
          <ConfidenceIndicator confidence={prediction.confidence} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground hidden sm:block">
          {formatDate(prediction.created_at)}
        </div>
        {getResultBadge()}
      </div>
    </div>
  )
}
