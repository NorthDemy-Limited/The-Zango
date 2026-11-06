import { NextResponse } from "next/server";
import { getArticles } from "@/lib/firebase/db";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thezango.org";
  const articles = await getArticles();

  const itemsXml = articles
    .slice(0, 30)
    .map((article) => {
      const link = `${baseUrl}/article/${article.slug}`;
      const pubDate = new Date().toUTCString();
      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${article.excerpt}]]></description>
      <category><![CDATA[${article.category}]]></category>
      <author><![CDATA[${article.author.name}]]></author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Zango — Independent Sahelian Journalism</title>
    <link>${baseUrl}</link>
    <description>Authoritative investigative reporting, economic analysis, and cultural discourse from Northern Nigeria and the Sahel corridor.</description>
    <language>en-ng</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

