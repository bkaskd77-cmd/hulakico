export const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok", "linkedin", "youtube"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinks = Record<SocialNetwork, string>;
