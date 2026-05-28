import { extractYouTubeId } from "@/lib/utils";

export type YouTubeEmbedProps = {
  url: string;
  title?: string;
  className?: string;
};

export function YouTubeEmbed({
  url,
  title = "YouTube video",
  className,
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8 text-sm text-gray-500">
        Invalid YouTube URL
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: 0,
          borderRadius: "0.75rem",
        }}
      />
    </div>
  );
}
