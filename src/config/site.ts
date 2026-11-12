export const SITE_CONFIG = {
  name: "The Zango",
  description: "Your trusted voice for Northern Nigeria & African innovation, reporting, and commerce.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thezango.org",
  socials: {
    twitter: {
      name: "X (Twitter)",
      handle: "@thezangong",
      url: "https://x.com/thezangong",
    },
    linkedin: {
      name: "LinkedIn",
      handle: "thezangong",
      url: "https://www.linkedin.com/company/thezangong/",
    },
    instagram: {
      name: "Instagram",
      handle: "@thezangong",
      url: "https://www.instagram.com/thezangong",
    },
    facebook: {
      name: "Facebook",
      handle: "thezango",
      url: "https://facebook.com",
    },
    youtube: {
      name: "YouTube",
      handle: "@thezangong",
      url: "https://youtube.com",
    },
  },
} as const;

