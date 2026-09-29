import type { ComponentProps } from "react";
import { ErrorPage } from "./ErrorPage";
import { businessErrorTheme } from "./error-theme";
import { ERROR_PAGE_COPY } from "./copy";
import {
  fetchAuthenticatedBusinessTheme,
  fetchBusinessSubdomainThemeFromHeaders,
} from "@/lib/utils/business-error-theme.server";

interface BusinessServiceUnavailablePageProps {
  authenticated?: boolean;
  pageCopy?: Pick<ComponentProps<typeof ErrorPage>, "code" | "title" | "description" | "copy" | "language">;
}

export async function BusinessServiceUnavailablePage({
  authenticated = false,
  pageCopy,
}: BusinessServiceUnavailablePageProps) {
  const theme = authenticated
    ? await fetchAuthenticatedBusinessTheme()
    : await fetchBusinessSubdomainThemeFromHeaders();

  return (
    <ErrorPage
      {...(pageCopy ?? ERROR_PAGE_COPY.serviceUnavailable)}
      theme={businessErrorTheme(theme)}
      homeHref="/"
      showRetry
    />
  );
}
