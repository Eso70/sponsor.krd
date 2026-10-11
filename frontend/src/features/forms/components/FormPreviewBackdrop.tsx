import Image from "next/image";
import { isFormImage } from "../form-media";
import styles from "./FormPreview.module.css";

/** Decorative card background; the scrim follows the preview's own appearance. */
export function FormPreviewBackdrop({
  image,
  eager = false,
}: {
  image?: string;
  eager?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-form-preview-background
      className={`${styles.cardBackground} pointer-events-none absolute inset-0 -z-10 overflow-hidden`}
    >
      {image && isFormImage(image) && (
        <Image
          src={image}
          alt=""
          fill
          unoptimized={image.startsWith("data:")}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          sizes="100vw"
          className={styles.cardBackgroundImage}
        />
      )}
      <div className={`${styles.cardBackdrop} absolute inset-0`} />
    </div>
  );
}
