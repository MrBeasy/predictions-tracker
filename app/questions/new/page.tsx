'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { QuestionType } from '@/lib/types'

export default function CreateQuestionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [questionType, setQuestionType] = useState<QuestionType>('boolean')
  const [deadline, setDeadline] = useState('')
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

      const questionData: any = {
        creator_id: user.id,
        title,
        question_type: questionType,
        deadline: deadline || null,
      }

      const { data, error: insertError } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      console.log('Question created:', data)
      window.location.href = `/questions/${data.id}`
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create New Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Will Bitcoin reach $100k by end of 2026?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Question Type *</Label>
              <Select
                id="type"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                required
              >
                <option value="boolean">Boolean (Yes/No)</option>
                <option value="text">Text</option>
                <option value="float">Number</option>
              </Select>
              <p className="text-sm text-muted-foreground">
                {questionType === 'boolean' && 'Answer will be Yes or No'}
                {questionType === 'text' && 'Answer will be text (manually marked as correct/incorrect)'}
                {questionType === 'float' && 'Answer will be a number (manually marked as correct/incorrect)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                When should this question be resolved?
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Question'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
