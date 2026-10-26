import { Skeleton } from "@/components/ui/skeleton";

export default function RoomLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex h-14 items-center border-b border-hair bg-surface px-gutter">
        <div className="h-5 w-24 animate-pulse rounded bg-hair/50" />
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-gutter py-stack-lg">
        <div>
          <Skeleton className="mb-2 h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="flex flex-1 flex-col gap-4 rounded border border-hair bg-surface-container p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <Skeleton className="h-12 w-2/3 rounded-lg" />
          </div>
          <div className="flex items-start gap-3 self-end">
            <Skeleton className="h-12 w-1/2 rounded-lg" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          </div>

          <div className="flex gap-2 border-t border-hair pt-4">
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
