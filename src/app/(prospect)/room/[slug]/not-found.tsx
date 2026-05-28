import { FileQuestion } from "lucide-react";

/**
 * 404 page shown when a room slug doesn't match any active room.
 */
export default function RoomNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
          <FileQuestion className="h-10 w-10 text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Room not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
          This room doesn&apos;t exist or is no longer active. If you believe
          this is a mistake, please contact the person who shared this link
          with you.
        </p>

        <a
          href="https://linkrunner.io"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#4d4bf7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3d3bd4]"
        >
          Visit Linkrunner
        </a>
      </div>
    </div>
  );
}
