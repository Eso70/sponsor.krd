import type { ComponentProps } from "react";
import { ErrorPage } from "./ErrorPage";
import { businessErrorTheme } from "./error-theme";
import { ERROR_PAGE_COPY } from "./copy";
import { fetchBusinessSubdomainThemeFromHeaders } from "@/lib/utils/business-error-theme.server";

interface BusinessInactivePageProps {
  pageCopy?: Pick<ComponentProps<typeof ErrorPage>, "code" | "title" | "description" | "copy" | "language">;
}

export async function BusinessInactivePage({ pageCopy }: BusinessInactivePageProps = {}) {
  const theme = await fetchBusinessSubdomainThemeFromHeaders();

  return (
    <ErrorPage
      {...(pageCopy ?? ERROR_PAGE_COPY.inactive)}
      theme={businessErrorTheme(theme)}
      homeHref="/"
    />
  );
}
