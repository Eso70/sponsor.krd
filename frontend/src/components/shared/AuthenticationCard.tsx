"use client";

import { SHARED_CARD_CLASS } from "./shared-surface-styles";

interface AuthenticationCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  plain?: boolean;
  leading?: React.ReactNode;
}

export function AuthenticationCard({
  title,
  description,
  children,
  plain = false,
  leading,
}: AuthenticationCardProps) {
  return (
    <section
      dir="ltr"
      className={`relative min-w-0 [overflow-wrap:anywhere] ${plain ? "py-2" : `${SHARED_CARD_CLASS} p-5 sm:p-6`}`}
    >
      <div className="mb-4 px-2 text-center">
        {leading}
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
