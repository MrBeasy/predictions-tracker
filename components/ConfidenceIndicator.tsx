import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConfidenceIndicatorProps {
  confidence: number
  className?: string
  showPercentage?: boolean
}

export function ConfidenceIndicator({
  confidence,
  className,
  showPercentage = true
}: ConfidenceIndicatorProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 71) return 'success'
    if (conf >= 41) return 'info'
    return 'warning'
  }

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 71) return 'High'
    if (conf >= 41) return 'Medium'
    return 'Low'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={getConfidenceColor(confidence)}>
        {getConfidenceLabel(confidence)}
      </Badge>
      {showPercentage && (
        <span className="text-sm text-muted-foreground">{confidence}%</span>
      )}
    </div>
  )
}
