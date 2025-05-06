import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-secondary/80 relative', className)}
      {...props}
    >
      <div className="absolute inset-0 bg-black/20 rounded-md" />
    </div>
  );
}

export { Skeleton };

export function BudgetListSkeleton() {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between px-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card text-card-foreground rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <div className="mt-1 flex items-center space-x-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}

export function BudgetDetailsSkeleton() {
  return (
    <div className="bg-card text-card-foreground mb-6 rounded-lg border p-5.5">
      <div className="mb-3">
        <Skeleton className="mt-1 h-6 w-48" />
        {/* <div className="mt-1 flex items-center space-x-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div> */}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex space-y-2 justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-18" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-6 w-16" />
            {/* <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-8" /> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryListSkeleton() {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card text-card-foreground rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-5 w-32" />
                <div className="mt-1 flex items-center space-x-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="mt-2">
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              {/* <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransactionListSkeleton() {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-card text-card-foreground rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32" />
                  <div className="mt-1 flex items-center space-x-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
              {/* <div className="ml-4 flex-shrink-0">
                <Skeleton className="h-5 w-24" />
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 