import { DashboardHeaderFrame } from "./DashboardHeaderFrame";
import { HEADER_ACTION_BUTTON_CLASS } from "./shared-control-styles";
import {
  AVATAR_MENU_SIZE_CLASS,
  AVATAR_MENU_TRIGGER_CLASS,
} from "./avatar-menu-styles";
import { Skeleton } from "./SkeletonBlock";

/** One placeholder for each real header control, including its inset icon. */
export function DashboardHeaderSkeleton() {
  return (
    <DashboardHeaderFrame>
      <div
        aria-hidden="true"
        className="pointer-events-none flex min-w-0 items-center gap-2 sm:gap-3"
      >
        <span
          data-header-skeleton="menu"
          className={HEADER_ACTION_BUTTON_CLASS}
        >
          <Skeleton className="size-4" rounded="rounded-md" />
        </span>
        <Skeleton
          className="h-4 w-24 max-w-full sm:h-[18px] sm:w-32"
          rounded="rounded-md"
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none flex shrink-0 items-center gap-1.5 sm:gap-2"
      >
        {(["refresh", "notifications", "language", "theme"] as const).map(
          (control) => (
            <span
              key={control}
              data-header-skeleton={control}
              className={HEADER_ACTION_BUTTON_CLASS}
            >
              <Skeleton
                className={control === "language" ? "h-2.5 w-4" : "size-4"}
                rounded="rounded-md"
              />
            </span>
          ),
        )}
        <span
          data-header-skeleton="profile"
          className={`${AVATAR_MENU_TRIGGER_CLASS} ${AVATAR_MENU_SIZE_CLASS}`}
        >
          <Skeleton
            className="absolute inset-0 h-full w-full"
            rounded="rounded-none"
          />
        </span>
      </div>
    </DashboardHeaderFrame>
  );
}
