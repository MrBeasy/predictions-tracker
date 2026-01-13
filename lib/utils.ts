import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Prediction, UserScore } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateUserScore(predictions: Prediction[]): UserScore | null {
  if (predictions.length === 0) {
    return null
  }

  const resolvedPredictions = predictions.filter(p => p.is_correct !== null)

  if (resolvedPredictions.length === 0) {
    return null
  }

  const correctPredictions = resolvedPredictions.filter(p => p.is_correct === true).length
  const scorePercentage = (correctPredictions / resolvedPredictions.length) * 100

  return {
    user_id: predictions[0].user_id,
    user_name: predictions[0].user?.display_name || 'Unknown',
    total_predictions: resolvedPredictions.length,
    correct_predictions: correctPredictions,
    score_percentage: Math.round(scorePercentage * 10) / 10
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No deadline'

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getQuestionYear(deadline: string | null): number | null {
  if (!deadline) return null
  return new Date(deadline).getFullYear()
}

export function isPastDeadline(deadline: string | null): boolean {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}
