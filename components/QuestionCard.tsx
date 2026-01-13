import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Question } from '@/lib/types'
import { formatDate, isPastDeadline } from '@/lib/utils'

interface QuestionCardProps {
  question: Question
  showResolveButton?: boolean
}

export default function QuestionCard({ question, showResolveButton = false }: QuestionCardProps) {
  const deadlinePassed = isPastDeadline(question.deadline)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{question.title}</CardTitle>
            <CardDescription className="mt-2">
              Type: {question.question_type} • Deadline: {formatDate(question.deadline)}
              {question.resolved && ' • Resolved'}
            </CardDescription>
          </div>
          <div className="ml-4 flex gap-2">
            <Link href={`/questions/${question.id}`}>
              <Button variant="outline" size="sm">
                {question.resolved ? 'View' : 'Predict'}
              </Button>
            </Link>
            {showResolveButton && !question.resolved && deadlinePassed && (
              <Link href={`/questions/${question.id}/resolve`}>
                <Button variant="default" size="sm">
                  Resolve
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Created by: {question.creator?.display_name || 'Unknown'}
        </div>
        {question.resolved && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Answer: </span>
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
        )}
      </CardContent>
    </Card>
  )
}
