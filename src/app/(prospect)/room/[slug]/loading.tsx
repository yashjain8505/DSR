import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton shown while the room page is fetching data.
 * Mimics the RoomHeader + tabbed content layout.
 */
export default function RoomLoading() {
  return (
    <>
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton shape="rectangle" className="h-9 w-9 rounded-lg" />
            <Skeleton width={100} />
            <Skeleton width={16} className="mx-1" />
            <Skeleton width={120} />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:gap-8">
            {/* Sidebar skeleton (desktop) */}
            <div className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-2 lg:border-r lg:border-gray-200 lg:pr-6 lg:pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>

            {/* Mobile tab bar skeleton */}
            <div className="flex gap-2 border-b border-gray-200 pb-3 lg:hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={90} className="h-8 rounded-lg" />
              ))}
            </div>

            {/* Content area skeleton */}
            <div className="min-w-0 flex-1 py-6 lg:py-2">
              <div className="mx-auto max-w-3xl space-y-4">
                <Skeleton width={200} className="h-7" />
                <Skeleton width={160} className="h-4" />
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
                  <div className="space-y-3">
                    <Skeleton />
                    <Skeleton />
                    <Skeleton width="80%" />
                    <Skeleton width="60%" />
                    <Skeleton />
                    <Skeleton width="70%" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
