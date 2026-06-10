import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/auth/",
        "/survey/",
        "/results/",
        "/design/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/email-verified",
      ],
    },
    sitemap: "https://www.socialtwin.site/sitemap.xml",
  };
}
