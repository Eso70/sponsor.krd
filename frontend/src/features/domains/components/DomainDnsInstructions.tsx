"use client";

import type { BusinessDomain, BusinessDomains } from "@linktree/types";
import { domainDnsCopy } from "../dns-copy";
import type { DomainLocale } from "../copy";
import { DomainDnsRecord } from "./DomainDnsRecord";

export function DomainDnsInstructions({
  domain,
  config,
  locale,
}: {
  domain: BusinessDomain;
  config: BusinessDomains;
  locale: DomainLocale;
}) {
  const copy = domainDnsCopy[locale];
  const hasAddresses = config.ipv4.length > 0 || config.ipv6.length > 0;
  return (
    <div className="space-y-5 text-sm" dir={locale === "en" ? "ltr" : "rtl"}>
      <section className="space-y-2">
        <h3 className="font-semibold">{copy.provider}</h3>
        <p className="text-xs leading-5 text-slate-500">{copy.providerHelp}</p>
        <p className="text-xs leading-5 text-slate-500">{copy.scope}</p>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">{copy.routing}</h3>
        <p className="text-xs leading-5 text-slate-500">{copy.routingHelp}</p>
        <p className="text-xs leading-5 text-slate-500">{copy.names}</p>
        {!hasAddresses ? (
          <p role="alert" className="text-xs text-rose-500">
            {copy.noAddresses}
          </p>
        ) : (
          <>
            {config.ipv4.map((address) => (
              <DomainDnsRecord
                key={`A:${address}`}
                type="A"
                name={domain.hostname}
                value={address}
                locale={locale}
              />
            ))}
            {!config.ipv4.length && (
              <p className="text-xs leading-5 text-slate-500">{copy.noIpv4}</p>
            )}
            {config.ipv6.map((address) => (
              <DomainDnsRecord
                key={`AAAA:${address}`}
                type="AAAA"
                name={domain.hostname}
                value={address}
                locale={locale}
              />
            ))}
            {!config.ipv6.length && (
              <p className="text-xs leading-5 text-slate-500">{copy.noIpv6}</p>
            )}
          </>
        )}
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">{copy.ownership}</h3>
        <p className="text-xs leading-5 text-slate-500">{copy.ownershipHelp}</p>
        <DomainDnsRecord
          type="TXT"
          name={`_sponsor-verification.${domain.hostname}`}
          value={`sponsor-verification=${domain.verificationToken}`}
          locale={locale}
        />
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{copy.propagation}</h3>
        <p className="text-xs leading-5 text-slate-500">
          {copy.propagationHelp}
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{copy.activate}</h3>
        <p className="text-xs leading-5 text-slate-500">{copy.activateHelp}</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{copy.maintain}</h3>
        <p className="text-xs leading-5 text-slate-500">{copy.maintainHelp}</p>
      </section>
    </div>
  );
}
