import { PublicDirectoryRoute, publicDirectoryMetadata, type PublicDirectoryRouteProps } from "@/features/public-directory/public-directory.server";

export const dynamic = "force-dynamic";

export default function LinktreeDirectory(props: PublicDirectoryRouteProps) {
  return <PublicDirectoryRoute {...props} kind="linktree" />;
}

export function generateMetadata(props: PublicDirectoryRouteProps) {
  return publicDirectoryMetadata("linktree", props);
}
