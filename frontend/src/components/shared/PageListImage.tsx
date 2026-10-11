import Image from "next/image";

export function PageListImage({
  src,
  name,
  variant = "grid",
}: {
  src?: string | null;
  name: string;
  variant?: "grid" | "table" | "mobile";
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border-gray-200 ${variant === "grid" ? "size-10 border-2 shadow-sm sm:size-14" : variant === "mobile" ? "size-16 border" : "mx-auto size-8 border sm:size-10"}`}
    >
      <Image
        src={src || "/images/DefaultAvatar.png"}
        alt={name}
        fill
        className="object-cover"
        loading="lazy"
        sizes={
          variant === "grid"
            ? "(max-width: 640px) 64px, 80px"
            : variant === "table"
              ? "(max-width: 640px) 32px, 40px"
              : "64px"
        }
        quality={75}
        unoptimized
      />
    </div>
  );
}
