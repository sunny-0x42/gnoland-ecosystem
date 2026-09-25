import type { Metadata } from "next";

export const SITE_URL = "https://gnoland-ecosystem.vercel.app";
export const SITE_NAME = "Gnoland Ecosystem Tracker";
export const SITE_DESCRIPTION =
  "A public directory of projects building on Gno.land, grouped by category. Realms, packages, wallets, and off-chain tools on gnoland-1.";

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  index?: boolean;
}): Metadata {
  const socialTitle = input.absoluteTitle ? input.title : `${input.title} · ${SITE_NAME}`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    robots:
      input.index === false
        ? { index: false, follow: false }
        : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      title: socialTitle,
      description: input.description,
      url: input.path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
    },
  };
}
