import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface UserScoreProps {
  userName: string
  totalPredictions: number
  correctPredictions: number
  scorePercentage: number
}

export default function UserScore({
  userName,
  totalPredictions,
  correctPredictions,
  scorePercentage
}: UserScoreProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{userName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Score:</span>
            <span className="font-bold text-lg">{scorePercentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Correct:</span>
            <span>{correctPredictions} / {totalPredictions}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
