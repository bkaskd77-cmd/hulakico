"use client";

import { Field, SectionNote } from "@/app/admin/(staff)/homepage/AdminFields";
import { EditableList } from "@/app/admin/(staff)/homepage/EditableList";
import { HOME_LIMITS, type HomepageContent } from "@/lib/domain/homepage-types";
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
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">Opening hours</p>
        <EditableList
          itemLabel="Line"
          items={content.openingHours}
          max={HOME_LIMITS.openingHours}
          blank={() => ""}
          onChange={(openingHours) => patch({ openingHours })}
          renderItem={(line, update) => (
            <Field label="Days and hours" value={line} placeholder="Sunday – Friday: 9:00 AM – 5:00 PM" onChange={update} />
          )}
        />
      </div>
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
      <SectionNote>Use full https:// addresses. Icons without a link stay visible but inactive.</SectionNote>
    </>
  );
}
