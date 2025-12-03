import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 dark:border-gray-800">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-4 h-8 w-32" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export { Skeleton, PageSkeleton, CardSkeleton };
