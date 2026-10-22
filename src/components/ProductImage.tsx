import Image from "next/image";
import type { ImageData } from "@/lib/types";
import { LogoMark } from "./Logo";

/**
 * Square product image. The aspect-ratio box reserves space before the image
 * loads (no layout shift); `priority` is only used for the main above-the-fold image.
 */
export function ProductImage({
  image,
  sizes,
  priority = false,
  className = "",
}: {
  image: ImageData | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`product-image ${className}`}>
      {image ? (
        <Image src={image.url} alt={image.alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
      ) : (
        <div className="image-placeholder" aria-hidden="true">
          <LogoMark size={56} />
        </div>
      )}
    </div>
  );
}
