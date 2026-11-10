import { spawn, ChildProcess } from "child_process";
import { getOrCreateUserProfile, getUserProfile, setUserRole } from "../src/lib/firebase/db";

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkServerHealth(retries = 30, interval = 1000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status === 200 || res.status === 307) {
        return true;
      }
    } catch {
      // server not ready yet
    }
    await wait(interval);
  }
  return false;
}

async function runTestSuite() {
  console.log("\n================================================================================");
  console.log("🚀 THE ZANGO PLATFORM — COMPREHENSIVE END-TO-END SYSTEM INTEGRATION TEST");
  console.log("================================================================================\n");

  let serverProcess: ChildProcess | null = null;
  let allPassed = true;
  const results: { suite: string; status: "PASS" | "FAIL"; details: string }[] = [];

  const record = (suite: string, passed: boolean, details: string) => {
    if (!passed) allPassed = false;
    results.push({ suite, status: passed ? "PASS" : "FAIL", details });
    console.log(`[${passed ? "✓ PASS" : "✗ FAIL"}] ${suite}: ${details}`);
  };

  try {
    // --------------------------------------------------------------------------
    // START PRODUCTION SERVER
    // --------------------------------------------------------------------------
    console.log(`Starting production Next.js server on port ${PORT}...`);
    serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: "pipe",
    });

    const isReady = await checkServerHealth();
    if (!isReady) {
      throw new Error(`Production server failed to respond on ${BASE_URL} within timeout.`);
    }
    console.log(`✓ Production server is online and healthy at ${BASE_URL}\n`);

    // --------------------------------------------------------------------------
    // SUITE 1: Public Web Pages & Navigation Routes
    // --------------------------------------------------------------------------
    console.log("--- SUITE 1: Public Web Pages & Navigation Routes ---");
    const routesToTest = [
      { path: "/", expectedText: "The Zango" },
      { path: "/category/news", expectedText: "News" },
      { path: "/category/business", expectedText: "Business" },
      { path: "/trending", expectedText: "Trending" },
      { path: "/categories", expectedText: "Categories" },
      { path: "/scope", expectedText: "Scope" },
      { path: "/marketplace", expectedText: "Marketplace" },
      { path: "/login", expectedText: "Newsroom Staff Portal" },
      { path: "/dashboard/author", expectedText: "Writer Studio" },
      { path: "/dashboard/editor", expectedText: "Desk Editor" },
      { path: "/dashboard/admin", expectedText: "Chief Editor" },
      { path: "/feed.xml", expectedText: "xml" },
      { path: "/sitemap.xml", expectedText: "urlset" },
    ];

    for (const r of routesToTest) {
      const res = await fetch(`${BASE_URL}${r.path}`);
      const text = await res.text();
      const statusOk = res.status === 200;
      const contentOk = text.toLowerCase().includes(r.expectedText.toLowerCase());
      record(
        `Route ${r.path}`,
        statusOk && contentOk,
        `HTTP ${res.status}, verified content containing '${r.expectedText}'`
      );
    }

    // --------------------------------------------------------------------------
    // SUITE 2: Public Data & Reader Interaction APIs
    // --------------------------------------------------------------------------
    console.log("\n--- SUITE 2: Public Data & Reader Interaction APIs ---");
    // 2.1 GET /api/articles
    const articlesRes = await fetch(`${BASE_URL}/api/articles`);
    const articlesData = await articlesRes.json();
    const articlesValid = articlesRes.status === 200 && Array.isArray(articlesData.articles) && articlesData.articles.length > 0;
    record(
      "API: GET /api/articles",
      articlesValid,
      `Returned ${articlesData.articles?.length || 0} published editorial dispatches`
    );

    // 2.2 GET /api/categories
    const categoriesRes = await fetch(`${BASE_URL}/api/categories`);
    const categoriesData = await categoriesRes.json();
    const categoriesValid = categoriesRes.status === 200 && Array.isArray(categoriesData.categories);
    record(
      "API: GET /api/categories",
      categoriesValid,
      `Returned ${categoriesData.categories?.length || 0} active newsroom categories`
    );

    // 2.3 POST /api/newsletter
    const testSubscriberEmail = `reader.${Date.now()}@thezango-test.org`;
    const newsletterRes = await fetch(`${BASE_URL}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testSubscriberEmail }),
    });
    const newsletterData = await newsletterRes.json();
    record(
      "API: POST /api/newsletter",
      newsletterRes.status === 200 && newsletterData.success,
      `Subscribed test reader ${testSubscriberEmail}`
    );

    // 2.4 GET & POST /api/comments
    const sampleSlug = "capital-has-many-faces-deal-has-a-price";
    const postCommentRes = await fetch(`${BASE_URL}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleSlug: sampleSlug,
        authorName: "System E2E Tester",
        content: "Automated verification of reader engagement and comment moderation pipeline.",
      }),
    });
    const postCommentData = await postCommentRes.json();
    record(
      "API: POST /api/comments",
      (postCommentRes.status === 200 || postCommentRes.status === 201) && postCommentData.success,
      `Submitted reader comment for dispatch slug '${sampleSlug}'`
    );

    // --------------------------------------------------------------------------
    // SUITE 3: Editorial Publishing Pipeline (Author -> Editor Review -> Live Article)
    // --------------------------------------------------------------------------
    console.log("\n--- SUITE 3: End-to-End Editorial Publishing Flow ---");
    const testTitle = `Investigative Dispatch: Northern Agritech Frontiers ${Date.now()}`;
    const testExcerpt = "Inside the bold capital expansion powering automated cold chains and grain storage from Kano to Katsina.";
    const testContent = "Across Northern Nigeria, agricultural technology infrastructure is undergoing a historic transformation. Founders and institutional investors are deploying IoT sensors and solar-powered storage across regional trade hubs to eliminate post-harvest losses. This comprehensive investigation traces the capital flow and regulatory evolution shaping the Sahara trade corridor.";

    // Step 3.1: Author Submits Pitch
    const authorRes = await fetch(`${BASE_URL}/api/writer/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: testTitle,
        category: "Technology",
        tags: ["Agritech", "Kano", "Investigative", "Venture"],
        excerpt: testExcerpt,
        content: testContent,
        authorName: "Fatima Sanusi",
        authorEmail: "fatima.sanusi@thezango.org",
        coverImage: "/assets/hero-featured.jpg",
        isBreaking: true,
      }),
    });
    const authorData = await authorRes.json();
    const submissionCreated = (authorRes.status === 200 || authorRes.status === 201) && authorData.submission?.id;
    record(
      "Editorial: Writer Manuscript Submission",
      Boolean(submissionCreated),
      `Pitch registered with ID '${authorData.submission?.id}', Status: ${authorData.submission?.status}`
    );

    // Step 3.2: Editor Review Queue Inspection
    const editorQueueRes = await fetch(`${BASE_URL}/api/editor/submissions`);
    const editorQueueData = await editorQueueRes.json();
    const foundInQueue = Array.isArray(editorQueueData.submissions) &&
      editorQueueData.submissions.some((s: { id?: string; title?: string }) => s.id === authorData.submission?.id || s.title === testTitle);
    record(
      "Editorial: Desk Editor Review Queue",
      Boolean(foundInQueue),
      `Manuscript verified in Desk Editor's pending review queue`
    );

    // Step 3.3: Editor Approval & Live Publication
    const submissionId = authorData.submission?.id;
    const approveRes = await fetch(`${BASE_URL}/api/editor/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        status: "approved",
        isBreaking: true,
      }),
    });
    const approveData = await approveRes.json();
    record(
      "Editorial: Desk Editor Approval & Publication",
      (approveRes.status === 200 || approveRes.status === 201) && (approveData.success || approveData.submission?.status === "approved" || approveData.article),
      `Approved manuscript '${submissionId}' and promoted to live published article`
    );

    // Step 3.4: Verify live article is discoverable
    const publishedSlug = authorData.submission?.title
      ? authorData.submission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : "";
    
    // Check article in catalog
    const freshArticlesRes = await fetch(`${BASE_URL}/api/articles`);
    const freshArticlesData = await freshArticlesRes.json();
    const isLiveInCatalog = Array.isArray(freshArticlesData.articles) && freshArticlesData.articles.some(
      (a: { id?: string; title?: string; slug?: string }) => a.title === testTitle || a.slug === publishedSlug
    );
    record(
      "Editorial: Live Catalog Propagation",
      Boolean(isLiveInCatalog),
      `Article verified live in published articles catalog`
    );

    // --------------------------------------------------------------------------
    // SUITE 4: Media Upload Pipeline
    // --------------------------------------------------------------------------
    console.log("\n--- SUITE 4: Firebase Storage & Resilient Media Upload ---");
    
    // 4.1 Valid image upload (PNG 1x1 buffer)
    const validPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    const formData = new FormData();
    const blob = new Blob([validPngBuffer], { type: "image/png" });
    formData.append("file", blob, `e2e-test-cover-${Date.now()}.png`);

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    const uploadOk = uploadRes.status === 200 && uploadData.success && typeof uploadData.url === "string";
    record(
      "Media: PNG Upload via /api/upload",
      Boolean(uploadOk),
      `HTTP ${uploadRes.status}, URL: ${uploadData.url} (Provider: ${uploadData.provider})`
    );

    // 4.2 Verify uploaded image is fetchable
    if (uploadOk && uploadData.url) {
      const fetchUrl = uploadData.url.startsWith("http")
        ? uploadData.url
        : `${BASE_URL}${uploadData.url}`;
      const imgFetchRes = await fetch(fetchUrl);
      record(
        "Media: Fetch Uploaded Asset",
        imgFetchRes.status === 200,
        `Retrieved asset from ${uploadData.provider} with HTTP ${imgFetchRes.status}`
      );
    }

    // 4.3 Invalid MIME security rejection
    const invalidFormData = new FormData();
    const invalidBlob = new Blob(["malicious executable content"], { type: "application/x-msdownload" });
    invalidFormData.append("file", invalidBlob, "virus.exe");
    const badUploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: invalidFormData,
    });
    record(
      "Media: Unsupported MIME Security Rejection",
      badUploadRes.status === 400,
      `Rejected unsupported MIME type with HTTP ${badUploadRes.status} 400 Bad Request`
    );

    // --------------------------------------------------------------------------
    // SUITE 5: Role-Based Access Control & User Profiles
    // --------------------------------------------------------------------------
    console.log("\n--- SUITE 5: RBAC & User Profile Management ---");
    const ts = Date.now();
    const testAdmin = await getOrCreateUserProfile({ uid: `admin-${ts}`, email: `admin.${ts}@thezango.org`, displayName: "Admin User" });
    const testEditor = await getOrCreateUserProfile({ uid: `editor-${ts}`, email: `editor.${ts}@thezango.org`, displayName: "Editor User" });
    const testWriter = await getOrCreateUserProfile({ uid: `writer-${ts}`, email: `writer.${ts}@thezango.org`, displayName: "Writer User" });
    const testReader = await getOrCreateUserProfile({ uid: `reader-${ts}`, email: `reader.${ts}@gmail.com`, displayName: "Reader User" }, "reader");

    const rbacRolesCorrect =
      testAdmin.role === "admin" &&
      testEditor.role === "editor" &&
      (testWriter.role === "author" || testWriter.role === "writer") &&
      testReader.role === "reader";

    record(
      "RBAC: Profile Auto-Creation & Role Inference",
      rbacRolesCorrect,
      `Inferred: Admin -> ${testAdmin.role}, Editor -> ${testEditor.role}, Writer -> ${testWriter.role}, Reader -> ${testReader.role}`
    );

    await setUserRole(`reader-${ts}`, "author");
    const promotedReader = await getUserProfile(`reader-${ts}`);
    record(
      "RBAC: Dynamic Role Promotion",
      promotedReader?.role === "author",
      `Successfully promoted reader account to role '${promotedReader?.role}'`
    );

    // --------------------------------------------------------------------------
    // SUITE 6: Reader Experience, Ticker, Bookmarks & Schema.org JSON-LD
    // --------------------------------------------------------------------------
    console.log("\n--- SUITE 6: Reader Experience, Ticker, Bookmarks & SEO ---");

    // 6.1 Home page contains breaking news ticker
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    const hasTicker = homeHtml.includes("Breaking Dispatch") || homeHtml.includes("Breaking");
    record(
      "Reader: Breaking News Dispatch Ticker",
      hasTicker,
      "Live Breaking News Ticker component rendered on front page"
    );

    // 6.2 Article page contains Schema.org NewsArticle JSON-LD
    const articlePageRes = await fetch(`${BASE_URL}/article/capital-has-many-faces-deal-has-a-price`);
    const articleHtml = await articlePageRes.text();
    const hasNewsArticleSchema =
      articleHtml.includes("application/ld+json") &&
      articleHtml.includes('"@type":"NewsArticle"') &&
      articleHtml.includes('"publisher"');
    record(
      "SEO: Schema.org NewsArticle JSON-LD",
      hasNewsArticleSchema,
      "Verified valid structured JSON-LD news metadata for Google News and Discover"
    );

    // 6.3 Article page contains WhatsApp Direct Share & X Intent
    const hasWhatsApp = articleHtml.includes("api.whatsapp.com/send") && articleHtml.includes("WhatsApp");
    const hasTwitter = articleHtml.includes("twitter.com/intent/tweet") && articleHtml.includes("hashtags=");
    record(
      "Social: WhatsApp & X Social Sharing Toolbar",
      hasWhatsApp && hasTwitter,
      "Direct WhatsApp formatted sharing and X intent with hashtags verified"
    );

    // 6.4 Reading List Drawer integration in Navbar
    const hasBookmarkControls = homeHtml.includes("Saved Reading List") || homeHtml.includes("thezango_bookmarks");
    record(
      "Reader: Reading List & Bookmark Integration",
      Boolean(hasBookmarkControls),
      "Navbar and reader toolbar bookmark triggers registered"
    );

  } catch (err: unknown) {
    allPassed = false;
    console.error("FATAL ERROR during E2E system test execution:", err);
  } finally {
    // Gracefully terminate production server
    if (serverProcess) {
      console.log("\nTerminating test production server...");
      serverProcess.kill("SIGTERM");
      await wait(1000);
      try {
        serverProcess.kill("SIGKILL");
      } catch {
        // already stopped
      }
    }
  }

  // ----------------------------------------------------------------------------
  // PRINT COMPREHENSIVE SCORECARD
  // ----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("📊 THE ZANGO PLATFORM — SYSTEM VERIFICATION SCORECARD");
  console.log("================================================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.status === "PASS").length;
  const failedCount = total - passedCount;

  results.forEach((r, idx) => {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${idx + 1}/${total}] ${r.suite} — ${r.details}`);
  });

  console.log("--------------------------------------------------------------------------------");
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`OVERALL RESULT: ${allPassed ? "🎉 SYSTEM VERIFIED PRODUCTION-READY" : "❌ SYSTEM VERIFICATION FAILED"}`);
  console.log("================================================================================\n");

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
