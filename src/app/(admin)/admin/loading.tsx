import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-gray-200 bg-white p-5">
        <Skeleton width={120} height={32} className="mb-8 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton height={36} className="rounded-lg" />
          <Skeleton height={36} className="rounded-lg" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton width={160} height={28} className="rounded mb-2" />
              <Skeleton width={100} height={16} className="rounded" />
            </div>
            <Skeleton width={140} height={40} className="rounded-lg" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={52} className="rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
