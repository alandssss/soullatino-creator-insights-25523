import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  count?: number;
  variant?: 'cards' | 'list' | 'table';
}

export function LoadingState({ count = 3, variant = 'cards' }: LoadingStateProps) {
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  return null;
}
