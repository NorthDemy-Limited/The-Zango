# 🧭 The Zango Platform — Implementation & Task Tracker

This tracker monitors the architecture, phase-by-phase implementation checklists, verification gates, and quality controls across the next key development tracks.

```mermaid
flowchart TD
    subgraph Track1["Track 1: Editorial Publishing Flow"]
        T1_1["1.1 Writer Studio Authoring"] --> T1_2["1.2 Desk Editor Review Queue"]
        T1_2 --> T1_3["1.3 Public Feed & Article Sync"]
    end

    subgraph Track2["Track 2: Firebase Storage Pipeline"]
        T2_1["2.1 Cloud Storage Upload API"] --> T2_2["2.2 Image Uploader & Inline Media"]
        T2_2 --> T2_3["2.3 CDN & Responsive Images"]
    end

    subgraph Track3["Track 3: Auth & Security Guards"]
        T3_1["3.1 Firebase Auth Roles"] --> T3_2["3.2 Route Middleware & Guards"]
        T3_2 --> T3_3["3.3 Firestore & Storage Rules"]
    end

    subgraph Track4["Track 4: Reader Experience & Polish"]
        T4_1["4.1 Breaking News Live Ticker"] --> T4_2["4.2 Comments & Social Sharing"]
        T4_2 --> T4_3["4.3 Structured Data & SEO"]
    end

    Track1 --> Track3
    Track2 --> Track1
    Track3 --> Track4
```

---

## 📋 Track 1: End-to-End Editorial Publishing Flow (Completed & Verified ✅)

### Objectives
Enable journalists to compose, tag, and submit manuscripts, allow desk editors to review and schedule publication, and guarantee instant synchronization across the public portal.

### Phase 1.1: Writer Studio Authoring & Submission
- [x] **Manuscript Form Validation**
  - Title, subtitle, excerpt, and slug auto-generation from title
  - Word count, character count, and estimated reading time computation
  - Category selection (Politics, Tech, Business, Culture, Opinion, Investigative)
  - Custom tag chip input with keyboard handling (Enter / comma)
- [x] **Draft Persistence & Auto-Save**
  - Local draft saving in `localStorage` to prevent work loss
  - Server draft saving via `/api/admin/submissions` with status `draft`
- [x] **Manuscript Submission**
  - Validation gate: require minimum title length (10 chars), excerpt, and content (40 words)
  - Submission transition to `pending` in Firestore `submissions` collection
  - Clear success modal with reference ID and link to track review status

### Phase 1.2: Desk Editor Review Queue & Quality Gate
- [x] **Editorial Review Queue ([editor/page.tsx](src/app/dashboard/editor/page.tsx))**
  - Tabbed filtering: `All`, `Pending Review`, `In Revision`, `Approved`
  - Quick manuscript preview drawer with side-by-side author metadata and tag chips
- [x] **Editorial Actions & Workflow Transitions**
  - **Approve & Publish**: Transition status to `approved` and persist to Firestore `articles`
  - **Schedule**: Date/time setting future `scheduledAt` timestamp
  - **Request Revision**: Attach structured editorial feedback notes sent back to author
  - **Reject**: Mark submission as rejected
- [x] **Editorial Overrides & Taxonomy Curation**
  - Toggle `isBreaking` (broadcast ticker flag)
  - Toggle `isFeatured`, `isTrending`, `isEditorsPick`, `isLatest`
  - Reassign primary category and customize story tags

### Phase 1.3: Real-Time Public Propagation
- [x] **Homepage & Category Sync**
  - Published articles immediately visible on [Home Page](src/app/page.tsx) without hard reload
  - Category views ([category/[slug]](src/app/category/[slug]/page.tsx)) reflect new articles
- [x] **Reader View Polish ([article/[slug]](src/app/article/[slug]/page.tsx))**
  - Verified live URL resolution with HTTP 200 for newly published articles
  - Verified author byline, publication timestamp, reading time badge, and category tag

---

## 🗄️ Track 2: Firebase Storage Media Upload Pipeline (Completed & Verified ✅)

### Objectives
Replace local base64 fallbacks with high-performance cloud storage on bucket `the-zango.firebasestorage.app`.

### Phase 2.1: Cloud Storage Service & API Handler
- [x] **Firebase Admin / Client Storage Setup**
  - Verify Firebase Storage initialization in [src/lib/firebase/config.ts](src/lib/firebase/config.ts)
  - Configure `getStorage(app)` client instance and export `storage`
- [x] **Direct Upload API Route ([/api/upload](src/app/api/upload/route.ts))**
  - Accept `multipart/form-data` with file payload
  - Validate mime types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
  - Enforce max file size: 5MB for images
  - Generate collision-resistant storage path: `articles/{year}/{month}/{uuid}_{filename}`
  - Upload to Firebase Storage with automatic local media disk storage fallback (`/uploads/...`)

### Phase 2.2: UI Uploader Component Enhancement
- [x] **Cover Image Uploader ([image-uploader.tsx](src/components/image-uploader.tsx))**
  - Drag-and-drop zone with active visual feedback (`isDragging`)
  - Client-side image validation (5MB limit, supported mime types)
  - Upload progress indicator and provider badges
  - Image replace and remove preview controls
- [x] **Inline Media Insertion**
  - Toolbar button in Writer Studio rich editor connected to `/api/upload`

### Phase 2.3: Optimization & Security
- [x] **Next.js Image Configuration ([next.config.ts](next.config.ts))**
  - Added `firebasestorage.googleapis.com` domain to `images.remotePatterns`
  - Added `@firebase/storage` to `serverExternalPackages`
- [x] **Storage Security Rules ([storage.rules](storage.rules))**
  - Created declarative `storage.rules` with public read for `/articles/**` and authenticated write

---

## 🔐 Track 3: Role-Based Authorization & Protected Route Guards

### Objectives
Enforce strict access controls so readers, contributors, desk editors, and administrators have appropriate access boundaries.

### Phase 3.1: Authentication & Role Architecture
- [x] **Role Schema in Firestore (`users` collection)**
  - Schema:
    ```typescript
    interface UserProfile {
      uid: string;
      email: string;
      displayName: string;
      photoURL?: string;
      role: 'reader' | 'author' | 'editor' | 'admin';
      bio?: string;
      created_at: string;
      updated_at: string;
    }
    ```
  - Auto-create user profile on first sign-in (default role: `reader` or `author`)
- [x] **Auth Context & Hook ([src/context/AuthContext.tsx](src/context/AuthContext.tsx))**
  - Sync Firebase `onAuthStateChanged` with Firestore user profile document
  - Provide `user`, `role`, `loading`, `signInWithEmail`, `signInWithGoogle`, `signOut`

### Phase 3.2: Protected Route Guards & Middleware
- [x] **Client & Server Guarding**
  - Route `/dashboard/author` &rarr; Requires `author`, `editor`, or `admin`
  - Route `/dashboard/editor` &rarr; Requires `editor` or `admin`
  - Route `/dashboard/admin` &rarr; Requires `admin`
  - Graceful unauthorized redirect to `/login?callbackUrl=...` with informative toast

### Phase 3.3: Firestore Security Rules (`firestore.rules`)
- [x] Declarative security rules for `articles`, `users`, `comments`, and `subscribers`:
  - `articles`: Public read for `status == 'published'`. Authors can create/edit own drafts. Editors/admins can update any article.
  - `users`: Users can read/write their own profile; admins can manage roles.

---

## ⚡ Track 4: Front Page & Reader Experience Polish (Completed & Verified ✅)

### Objectives
Deliver a world-class reading experience with live news dispatches, social sharing, and reader engagement.

### Phase 4.1: Live Breaking News Dispatch Ticker
- [x] **Ticker Component ([breaking-news-ticker.tsx](src/components/breaking-news-ticker.tsx))**
  - Live Firestore subscription for articles where `is_breaking == true` and `status == 'published'`
  - Animated marquee or cycling transition with urgency pulse indicator
  - Click-through directly to the breaking article

### Phase 4.2: Reader Engagement
- [x] **Social Sharing ([article-reader-toolbar.tsx](src/components/article-reader-toolbar.tsx))**
  - Native Web Share API with fallbacks:
    - WhatsApp direct share with formatted title + URL
    - X (Twitter) intent with pre-filled hashtags
    - LinkedIn share intent
    - One-click copy link with success tooltip
- [x] **Local & Cloud Bookmarking**
  - Fast local storage bookmarking for guest readers
  - Dedicated "Saved Articles" drawer or reading list page ([saved-articles-drawer.tsx](src/components/saved-articles-drawer.tsx))

### Phase 4.3: Structured Data & Metadata
- [x] Dynamic OpenGraph images and Twitter cards
- [x] Schema.org `NewsArticle` JSON-LD on article pages for Google Discover and search indexing

---

## 🏆 Full System End-to-End Verification (Completed & Verified ✅)

A comprehensive integration test suite (`scripts/system-e2e-test.ts`) verifies all 4 development tracks against a live production Next.js runtime across 30 verification checks:

- [x] **Suite 1: Public Web Pages & Navigation Routes (13/13 Passed)**
  - `/`, `/category/news`, `/category/business`, `/trending`, `/categories`, `/scope`, `/marketplace`, `/login`, `/dashboard/author`, `/dashboard/editor`, `/dashboard/admin`, `/feed.xml`, `/sitemap.xml`
- [x] **Suite 2: Public Data & Reader Interaction APIs (4/4 Passed)**
  - `GET /api/articles`, `GET /api/categories`, `POST /api/newsletter`, `POST /api/comments`
- [x] **Suite 3: Editorial Publishing Pipeline (4/4 Passed)**
  - Writer pitch submission (`POST /api/writer/submissions`) -> Editor queue inspection (`GET /api/editor/submissions`) -> Desk Editor approval & promotion (`PATCH /api/editor/submissions/[id]`) -> Live catalog propagation (`GET /api/articles`)
- [x] **Suite 4: Media Upload Pipeline & Dynamic Asset Serving (3/3 Passed)**
  - Resilient upload handler (`POST /api/upload`) -> Dynamic asset streaming (`GET /uploads/[...slug]`) -> MIME rejection security check
- [x] **Suite 5: Role-Based Access Control & User Profiles (2/2 Passed)**
  - Role inference and profile auto-creation -> dynamic role elevation (`reader` -> `author`)
- [x] **Suite 6: Reader Experience, Ticker, Bookmarks & SEO (4/4 Passed)**
  - Breaking news ticker presence -> Schema.org `NewsArticle` JSON-LD -> WhatsApp & X social sharing toolbar -> Reading list drawer in Navbar


---

## 🧪 Validation & Quality Gates

Every implementation task must satisfy the four-stage verification gate before committing:

```bash
# 1. Type verification
npx tsc --noEmit

# 2. Lint and format inspection
npm run lint

# 3. Production build compilation
npm run build

# 4. HTTP route check
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/
```

