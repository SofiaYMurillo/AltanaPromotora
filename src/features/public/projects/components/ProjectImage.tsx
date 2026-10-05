import Image from "next/image";

type ProjectImageProps = {
  src: string;
  alt: string;
};

export function ProjectImage({
  src,
  alt,
}: ProjectImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={800}
      className="h-auto w-full rounded-md object-cover aspect-[4/3]"
    />
  );
}
