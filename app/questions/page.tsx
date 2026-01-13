import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import QuestionCard from '@/components/QuestionCard'
import { Card, CardContent } from '@/components/ui/card'

export default async function QuestionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*, creator:profiles!questions_creator_id_fkey(*)')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">All Questions</h1>
          <p className="mt-2 text-muted-foreground">Browse and make predictions</p>
        </div>
        <Link href="/questions/new">
          <Button size="lg">Create Question</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {questions && questions.length > 0 ? (
          questions.map((question) => (
            <QuestionCard key={question.id} question={question} showResolveButton />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No questions yet. Create one to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
