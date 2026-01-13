import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ResolveQuestionForm from '@/components/ResolveQuestionForm'
import { formatDate } from '@/lib/utils'

export default async function ResolveQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: question } = await supabase
    .from('questions')
    .select('*, creator:profiles!questions_creator_id_fkey(*)')
    .eq('id', id)
    .single()

  if (!question) {
    notFound()
  }

  if (question.resolved) {
    redirect(`/questions/${id}`)
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, user:profiles(*)')
    .eq('question_id', id)

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Resolve Question</CardTitle>
          <CardDescription>
            <div className="space-y-1 mt-2">
              <div className="text-lg font-medium text-foreground">{question.title}</div>
              <div>Type: {question.question_type}</div>
              <div>Deadline: {formatDate(question.deadline)}</div>
              <div>Created by: {question.creator?.display_name || 'Unknown'}</div>
              <div>Predictions: {predictions?.length || 0}</div>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provide the Correct Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <ResolveQuestionForm
            question={question}
            predictions={predictions || []}
            onSuccess={() => window.location.href = `/questions/${id}`}
          />
        </CardContent>
      </Card>
    </main>
  )
}
