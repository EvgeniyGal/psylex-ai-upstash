import { Skeleton } from "@/components/ui/skeleton";

export default function MediationLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex h-14 items-center border-b border-hair bg-surface px-gutter">
        <div className="h-5 w-24 animate-pulse rounded bg-hair/50" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-gutter py-stack-lg">
        <div className="text-center">
          <Skeleton className="mx-auto mb-3 h-10 w-56" />
          <Skeleton className="mx-auto h-5 w-80" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded border border-hair bg-surface-container p-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>

          <div className="flex items-center gap-4 rounded border border-hair bg-surface-container p-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>

          <div className="flex items-center gap-4 rounded border border-hair bg-surface-container p-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
