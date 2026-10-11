"use client";
import { BusinessCardActions } from "./BusinessCardActions";

import { memo, useState } from "react";
import Image from "next/image";
import { Globe, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ManagementTablePagination } from "@/components/shared/ManagementTable";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { ManagementCard } from "@/components/shared/ManagementCard";
import { formatDate, getRootDomain } from "@/lib/utils/linktree-utils";
import type { PlatformBusiness as Business } from "@linktree/types";
import {
  BusinessMetaBadges,
  BusinessMetaField,
} from "@/features/platform-admin/components/BusinessMetaBadges";
import { usePlatformCopy } from "@/features/platform-admin/i18n/copy";

interface BusinessesGridProps {
  data?: Business[];
  pagination?: ManagementTablePagination;
  onEdit?: (business: Business) => void;
  onDelete?: (id: string, name: string) => void;
  onViewAnalytics?: (business: Business) => void;
  onManageSessions?: (business: Business) => void;
  onOpenDashboard?: (business: Business) => void;
  onManageDomains?: (business: Business) => void;
}

const BusinessCard = memo(function BusinessCard({
  item,
  onEdit,
  onDelete,
  onViewAnalytics,
  onManageSessions,
  onOpenDashboard,
  onManageDomains,
}: {
  item: Business;
  onEdit?: (business: Business) => void;
  onDelete?: (id: string, name: string) => void;
  onViewAnalytics?: (business: Business) => void;
  onManageSessions?: (business: Business) => void;
  onOpenDashboard?: (business: Business) => void;
  onManageDomains?: (business: Business) => void;
}) {
  const copy = usePlatformCopy();
  const [imgError, setImgError] = useState(false);
  const avatarUrl = item.logo || item.default_avatar;

  return (
    <ManagementCard className="min-w-0">
      {/* Header Section */}
      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-gray-200 shrink-0 shadow-sm">
          {avatarUrl && !imgError ? (
            <Image
              src={avatarUrl}
              alt={item.name}
              fill
              sizes="(min-width: 640px) 56px, 40px"
              unoptimized
              onError={() => setImgError(true)}
              className="object-cover"
            />
          ) : (
            <div className="sa-gradient flex h-full w-full items-center justify-center text-sm font-bold sm:text-lg">
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">
            {item.name}
          </h3>
          <p className="text-xs text-gray-600 truncate">@{item.username}</p>
          <BusinessMetaBadges item={item} className="mt-1.5" />
        </div>
      </div>

      {/* Subdomain Section */}
      <div className="mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-0 truncate">
            {copy.subdomain}
          </span>
          <span className="text-xs text-gray-700 font-mono min-w-0 flex-1 truncate">
            {item.subdomain
              ? `${item.subdomain}.${getRootDomain()}`
              : copy.notSet}
          </span>
        </div>
      </div>

      {/* Details Section */}
      <div className="mb-2 grid grid-cols-2 gap-2 sm:mb-3">
        <BusinessMetaField
          label={copy.email}
          value={item.email?.trim() || "—"}
        />
        <BusinessMetaField
          label={copy.mobile}
          value={item.phone?.trim() || "—"}
          mono
        />
        <BusinessMetaField
          label={copy.created}
          value={formatDate(item.created_at)}
        />
        <BusinessMetaField
          label={copy.updated}
          value={formatDate(item.updated_at)}
        />
      </div>

      <BusinessCardActions
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewAnalytics={onViewAnalytics}
        onManageDomains={onManageDomains}
        onManageSessions={onManageSessions}
        onOpenDashboard={onOpenDashboard}
      />
    </ManagementCard>
  );
});

export const BusinessesGrid = memo(function BusinessesGrid({
  data = [],
  onEdit,
  onDelete,
  onViewAnalytics,
  onManageSessions,
  onOpenDashboard,
  onManageDomains,
  pagination,
}: BusinessesGridProps) {
  const copy = usePlatformCopy();
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={copy.noBusinesses}
        description={copy.noBusinessesDescription}
      />
    );
  }

  return (
    <ManagementGrid
      data={data}
      getItemKey={(item) => item.id}
      pagination={pagination}
      paginationCopy={{ of: copy.of, previous: copy.previous, next: copy.next }}
      desktopColumns={3}
      renderItem={(item) => (
        <BusinessCard
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewAnalytics={onViewAnalytics}
          onManageSessions={onManageSessions}
          onOpenDashboard={onOpenDashboard}
          onManageDomains={onManageDomains}
        />
      )}
    />
  );
});
