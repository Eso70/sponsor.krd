import type { ComponentProps } from "react";
import { ErrorPage } from "./ErrorPage";
import { businessErrorTheme } from "./error-theme";
import { ERROR_PAGE_COPY } from "./copy";
import {
  fetchAuthenticatedBusinessTheme,
  fetchBusinessSubdomainThemeFromHeaders,
} from "@/lib/utils/business-error-theme.server";

interface BusinessGatewayTimeoutPageProps {
  authenticated?: boolean;
  pageCopy?: Pick<ComponentProps<typeof ErrorPage>, "code" | "title" | "description" | "copy" | "language">;
}

export async function BusinessGatewayTimeoutPage({
  authenticated = false,
  pageCopy,
}: BusinessGatewayTimeoutPageProps) {
  const theme = authenticated
    ? await fetchAuthenticatedBusinessTheme()
    : await fetchBusinessSubdomainThemeFromHeaders();

  return (
    <ErrorPage
      {...(pageCopy ?? ERROR_PAGE_COPY.gatewayTimeout)}
      theme={businessErrorTheme(theme)}
      homeHref="/"
      showRetry
    />
  );
}
