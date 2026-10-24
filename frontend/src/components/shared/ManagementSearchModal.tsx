"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import { Search, type LucideIcon } from "lucide-react";
import { MotionPulseIcon } from "@/components/motion/MotionPrimitives";
import { SearchModal } from "./SearchModal";
export interface ManagementSearchItem {
  id: string;
  name: string;
  image?: string | null;
  icon?: LucideIcon;
  subtitle?: string;
  searchTerms?: string[];
}

export interface ManagementSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  items: ManagementSearchItem[];
  onSelect: (item: ManagementSearchItem) => void;

  actionLabel?: string;
  platformTheme?: boolean;
  copy?: Partial<ManagementSearchModalCopy>;
}

export interface ManagementSearchModalCopy {
  action: string;
  placeholder: string;
  close: string;
  prompt: string;
  noResults: string;
}

const KURDISH_COPY: ManagementSearchModalCopy = {
  action: "دەستکاریکردن ←",
  placeholder: "ناوی پەیج بنووسە بۆ گەڕان...",
  close: "داخستن",
  prompt: "گەڕان بۆ پەیجەکان بکە.....",
  noResults: "هیچ ئەنجامێک نەدۆزرایەوە بۆ",
};

export const ManagementSearchModal = memo(function ManagementSearchModal({
  isOpen, onClose, searchQuery, onSearchQueryChange, items = [], onSelect,
  actionLabel = "دەستکاریکردن ←", platformTheme = false, copy,
}: ManagementSearchModalProps) {
  const labels = { ...KURDISH_COPY, ...copy };
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return items.filter((item) => item.name.toLowerCase().includes(query) ||
      item.searchTerms?.some((term) => term.toLowerCase().includes(query)));
  }, [items, searchQuery]);

  return <SearchModal isOpen={isOpen} onClose={onClose}
    placeholder={labels.placeholder} searchQuery={searchQuery}
    onSearchQueryChange={onSearchQueryChange} platformTheme={platformTheme}
    applyLabel={labels.close} applyAriaLabel={labels.close} shortcutLabel="ESC" showClear={false}
    onSearchSubmit={() => {
      if (!searchResults.length) return;
      onSelect(searchResults[0]);
      onClose();
    }}>{!searchQuery.trim() ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-400 text-xs sm:text-sm font-kurdish flex flex-col items-center justify-center gap-2 select-none">
              <MotionPulseIcon>
                <Search
                  className="h-5 w-5 opacity-40"
                  style={{ color: "var(--theme-primary, #6366f1)" }}
                />
              </MotionPulseIcon>
              <span>{labels.prompt}</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-400 text-sm font-kurdish">
              {labels.noResults} &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((item) => {
                const Icon = item.icon;
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors duration-150 motion-reduce:transition-none group cursor-pointer"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* Item Image */}
                    <div className="relative flex w-10 h-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-white/10 bg-slate-100 dark:bg-[#161B22] flex-shrink-0">
                      {Icon ? <Icon aria-hidden className="size-4 text-slate-500 dark:text-slate-400" /> : <Image
                        src={item.image || "/images/DefaultAvatar.png"}
                        alt={item.name}
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/DefaultAvatar.png";
                        }}
                      />}
                    </div>
                    {/* Name and UID slug */}
                    <div className="flex min-w-0 flex-col text-left">
                      <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100 transition-colors leading-tight">
                        {item.name}
                      </span>
                      <span className="truncate text-xs text-slate-400 dark:text-slate-400 font-mono leading-none mt-1">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  {/* Action Trigger */}
                  <div
                    className="text-xs font-semibold shrink-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pl-2"
                    style={{ color: "var(--theme-primary, #6366f1)" }}
                  >
                    {copy?.action ?? actionLabel}
                  </div>
                </button>
              );})}
            </div>
          )}
  </SearchModal>;
});
