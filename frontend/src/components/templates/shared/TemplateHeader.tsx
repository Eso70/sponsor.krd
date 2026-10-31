"use client";

import Image from "next/image";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { Fragment, memo, useState, type CSSProperties, type ReactNode } from "react";
import { usePublicLinktreeCopy, usePublicLinktreeLocale } from "@/features/business/i18n/public-linktree";
import { imageMediaCopy } from "@/components/shared/image-media-copy";
import { FullscreenImageViewer } from "@/components/shared/LazyFullscreenImageViewer";
import { PublicLinktreeBusinessSummary } from "@/components/public/PublicLinktreeBusinessSummary";
import { useTemplateMedia } from "./TemplateMediaContext";

const DEFAULT_AVATAR = "/images/DefaultAvatar.png";

export {
  STANDARD_TEMPLATE_HEADER_CLASSES,
  STANDARD_TEMPLATE_HEADER_AVATAR_SIZES,
} from "./template-header-styles";

function Wrap({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (!className && !style) {
    return <Fragment>{children}</Fragment>;
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export interface TemplateHeaderProps {
  /** Business/linktree display name. Always rendered. */
  name: string;
  verificationBadge?: boolean;
  subtitle?: string | null;
  description?: string | null;
  /** Shown when `description` is empty. Defaults to the standard Kurdish CTA copy. */
  fallbackDescription?: string;
  image?: string | null;

  textColor?: string;
  textSecondaryColor?: string;
  /** Subtitle color. Defaults to the secondary text color so it remains distinct from the name. */
  subtitleColor?: string;

  /** Outer wrapper element. `header` by default; templates that already sit inside a `<header>` can use `div`. */
  as?: "header" | "div";
  className?: string;

  /** Optional wrapper grouping the avatar and text block together, e.g. for a flex column with a shared gap. Omit for templates that lay avatar/name/subtitle/description as flat siblings. */
  contentWrapperClassName?: string;
  contentWrapperStyle?: CSSProperties;

  /** Optional wrapper around the avatar only (glow + clipping circle), e.g. `relative shrink-0`. Omit when the avatar has no separate outer box. */
  avatarOuterClassName?: string;
  avatarOuterStyle?: CSSProperties;
  /** Circular avatar clipping wrapper (size, border, shadow, backdrop, padding). */
  avatarWrapperClassName?: string;
  avatarWrapperStyle?: CSSProperties;
  /** Element painted behind the avatar wrapper, e.g. a radial glow. Positioned absolutely by the caller's className. */
  avatarGlow?: ReactNode;
  /** Applied to the `<Image>` itself. */
  avatarClassName?: string;
  avatarStyle?: CSSProperties;
  /** Intrinsic pixel size for `next/image` `fill` sizing hints. */
  avatarSizes?: string;
  avatarPriority?: boolean;
  /** Skips Next.js image optimization for the avatar. Matches the previous LinktreeHeader behavior for templates that need it. */
  avatarUnoptimized?: boolean;

  /** Optional wrapper around name/subtitle/description/children, e.g. a `space-y-*` text column. Omit for flat siblings. */
  textWrapperClassName?: string;
  textWrapperStyle?: CSSProperties;

  nameClassName?: string;
  nameStyle?: CSSProperties;
  subtitleClassName?: string;
  subtitleStyle?: CSSProperties;

  /** Wraps the description text. Lets templates render it as a plain paragraph or a badge/pill. */
  descriptionWrapperClassName?: string;
  descriptionWrapperStyle?: CSSProperties;
  descriptionClassName?: string;
  descriptionStyle?: CSSProperties;

  /** Extra content rendered after the description, e.g. a template-specific indicator. */
  children?: ReactNode;
}

/**
 * Reusable profile header for public linktree templates: avatar, name,
 * optional subtitle, and description. Every visual aspect (sizes, spacing,
 * colors, avatar treatment, and optional nesting levels) is customizable via
 * className/style props so each template can reproduce its own layout, while
 * the structure, fallback image handling, and copy defaults live in one
 * place. `children` extends the header with template-specific content
 * without forking the component.
 */
export const TemplateHeader = memo(function TemplateHeader({
  name,
  verificationBadge = false,
  subtitle,
  description,
  fallbackDescription,
  image,
  textColor = "#ffffff",
  textSecondaryColor = "rgba(255, 255, 255, 0.8)",
  subtitleColor,
  as = "header",
  className = "",
  contentWrapperClassName,
  contentWrapperStyle,
  avatarOuterClassName,
  avatarOuterStyle,
  avatarWrapperClassName = "",
  avatarWrapperStyle,
  avatarGlow,
  avatarClassName = "",
  avatarStyle,
  avatarSizes = "128px",
  avatarPriority = true,
  avatarUnoptimized = false,
  textWrapperClassName,
  textWrapperStyle,
  nameClassName = "",
  nameStyle,
  subtitleClassName = "",
  subtitleStyle,
  descriptionWrapperClassName,
  descriptionWrapperStyle,
  descriptionClassName = "",
  descriptionStyle,
  children,
}: TemplateHeaderProps) {
  const copy = usePublicLinktreeCopy();
  const locale = usePublicLinktreeLocale();
  const mediaCopy = imageMediaCopy(locale);
  const { hasBanner, onAction, seo } = useTemplateMedia();
  const [logoOpen, setLogoOpen] = useState(false);
  const imageSrc = image || DEFAULT_AVATAR;
  const trimmedSubtitle = subtitle?.trim() || "";
  const descriptionText = description?.trim();
  const resolvedDescription = descriptionText || fallbackDescription || copy.description;
  const resolvedSubtitleColor = subtitleColor || textSecondaryColor;

  const Wrapper = as;

  const descriptionNode = (
    <p className={descriptionClassName} style={{ color: textSecondaryColor, ...descriptionStyle }}>
      {resolvedDescription}
    </p>
  );

  const avatarNode = (
    <Wrap className={avatarOuterClassName} style={avatarOuterStyle}>
      {avatarGlow}
      <div className={`${avatarWrapperClassName} relative`} style={avatarWrapperStyle}>
        <Image
          src={imageSrc}
          alt={name || "Profile"}
          fill
          sizes={avatarSizes}
          priority={avatarPriority}
          unoptimized={avatarUnoptimized}
          className={`object-cover ${avatarClassName}`.trim()}
          style={avatarStyle}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith(DEFAULT_AVATAR)) {
              target.src = DEFAULT_AVATAR;
            }
          }}
        />
        {image && <button type="button" data-image-preview-trigger aria-label={`${mediaCopy.preview}: ${mediaCopy.logo}`}
          onClick={() => { setLogoOpen(true); onAction?.("image-open", -1); }}
          className="absolute inset-0 z-10 cursor-zoom-in rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" />}
      </div>
    </Wrap>
  );

  const textNode = (
    <Wrap className={textWrapperClassName} style={textWrapperStyle}>
      <h1 className={nameClassName} style={{ color: textColor, ...nameStyle }}>
        {verificationBadge ? (
          <span className="inline-flex max-w-full items-center gap-[0.2em] align-middle">
            <span className="min-w-0">{name}</span>
            <VerificationBadge label={copy.verificationBadge} />
          </span>
        ) : name}
      </h1>

      {trimmedSubtitle ? (
        <p
          className={subtitleClassName}
          style={{ color: resolvedSubtitleColor, ...subtitleStyle }}
        >
          {trimmedSubtitle}
        </p>
      ) : null}

      {descriptionWrapperClassName ? (
        <div className={descriptionWrapperClassName} style={descriptionWrapperStyle}>
          {descriptionNode}
        </div>
      ) : (
        descriptionNode
      )}

      <PublicLinktreeBusinessSummary seo={seo} locale={locale} color={textSecondaryColor} />
      {children}
    </Wrap>
  );

  return (
    <Wrapper className={className} data-template-avatar-header>
      <Wrap className={contentWrapperClassName} style={contentWrapperStyle}>
        {hasBanner ? <div data-template-banner-logo className="relative z-20 flex justify-center"
          style={{ marginTop: -(Number.parseInt(avatarSizes, 10) || 112) / 2 }}>{avatarNode}</div> : avatarNode}
        {textNode}
      </Wrap>
      {logoOpen && <FullscreenImageViewer images={[imageSrc]} title={mediaCopy.logo}
        labels={{ close: mediaCopy.close, previous: mediaCopy.back, next: mediaCopy.next, zoomIn: mediaCopy.zoomIn, zoomOut: mediaCopy.zoomOut }} onClose={() => setLogoOpen(false)} />}
    </Wrapper>
  );
});
