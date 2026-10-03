import Image from "next/image";

const languageFlags = {
  ckb: "/images/languages/ku.png",
  ar: "/images/languages/saudi.png",
  en: "/images/languages/uk.png",
} as const;

/** Displays the current language; the parent button labels its switch action. */
export function LanguageFlag({ locale }: { locale: keyof typeof languageFlags }) {
  return (
    <Image
      src={languageFlags[locale]}
      alt=""
      aria-hidden="true"
      width={28}
      height={19}
      className="h-[19px] w-7 shrink-0 rounded-[3px] object-contain"
    />
  );
}
