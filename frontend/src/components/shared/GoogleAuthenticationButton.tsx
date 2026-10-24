import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import Image from "next/image";

interface GoogleAuthenticationButtonProps {
  href: string;
  label?: string;
}

export function GoogleAuthenticationButton({
  href,
  label = "Continue with Google",
}: GoogleAuthenticationButtonProps) {
  return (
    <a
      href={href}
      className={`${SHARED_SOFT_BUTTON_CLASS} flex h-12 w-full items-center justify-center gap-3 px-4 text-sm font-bold`}
    >
      <Image
        src="/images/icons8-google-logo.svg"
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
      />
      {label}
    </a>
  );
}
