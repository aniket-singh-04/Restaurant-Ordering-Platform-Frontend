import { useState } from "react";
import type { multiImage } from "../components/MenuCard/types";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface ProductImageProps {
  items: {
    name: string;
    image?: string;
    images?: multiImage[];
  };
}

const MenuImageToggle: React.FC<ProductImageProps> = ({ items }) => {
  // Primary image
  const primaryImage =
    items.image ?? items.images?.find((img) => img.isPrimary)?.url ?? "";

  // All images: primary first, then secondary
  const allImages = [
    primaryImage,
    ...(items.images?.filter((img) => !img.isPrimary).map((img) => img.url) ??
      []),
  ];

  // Track current image index
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  const prevImage = () =>
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="relative h-full w-full group">
      <img
        src={allImages[currentIndex]}
        alt={items.name}
        className="  w-full max-h-1400 border-[#f99e1f] aspect-4/3 object-cover rounded-2xl shadow-md border border-gray-2 bg-gray-50 overflow-hidden"
        loading="lazy"
        decoding="async"
      />

      {allImages.length > 1 && (
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
