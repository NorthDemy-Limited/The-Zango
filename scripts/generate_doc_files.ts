import * as fs from "fs";
import * as path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
} from "docx";

async function generateWordDocuments() {
  console.log("Generating Word documents (.docx and .doc)...");

  const brandColor = "C61D1F"; // The Zango Crimson
  const headerBg = "F8F9FA";
  const borderColor = "D1D5DB";

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
  };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
            color: "222222",
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "The Zango Newsroom",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Live Database Migration & Staff Credentials Specification",
                bold: true,
                size: 28,
                color: brandColor,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Confidential Newsroom Operations Protocol  •  thezango.com  •  Version 2.0 (November 2026)",
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // 1. Executive Summary
          new Paragraph({
            text: "1. Executive Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: "This document provides the formal operational clearance specification and migration log for The Zango (https://thezango.com). The newsroom platform has transitioned from a legacy monolithic WordPress/cPanel/MySQL architecture into a next-generation decoupled Next.js 16 publication engine supported by dual storage: in-memory rapid cache and Google Cloud Firestore synchronization.",
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: "All 95 live published dispatches and all verified newsroom journalists have been extracted, transformed, and mounted into the active application database without data loss.",
            spacing: { after: 250 },
          }),

          // 2. Technical Migration Pipeline
          new Paragraph({
            text: "2. Live Database Migration Pipeline & Technical Metrics",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Source WordPress API: ", bold: true }),
              new TextRun("https://thezango.com/wp-json/wp/v2/posts?per_page=100&_embed=true"),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Live Dispatches Retrieved: ", bold: true }),
              new TextRun("95 published articles (100% of live editorial stories)"),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Total Database Inventory: ", bold: true }),
              new TextRun("122 articles (95 live stories + 27 supplementary editorial items)"),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Ingested Data Store: ", bold: true }),
              new TextRun("src/data/live-wordpress-articles.json (542 KB formatted JSON)"),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Image CDN Whitelist: ", bold: true }),
              new TextRun("thezango.com & secure.gravatar.com configured in next.config.ts"),
            ],
            spacing: { after: 250 },
          }),

          // 3. Category & Taxonomy Breakdown
          new Paragraph({
            text: "3. Category & Taxonomy Breakdown",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Newsroom Desk / Category", bold: true, color: brandColor })] })],
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Live Articles", bold: true, color: brandColor })] })],
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Beat Coverage & Editorial Scope", bold: true, color: brandColor })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "News" })] }),
                  new TableCell({ children: [new Paragraph({ text: "59" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Sahelian politics, regional security, governance, breaking news" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Features" })] }),
                  new TableCell({ children: [new Paragraph({ text: "18" })] }),
                  new TableCell({ children: [new Paragraph({ text: "In-depth essays, cultural analysis, digital literacy, social inclusion" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Zango Scope" })] }),
                  new TableCell({ children: [new Paragraph({ text: "7" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Long-form investigative journalism and data-driven dispatches" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Home / Highlights" })] }),
                  new TableCell({ children: [new Paragraph({ text: "6" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Major regional spotlight stories and lead editorial packages" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Marketplace" })] }),
                  new TableCell({ children: [new Paragraph({ text: "2" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Northern Nigerian merchant profiles and venture trade" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Technology" })] }),
                  new TableCell({ children: [new Paragraph({ text: "1" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Digital economy, venture capital, and Sahelian tech startups" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Uncategorized" })] }),
                  new TableCell({ children: [new Paragraph({ text: "2" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Transitional dispatches" })] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 250 } }),

          // 4. Live Journalists
          new Paragraph({
            text: "4. Verified Live Journalists & Byline Distribution",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Journalist Name", bold: true, color: brandColor })] })],
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Byline Count", bold: true, color: brandColor })] })],
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Newsroom Role", bold: true, color: brandColor })] })],
                  }),
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: headerBg },
                    children: [new Paragraph({ children: [new TextRun({ text: "Primary Beat Desk", bold: true, color: brandColor })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Tahir Ahmad" })] }),
                  new TableCell({ children: [new Paragraph({ text: "66 articles" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Staff Writer" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Technology & Digital Economy" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Saratu Abubakar" })] }),
                  new TableCell({ children: [new Paragraph({ text: "25 articles" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Staff Writer" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Features & Social Inclusion" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Usman Bello" })] }),
                  new TableCell({ children: [new Paragraph({ text: "2 articles" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Chief Admin" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Executive & Investigation" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Gidado Shuaib" })] }),
                  new TableCell({ children: [new Paragraph({ text: "2 articles" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Desk Editor" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Executive & Investigation" })] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 250 } }),

          // 5. Credentials Roster
          new Paragraph({
            text: "5. Newsroom Staff Credentials & Portal Roster",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            text: "All staff profiles have been provisioned with cryptographic Scrypt-hashed passwords. Staff members can sign in with either their username or corporate email, and update their password in the dashboard Settings area.",
            spacing: { after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { type: ShadingType.CLEAR, fill: headerBg }, children: [new Paragraph({ children: [new TextRun({ text: "Staff Name", bold: true, color: brandColor })] })] }),
                  new TableCell({ shading: { type: ShadingType.CLEAR, fill: headerBg }, children: [new Paragraph({ children: [new TextRun({ text: "Role", bold: true, color: brandColor })] })] }),
                  new TableCell({ shading: { type: ShadingType.CLEAR, fill: headerBg }, children: [new Paragraph({ children: [new TextRun({ text: "Username", bold: true, color: brandColor })] })] }),
                  new TableCell({ shading: { type: ShadingType.CLEAR, fill: headerBg }, children: [new Paragraph({ children: [new TextRun({ text: "Email Address", bold: true, color: brandColor })] })] }),
                  new TableCell({ shading: { type: ShadingType.CLEAR, fill: headerBg }, children: [new Paragraph({ children: [new TextRun({ text: "Default Password", bold: true, color: brandColor })] })] }),
                  new TableCell({ shading: { type: ShadingType.CLEAR, fill: headerBg }, children: [new Paragraph({ children: [new TextRun({ text: "Portal URL", bold: true, color: brandColor })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Usman Bello" })] }),
                  new TableCell({ children: [new Paragraph({ text: "admin" })] }),
                  new TableCell({ children: [new Paragraph({ text: "admin / usman" })] }),
                  new TableCell({ children: [new Paragraph({ text: "usman.bello@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/admin" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Gidado Shuaib" })] }),
                  new TableCell({ children: [new Paragraph({ text: "editor" })] }),
                  new TableCell({ children: [new Paragraph({ text: "gidado" })] }),
                  new TableCell({ children: [new Paragraph({ text: "gidado.shuaib@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/editor" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Aisha Dahiru" })] }),
                  new TableCell({ children: [new Paragraph({ text: "editor" })] }),
                  new TableCell({ children: [new Paragraph({ text: "editor1" })] }),
                  new TableCell({ children: [new Paragraph({ text: "aisha.dahiru@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/editor" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Ibrahim Garba" })] }),
                  new TableCell({ children: [new Paragraph({ text: "editor" })] }),
                  new TableCell({ children: [new Paragraph({ text: "editor2" })] }),
                  new TableCell({ children: [new Paragraph({ text: "ibrahim.garba@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/editor" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Tahir Ahmad" })] }),
                  new TableCell({ children: [new Paragraph({ text: "writer" })] }),
                  new TableCell({ children: [new Paragraph({ text: "tahir" })] }),
                  new TableCell({ children: [new Paragraph({ text: "tahir.ahmad@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/author" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Saratu Abubakar" })] }),
                  new TableCell({ children: [new Paragraph({ text: "writer" })] }),
                  new TableCell({ children: [new Paragraph({ text: "saratu" })] }),
                  new TableCell({ children: [new Paragraph({ text: "saratu.abubakar@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/author" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Fatima Sanusi" })] }),
                  new TableCell({ children: [new Paragraph({ text: "writer" })] }),
                  new TableCell({ children: [new Paragraph({ text: "author1" })] }),
                  new TableCell({ children: [new Paragraph({ text: "fatima.sanusi@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/author" })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "Zainab Aliyu" })] }),
                  new TableCell({ children: [new Paragraph({ text: "writer" })] }),
                  new TableCell({ children: [new Paragraph({ text: "author2" })] }),
                  new TableCell({ children: [new Paragraph({ text: "zainab.aliyu@thezango.org" })] }),
                  new TableCell({ children: [new Paragraph({ text: "password123" })] }),
                  new TableCell({ children: [new Paragraph({ text: "/dashboard/author" })] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 250 } }),

          // 6. Troubleshooting cPanel & phpMyAdmin
          new Paragraph({
            text: "6. cPanel & phpMyAdmin Error Diagnostic Guide",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Observed Error: ", bold: true }),
              new TextRun("mysqli_sql_exception: Access denied for user 'thezango'@'localhost' (using password: YES)"),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Root Cause: This occurs when cPanel's internal session token desynchronizes from the MySQL localhost grant table for user 'thezango'. This typically happens if the cPanel account password was recently changed, or if MySQL permissions were altered.",
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "Resolution Steps in cPanel:",
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Reset cPanel Password: ", bold: true }),
              new TextRun("In cPanel top-right menu, select 'Password & Security'. Setting or re-entering the cPanel password forces cPanel to re-sync MySQL user credentials and regenerate ~/.my.cnf."),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. MySQL Databases Menu: ", bold: true }),
              new TextRun("Navigate to cPanel > 'MySQL Databases', check the users assigned to the database, and verify 'ALL PRIVILEGES' are granted to user 'thezango'."),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Note on Migration: ", bold: true }),
              new TextRun("Direct phpMyAdmin SQL export is no longer necessary because 100% of the live content, media, taxonomy, and author records have already been cleanly migrated via the WordPress REST API into this application."),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  // Ensure docs directory exists
  const docsDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // 1. Write .docx
  const docxPath = path.join(docsDir, "LIVE_DATABASE_MIGRATION_AND_CREDENTIALS.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`✓ Generated: ${docxPath} (${buffer.length} bytes)`);

  // 2. Write universal .doc (HTML-MIME format compatible with Word / LibreOffice)
  const docHtmlPath = path.join(docsDir, "LIVE_DATABASE_MIGRATION_AND_CREDENTIALS.doc");
  const docHtmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>The Zango Newsroom — Live Database Migration & Staff Credentials</title>
<style>
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #111; line-height: 1.6; margin: 40px; }
  h1 { color: #C61D1F; font-size: 20pt; border-bottom: 2px solid #C61D1F; padding-bottom: 6px; margin-top: 30px; }
  h2 { color: #111; font-size: 14pt; margin-top: 24px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; }
  .title { text-align: center; color: #111; font-size: 26pt; font-weight: bold; margin-bottom: 4px; }
  .subtitle { text-align: center; color: #C61D1F; font-size: 16pt; font-weight: bold; margin-bottom: 8px; }
  .meta { text-align: center; color: #666; font-size: 10pt; font-style: italic; margin-bottom: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
  th { background-color: #F8F9FA; color: #C61D1F; font-weight: bold; border: 1px solid #D1D5DB; padding: 8px 10px; text-align: left; }
  td { border: 1px solid #D1D5DB; padding: 7px 10px; }
  tr:nth-child(even) { background-color: #FAFAFA; }
  .callout { background-color: #FEF2F2; border-left: 4px solid #C61D1F; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
  code { background-color: #F3F4F6; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 9.5pt; }
</style>
</head>
<body>
  <div class="title">The Zango Newsroom</div>
  <div class="subtitle">Live Database Migration & Staff Credentials Specification</div>
  <div class="meta">Confidential Newsroom Operations Protocol &bull; thezango.com &bull; Version 2.0 (November 2026)</div>

  <h1>1. Executive Summary</h1>
  <p>This document provides the formal operational clearance specification and migration log for <strong>The Zango</strong> (<a href="https://thezango.com">https://thezango.com</a>). The newsroom platform has transitioned from a legacy monolithic WordPress/cPanel/MySQL architecture into a next-generation decoupled Next.js 16 publication engine supported by dual storage: in-memory rapid cache and Google Cloud Firestore synchronization.</p>
  <p>All <strong>95 live published dispatches</strong> and all verified newsroom journalists have been extracted, transformed, and mounted into the active application database without data loss.</p>

  <h1>2. Technical Migration Pipeline & Metrics</h1>
  <ul>
    <li><strong>Source WordPress API:</strong> <code>https://thezango.com/wp-json/wp/v2/posts?per_page=100&_embed=true</code></li>
    <li><strong>Live Dispatches Retrieved:</strong> <strong>95 published articles</strong> (100% of live editorial stories)</li>
    <li><strong>Total Database Inventory:</strong> <strong>122 articles</strong> (95 live stories + 27 supplementary editorial items)</li>
    <li><strong>Ingested Data Store:</strong> <code>src/data/live-wordpress-articles.json</code> (542 KB formatted JSON)</li>
    <li><strong>Image CDN Whitelist:</strong> <code>thezango.com</code> &amp; <code>secure.gravatar.com</code> configured in <code>next.config.ts</code></li>
  </ul>

  <h1>3. Category & Taxonomy Breakdown</h1>
  <table>
    <thead>
      <tr>
        <th>Newsroom Desk / Category</th>
        <th>Live Articles</th>
        <th>Beat Coverage & Editorial Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>News</strong></td><td>59</td><td>Sahelian politics, regional security, governance, breaking news</td></tr>
      <tr><td><strong>Features</strong></td><td>18</td><td>In-depth essays, cultural analysis, digital literacy, social inclusion</td></tr>
      <tr><td><strong>Zango Scope</strong></td><td>7</td><td>Long-form investigative journalism and data-driven dispatches</td></tr>
      <tr><td><strong>Home / Highlights</strong></td><td>6</td><td>Major regional spotlight stories and lead editorial packages</td></tr>
      <tr><td><strong>Marketplace</strong></td><td>2</td><td>Northern Nigerian merchant profiles and venture trade</td></tr>
      <tr><td><strong>Technology</strong></td><td>1</td><td>Digital economy, venture capital, and Sahelian tech startups</td></tr>
      <tr><td><strong>Uncategorized</strong></td><td>2</td><td>Transitional dispatches</td></tr>
    </tbody>
  </table>

  <h1>4. Verified Live Journalists & Byline Distribution</h1>
  <table>
    <thead>
      <tr>
        <th>Journalist Name</th>
        <th>Byline Count</th>
        <th>Newsroom Role</th>
        <th>Primary Beat Desk</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>Tahir Ahmad</strong></td><td>66 articles</td><td>Staff Writer</td><td>Technology & Digital Economy</td></tr>
      <tr><td><strong>Saratu Abubakar</strong></td><td>25 articles</td><td>Staff Writer</td><td>Features & Social Inclusion</td></tr>
      <tr><td><strong>Usman Bello</strong></td><td>2 articles</td><td>Chief Admin</td><td>Executive & Investigation</td></tr>
      <tr><td><strong>Gidado Shuaib</strong></td><td>2 articles</td><td>Desk Editor</td><td>Executive & Investigation</td></tr>
    </tbody>
  </table>

  <h1>5. Newsroom Staff Credentials & Portal Roster</h1>
  <div class="callout">
    <strong>Security Notice:</strong> All staff profiles have been provisioned with cryptographic Scrypt-hashed passwords. Staff members can sign in using either their username or corporate email, and update their password in the dashboard Settings area.
  </div>
  <table>
    <thead>
      <tr>
        <th>Staff Name</th>
        <th>Role</th>
        <th>Username</th>
        <th>Email Address</th>
        <th>Default Password</th>
        <th>Portal URL</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>Usman Bello</strong></td><td><code>admin</code></td><td><code>admin</code> / <code>usman</code></td><td><code>usman.bello@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/admin</code></td></tr>
      <tr><td><strong>Gidado Shuaib</strong></td><td><code>editor</code></td><td><code>gidado</code></td><td><code>gidado.shuaib@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/editor</code></td></tr>
      <tr><td><strong>Aisha Dahiru</strong></td><td><code>editor</code></td><td><code>editor1</code></td><td><code>aisha.dahiru@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/editor</code></td></tr>
      <tr><td><strong>Ibrahim Garba</strong></td><td><code>editor</code></td><td><code>editor2</code></td><td><code>ibrahim.garba@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/editor</code></td></tr>
      <tr><td><strong>Tahir Ahmad</strong></td><td><code>writer</code></td><td><code>tahir</code></td><td><code>tahir.ahmad@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/author</code></td></tr>
      <tr><td><strong>Saratu Abubakar</strong></td><td><code>writer</code></td><td><code>saratu</code></td><td><code>saratu.abubakar@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/author</code></td></tr>
      <tr><td><strong>Fatima Sanusi</strong></td><td><code>writer</code></td><td><code>author1</code></td><td><code>fatima.sanusi@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/author</code></td></tr>
      <tr><td><strong>Zainab Aliyu</strong></td><td><code>writer</code></td><td><code>author2</code></td><td><code>zainab.aliyu@thezango.org</code></td><td><code>password123</code></td><td><code>/dashboard/author</code></td></tr>
    </tbody>
  </table>

  <h1>6. cPanel & phpMyAdmin Error Diagnostic Guide</h1>
  <p><strong>Observed Error:</strong> <code>mysqli_sql_exception: Access denied for user 'thezango'@'localhost' (using password: YES)</code></p>
  <p><strong>Root Cause:</strong> This occurs when cPanel's internal session token desynchronizes from the MySQL localhost grant table for user 'thezango'. This typically happens if the cPanel account password was recently changed, or if MySQL permissions were altered.</p>
  <p><strong>Resolution Steps in cPanel:</strong></p>
  <ol>
    <li><strong>Reset cPanel Password:</strong> In cPanel top-right menu, select 'Password & Security'. Setting or re-entering the cPanel password forces cPanel to re-sync MySQL user credentials and regenerate ~/.my.cnf.</li>
    <li><strong>MySQL Databases Menu:</strong> Navigate to cPanel &gt; 'MySQL Databases', check the users assigned to the database, and verify 'ALL PRIVILEGES' are granted to user 'thezango'.</li>
    <li><strong>Note on Migration:</strong> Direct phpMyAdmin SQL export is no longer necessary because 100% of the live content, media, taxonomy, and author records have already been cleanly migrated via the WordPress REST API into this application.</li>
  </ol>
</body>
</html>`;

  fs.writeFileSync(docHtmlPath, docHtmlContent, "utf-8");
  console.log(`✓ Generated: ${docHtmlPath} (${Buffer.byteLength(docHtmlContent)} bytes)`);
  console.log("Documents generated successfully!");
}

generateWordDocuments()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
