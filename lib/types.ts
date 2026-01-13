export type QuestionType = 'boolean' | 'text' | 'float'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Question {
  id: string
  creator_id: string
  title: string
  question_type: QuestionType
  deadline: string | null
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  correct_answer_boolean: boolean | null
  correct_answer_text: string | null
  correct_answer_float: number | null
  created_at: string
  updated_at: string
  creator?: Profile
  predictions?: Prediction[]
}

export interface Prediction {
  id: string
  question_id: string
  user_id: string
  prediction_boolean: boolean | null
  prediction_text: string | null
  prediction_float: number | null
  confidence: number
  is_correct: boolean | null
  created_at: string
  updated_at: string
  user?: Profile
  question?: Question
}

export interface CreateQuestionInput {
  title: string
  question_type: QuestionType
  deadline?: string
}

export interface CreatePredictionInput {
  question_id: string
  prediction_boolean?: boolean
  prediction_text?: string
  prediction_float?: number
  confidence: number
}

export interface ResolveQuestionInput {
  question_id: string
  correct_answer_boolean?: boolean
  correct_answer_text?: string
  correct_answer_float?: number
  predictions_correctness?: Record<string, boolean>
}

export interface UserScore {
  user_id: string
  user_name: string
  total_predictions: number
  correct_predictions: number
  score_percentage: number
}
