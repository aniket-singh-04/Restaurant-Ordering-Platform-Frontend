import { useEffect, useMemo, useState } from "react";
import type { multiImage } from "../components/MenuCard/types";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface ProductImageProps {
  items: {
    name: string;
    image?: string;
    images?: multiImage[];
    video?: {
      url?: string;
    } | null;
  };
}

const MenuImageToggle: React.FC<ProductImageProps> = ({ items }) => {
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
      ...(items.video?.url
        ? [{ type: "video" as const, src: items.video.url }]
        : []),
      ...imageUrls.map((url) => ({ type: "image" as const, src: url })),
    ].filter((asset) => {
      if (seen.has(asset.src)) return false;
      seen.add(asset.src);
      return true;
    });

    return orderedMedia;
  }, [items.image, items.images, items.video?.url]);

  // Track current image index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMedia = mediaItems[currentIndex] ?? null;

  useEffect(() => {
    if (currentIndex >= mediaItems.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, mediaItems.length]);

  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  const prevImage = () =>
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  return (
    <div className="relative h-full w-full group">
      {currentMedia ? (
        currentMedia.type === "video" ? (
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
        ) : (
          <img
            src={currentMedia.src}
            alt={items.name}
            className="w-full max-h-1400 border-[#f99e1f] aspect-4/3 object-cover rounded-2xl shadow-md border border-gray-2 bg-gray-50 overflow-hidden"
            loading="lazy"
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
