export type PublicDirectoryKind = "linktree" | "form";

export interface PublicDirectoryItem {
  slug: string;
  title: string | null;
  description: string | null;
  logo?: string | null;
  bannerImages?: string[];
  bannerMode?: "image" | "carousel";
  contentCount?: number;
  isDefault?: boolean;
  platforms?: string[];
  language?: "ckb" | "ar" | "en";
  requiredQuestionCount?: number;
}

export interface PublicPageDirectory {
  kind: PublicDirectoryKind;
  brand: {
    name: string;
    logo: string | null;
    accentColor: string;
    brandingRemoved: boolean;
  };
  items: PublicDirectoryItem[];
  page: number;
  totalPages: number;
  total: number;
}
