"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { ModalFooterActions } from "@/components/shared/ModalFooterActions";
import { CopyValueField } from "@/components/shared/CopyValueField";
import { EditorField } from "@/components/shared/EditorField";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { Tooltip } from "@/components/shared/Tooltip";
import type { TikTokAdAccount } from "../types";

interface ConnectTikTokAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (account: TikTokAdAccount) => void;
  initialAccount?: TikTokAdAccount | null;
  sponsorKrdTheme?: boolean;
}

type ConnectionTab = "direct_token" | "oauth";

export function ConnectTikTokAdModal({
  isOpen,
  onClose,
  onConnect,
  initialAccount,
  sponsorKrdTheme = false,
}: ConnectTikTokAdModalProps) {
  const [activeTab, setActiveTab] = useState<ConnectionTab>("direct_token");

  // Direct Token State
  const [advertiserId, setAdvertiserId] = useState(
    initialAccount?.advertiserId || "",
  );
  const [accessToken, setAccessToken] = useState(initialAccount?.accessToken || "");
  const [businessCenterId, setBusinessCenterId] = useState(
    initialAccount?.businessCenterId || "",
  );

  // OAuth State
  const [appId, setAppId] = useState(initialAccount?.appId || "");
  const [appSecret, setAppSecret] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/tiktok/callback`
      : "http://localhost:3011/api/auth/tiktok/callback";

  const handleDirectSubmit = async () => {
    if (!advertiserId.trim() || !accessToken.trim()) {
      toast.error("تکایە Advertiser ID و Access Token بنووسە");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/platform/tiktok/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertiserId: advertiserId.trim(),
          accessToken: accessToken.trim(),
          businessCenterId: businessCenterId.trim() || undefined,
          connectionMethod: "direct_token",
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        onConnect(result.data);
        toast.success(`هەژماری "${result.data.advertiserName}" بە سەرکەوتوویی بەسترایەوە!`);
        onClose();
      } else {
        toast.error("پەیوەندی سەرکەوتوو نەبوو", {
          description: result.error || "تکایە دڵنیابە لە دروستی زانیارییەکان",
        });
      }
    } catch (err) {
      toast.error("هەڵە لە پەیوەندی بە تیکتۆک", {
        description: err instanceof Error ? err.message : "تکایە دووبارە هەوڵبدەرەوە",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSubmit = () => {
    if (!appId.trim()) {
      toast.error("تکایە TikTok App ID بنووسە");
      return;
    }

    setIsSubmitting(true);

    // Launch official TikTok Business Marketing API OAuth authorization
    const state = Date.now().toString();
    const authUrl = `https://business-api.tiktok.com/portal/auth?app_id=${encodeURIComponent(
      appId.trim(),
    )}&state=${state}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  const isDirectFormValid = Boolean(advertiserId.trim() && accessToken.trim());
  const isOAuthFormValid = Boolean(appId.trim());

  return (
    <ManagementModal
      isOpen={isOpen}
      onClose={onClose}
      sponsorKrdTheme={sponsorKrdTheme}
      title="بەستنەوەی هەژماری تیکتۆک (TikTok Ads)"
      description="شێوازی بەستنەوەی هەژمارەکەت هەڵبژێرە بۆ بەڕێوەبردنی کەمپەین و بینینی ئامارەکان."
      footer={
        <ModalFooterActions
          submitLabel={
            activeTab === "direct_token"
              ? isSubmitting
                ? "پشکنین و بەستنەوە..."
                : "تێست و بەستنەوەی هەژمار"
              : isSubmitting
                ? "دەبەسترێتەوە..."
                : "بەستنەوە لە تیکتۆک"
          }
          submittingLabel="دەبەسترێتەوە..."
          cancelLabel="پاشگەزبوونەوە"
          submitDisabled={
            activeTab === "direct_token" ? !isDirectFormValid : !isOAuthFormValid
          }
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onSubmit={activeTab === "direct_token" ? handleDirectSubmit : handleOAuthSubmit}
        />
      }
    >
      <div className="space-y-4">
        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("direct_token")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "direct_token"
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#1c222b] dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            تۆکن و ناسنامەی ڕاستەوخۆ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("oauth")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "oauth"
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#1c222b] dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            ڕێگەی فەرمی (OAuth 2.0)
          </button>
        </div>

        {/* Tab 1: Direct Long-Term Token Method */}
        {activeTab === "direct_token" && (
          <div className="space-y-3.5 pt-1">
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-sky-800 dark:border-sky-900/30 dark:bg-sky-950/20 dark:text-sky-300">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>شێوازی خێرا و ڕاستەوخۆ بە Access Token</span>
              </div>
              <p className="mt-1 leading-5 opacity-90">
                دەتوانیت Access Token لە بەشی TikTok Developer Portal یان App Details کۆپی
                بکەیت و ڕاستەوخۆ پەیوەست ببی بە Marketing API v2.0.
              </p>
            </div>

            <EditorField
              label="Advertiser ID (ناسنامەی هەژماری ڕیکلام)"
              hint="ژمارەی هەژمارەکەت لە تیکتۆک"
              required
            >
              <ModalTextInput
                type="text"
                value={advertiserId}
                onChange={(e) => setAdvertiserId(e.target.value)}
                placeholder="نموونە: 7123456789012345678"
                className="font-mono text-xs"
              />
            </EditorField>

            <EditorField
              label="Long-Term Access Token"
              hint="تۆکنی هەمیشەیی تیکتۆک بۆ ئەپەکەت"
              required
            >
              <ModalTextInput
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Access Token لێرە بنووسە..."
                className="font-mono text-xs"
              />
            </EditorField>

            <EditorField
              label="Business Center ID (ئارەزوومەندانە)"
              hint="ناسنامەی Business Center ئەگەر هەبێت"
            >
              <div className="relative">
                <ModalTextInput
                  type="text"
                  value={businessCenterId}
                  onChange={(e) => setBusinessCenterId(e.target.value)}
                  placeholder="نموونە: 7123456789012345679"
                  className="font-mono text-xs"
                />
                <Tooltip
                  content="ئەگەر هەژمارەکەت سەر بە Business Center بێت، دەتوانیت لێرە بینوسیت"
                  side="top"
                >
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 opacity-60" />
                </Tooltip>
              </div>
            </EditorField>
          </div>
        )}

        {/* Tab 2: OAuth 2.0 Method */}
        {activeTab === "oauth" && (
          <div className="space-y-3.5 pt-1">
            <CopyValueField
              label="Advertiser redirect URL (بۆ دانان لە TikTok Developer Portal):"
              value={redirectUrl}
              copyName="Advertiser redirect URL"
              monospace
            />

            <EditorField label="TikTok App ID" required>
              <ModalTextInput
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="TikTok App ID لێرە بنووسە..."
                className="font-mono text-xs"
              />
            </EditorField>

            <EditorField label="TikTok App Secret">
              <ModalTextInput
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="TikTok App Secret لێرە بنووسە..."
                className="font-mono text-xs"
              />
            </EditorField>
          </div>
        )}
      </div>
    </ManagementModal>
  );
}
