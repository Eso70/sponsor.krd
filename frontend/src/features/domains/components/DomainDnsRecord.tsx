"use client";

import { CopyValueField } from "@/components/shared/CopyValueField";
import { domainCopy, type DomainLocale } from "../copy";
import { domainDnsCopy } from "../dns-copy";

export function DomainDnsRecord({
  type,
  name,
  value,
  locale,
}: {
  type: "A" | "AAAA" | "TXT";
  name: string;
  value: string;
  locale: DomainLocale;
}) {
  const copy = domainCopy[locale];
  const guide = domainDnsCopy[locale];
  const copyText = {
    action: copy.copy,
    success: copy.copied,
    failure: copy.copyFailed,
  };
  return (
    <div className="theme-soft space-y-3 rounded-xl border p-3">
      <p className="text-sm font-semibold" dir="ltr">
        {type}
      </p>
      <CopyValueField
        label={type === "TXT" ? copy.txtName : guide.name}
        value={name}
        copyName={guide.name}
        copyText={copyText}
      />
      <CopyValueField
        label={type === "TXT" ? copy.txtValue : guide.value}
        value={value}
        copyName={guide.value}
        copyText={copyText}
      />
      <p className="text-xs text-slate-500">{guide.ttl}</p>
    </div>
  );
}
