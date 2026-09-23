import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export interface PublicBusinessLinktree {
  id: string;
  name: string;
  uid: string;
  seo_name?: string | null;
  image?: string | null;
  subtitle?: string | null;
}

export function BusinessPublicLinktreeCard({
  linktree,
}: {
  linktree: PublicBusinessLinktree;
}) {
  return (
    <Link
      href={`/linktree/${linktree.seo_name || linktree.uid}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${linktree.name} — لە تابێکی نوێدا دەکرێتەوە`}
      className="group overflow-hidden rounded-2xl border border-black/10 bg-white/70 shadow-sm transition-[border-color,transform,box-shadow] hover:-translate-y-1 hover:border-black/20 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/45 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:focus-visible:ring-white/60"
    >
      {linktree.image ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={linktree.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            unoptimized
          />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0" dir="auto">
          <h3 className="break-words text-lg font-semibold">{linktree.name}</h3>
          {linktree.subtitle ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/55 dark:text-white/55">
              {linktree.subtitle}
            </p>
          ) : null}
        </div>
        <ArrowUpRight aria-hidden="true" className="mt-1 size-5 shrink-0 opacity-55" />
      </div>
    </Link>
  );
}
