import type { ComponentProps } from "react";
import { ErrorPage } from "./ErrorPage";
import { businessErrorTheme } from "./error-theme";
import { ERROR_PAGE_COPY } from "./copy";
import { fetchBusinessSubdomainThemeFromHeaders } from "@/lib/utils/business-error-theme.server";

interface BusinessGonePageProps {
  pageCopy?: Pick<ComponentProps<typeof ErrorPage>, "code" | "title" | "description" | "copy" | "language">;
}

export async function BusinessGonePage({ pageCopy }: BusinessGonePageProps = {}) {
  const theme = await fetchBusinessSubdomainThemeFromHeaders();

  return (
    <ErrorPage
      {...(pageCopy ?? ERROR_PAGE_COPY.gone)}
      theme={businessErrorTheme(theme)}
      homeHref="/"
    />
  );
}
