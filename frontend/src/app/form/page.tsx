import { PublicDirectoryRoute, publicDirectoryMetadata, type PublicDirectoryRouteProps } from "@/features/public-directory/public-directory.server";

export const dynamic = "force-dynamic";

export default function FormDirectory(props: PublicDirectoryRouteProps) {
  return <PublicDirectoryRoute {...props} kind="form" />;
}

export function generateMetadata(props: PublicDirectoryRouteProps) {
  return publicDirectoryMetadata("form", props);
}
