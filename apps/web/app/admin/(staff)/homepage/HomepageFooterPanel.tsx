"use client";

import { Field } from "@/app/admin/(staff)/homepage/HomepageListPanels";
import type { HomepageContent } from "@/lib/data/homepage-content";
import { SOCIAL_NETWORKS, type SocialNetwork } from "@/lib/domain/social";

const NETWORK_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook URL",
  instagram: "Instagram URL",
  tiktok: "TikTok URL",
  linkedin: "LinkedIn URL",
  youtube: "YouTube URL",
};

/** Footer tab: tagline, opening hours, social links (icons without a link show as inactive). */
export function HomepageFooterPanel({
  content,
  patch,
}: {
  content: HomepageContent;
  patch: (partial: Partial<HomepageContent>) => void;
}) {
  return (
    <>
      <Field label="Footer tagline" value={content.footerTagline} onChange={(v) => patch({ footerTagline: v })} rows={3} />
      <Field
        label="Opening hours (one per line)"
        value={content.openingHours.join("\n")}
        onChange={(v) => patch({ openingHours: v.split("\n").map((line) => line.trim()).filter(Boolean) })}
        rows={3}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {SOCIAL_NETWORKS.map((network) => (
          <Field
            key={network}
            label={NETWORK_LABELS[network]}
            value={content.socialLinks[network]}
            onChange={(v) => patch({ socialLinks: { ...content.socialLinks, [network]: v } })}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">
        Use full https:// addresses. Icons without a link stay visible but inactive.
      </p>
    </>
  );
}
