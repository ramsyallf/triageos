import { Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/Button'

interface GenerateButtonProps {
  canGenerate: boolean
  isLoading: boolean
  onClick: () => void
}

export function GenerateButton({ canGenerate, isLoading, onClick }: GenerateButtonProps) {
  return (
    <Button
      variant="primary"
      size="lg"
      isLoading={isLoading}
      disabled={!canGenerate || isLoading}
      onClick={onClick}
      className="w-full gap-2"
    >
      {isLoading ? (
        <span className="text-sm sm:text-base">Menganalisis...</span>
      ) : (
        <>
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Ekstrak Triage Note</span>
        </>
      )}
    </Button>
  )
}
