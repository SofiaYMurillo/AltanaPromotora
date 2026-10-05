import Image from "next/image";

type CoverImageProps = {
  src: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
};

export function CoverImage({
  src,
  alt,
  sizes,
  preload = false,
  className,
}: CoverImageProps) {
  const unoptimized = src.endsWith(".svg");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized={unoptimized}
      className={className ? `object-cover ${className}` : "object-cover"}
    />
  );
}
