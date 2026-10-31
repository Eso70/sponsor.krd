import { dashboardInstallMetadata } from "@/lib/brand/dashboard-install";
import { requestBranding } from "@/lib/brand/request-branding.server";
import { platformConsolePath } from "@/lib/platform-console-path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const base = platformConsolePath();
  return {
    title: "Admin | Sponsor.krd",
    robots: "noindex, nofollow",
    ...(base ? dashboardInstallMetadata((await requestBranding()).name, base) : {}),
  };
}

export default async function PlatformConsoleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ platformConsole: string }>;
}) {
  const { platformConsole } = await params;
  if (platformConsole !== platformConsolePath()?.slice(1)) {
    notFound();
  }

  return <>{children}</>;
}
