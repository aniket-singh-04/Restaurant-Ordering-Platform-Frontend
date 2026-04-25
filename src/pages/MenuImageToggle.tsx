import { useCallback, useEffect, useMemo, useState } from "react";
import type { multiImage } from "../components/MenuCard/types";
import { ArrowRight, ArrowLeft, Play } from "lucide-react";

interface ProductImageProps {
  items: {
    name: string;
    image?: string;
    images?: multiImage[];
    video?: {
      url?: string;
    } | null;
  };
  /**
   * When `true`, the video `<video>` element is NOT rendered until the
   * user intentionally navigates to the video slide or clicks play when the
   * item has no image slides. Images are always loaded immediately.
   */
  lazyVideo?: boolean;
}

const MenuImageToggle: React.FC<ProductImageProps> = ({
  items,
  lazyVideo = true,
}) => {
  /* ------------------------------------------------------------------ */
  /*  Build ordered media list                                          */
  /* ------------------------------------------------------------------ */
  const mediaItems = useMemo(() => {
    const primaryImage =
      items.image ?? items.images?.find((img) => img.isPrimary)?.url ?? "";
    const imageUrls = [
      primaryImage,
      ...(items.images?.filter((img) => !img.isPrimary).map((img) => img.url) ??
        []),
    ].filter(Boolean);

    const seen = new Set<string>();
    const orderedMedia = [
      ...imageUrls.map((url) => ({ type: "image" as const, src: url })),
      ...(items.video?.url
        ? [{ type: "video" as const, src: items.video.url }]
        : []),
    ].filter((asset) => {
      if (seen.has(asset.src)) return false;
      seen.add(asset.src);
      return true;
    });

    return orderedMedia;
  }, [items.image, items.images, items.video?.url]);

  /* ------------------------------------------------------------------ */
  /*  Carousel index                                                    */
  /* ------------------------------------------------------------------ */
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMedia = mediaItems[currentIndex] ?? null;
  const hasImageSlides = useMemo(
    () => mediaItems.some((media) => media.type === "image"),
    [mediaItems],
  );

  useEffect(() => {
    if (currentIndex >= mediaItems.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, mediaItems.length]);

  const [videoActivated, setVideoActivated] = useState(!lazyVideo);

  useEffect(() => {
    setVideoActivated(!lazyVideo);
  }, [items.video?.url, lazyVideo]);

  const activateVideoIfNeeded = useCallback(
    (nextIndex: number) => {
      if (!lazyVideo) {
        return;
      }

      if (mediaItems[nextIndex]?.type === "video") {
        setVideoActivated(true);
      }
    },
    [lazyVideo, mediaItems],
  );

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % mediaItems.length;
    activateVideoIfNeeded(nextIndex);
    setCurrentIndex(nextIndex);
  };

  const prevImage = () => {
    const nextIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
    activateVideoIfNeeded(nextIndex);
    setCurrentIndex(nextIndex);
  };

  const handlePlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setVideoActivated(true);
    },
    [],
  );

  /* ------------------------------------------------------------------ */
  /*  Decide whether to render the real <video> or a placeholder        */
  /* ------------------------------------------------------------------ */
  const shouldRenderVideo =
    currentMedia?.type === "video" && videoActivated;

  const isVideoPending =
    currentMedia?.type === "video" && !videoActivated;

  return (
    <div className="relative h-full w-full group">
      {currentMedia ? (
        shouldRenderVideo ? (
          <video
            key={currentMedia.src}
            src={currentMedia.src}
            className="w-full max-h-1400 border-[#f99e1f] aspect-4/3 object-cover rounded-2xl shadow-md border border-gray-2 bg-gray-50 overflow-hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : isVideoPending ? (
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={`Play video for ${items.name}`}
            className="relative flex w-full max-h-1400 aspect-4/3 items-center justify-center rounded-2xl shadow-md border border-gray-2 bg-gray-100 overflow-hidden cursor-pointer"
          >
            {hasImageSlides ? (
              <img
                src={mediaItems.find((m) => m.type === "image")!.src}
                alt={items.name}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : null}
            <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70">
              <Play className="h-6 w-6 fill-white" />
            </span>
          </button>
        ) : (
          <img
            src={currentMedia.src}
            alt={items.name}
            className="w-full max-h-1400 border-[#f99e1f] aspect-4/3 object-cover rounded-2xl shadow-md border border-gray-2 bg-gray-50 overflow-hidden"
            loading="eager"
            decoding="async"
          />
        )
      ) : (
        <div className="flex h-full w-full aspect-4/3 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-500">
          Media preview unavailable
        </div>
      )}

      {mediaItems.length > 1 && (
        <div className="absolute bottom-2 left-2 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="cursor-pointer flex items-center justify-center rounded-full bg-[#f97415] hover:bg-linear-to-r hover:from-[#f97415] hover:via-[#f99e1f] hover:to-[#fac938]  text-white px-3 py-1.5 text-sm font-medium transition-colors duration-300 shadow-lg shadow-black/40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="cursor-pointer flex items-center justify-center rounded-full bg-[#f97415] hover:bg-linear-to-r hover:from-[#f97415] hover:via-[#f99e1f] hover:to-[#fac938]  text-white px-3 py-1.5 text-sm font-medium transition-colors duration-300 shadow-lg shadow-black/40"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuImageToggle;
