# 🗞️ The Zango

> **Independent Journalism, Rigorous Analysis, and High-Impact Stories from Northern Nigeria and the Sahel.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v11.x-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#license)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Editorial Landing Page](#1-editorial-landing-page)
  - [Dual Dashboards](#2-dual-dashboards)
  - [Dynamic Taxonomy & Routes](#3-dynamic-taxonomy--routes)
  - [Interactive Reader Perspectives](#4-interactive-reader-perspectives)
- [API Architecture & Feeds](#-api-architecture--feeds)
  - [Granular Filter Endpoints](#granular-filter-endpoints)
  - [Composite Landing Feed](#composite-landing-feed-bff)
  - [Interactive Endpoints](#interactive-endpoints)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Development Server](#running-the-development-server)
  - [Production Build](#production-build)
- [Firebase Persistence Architecture](#-firebase-persistence-architecture)
- [Design Tokens](#-design-tokens)
- [Git Discipline & Contribution Guide](#-git-discipline--contribution-guide)
- [License](#-license)

---

## 🌍 Overview

**The Zango** is a modern, enterprise-scale digital publication and multimedia journalism platform built specifically to cover emerging technology, frontier business ecosystems, climate transitions, cultural heritage, and public policy across Northern Nigeria and the wider Sahelian corridor.

Built on **Next.js 16 (App Router)** with **Turbopack**, **React 19**, and **Tailwind CSS v4**, The Zango combines the reading experience of top-tier global newsrooms with real-time editorial workflow automation, dual administrative dashboards, and resilient Firebase data persistence.

---

## ✨ Key Features

### 1. Editorial Landing Page
- **Hero Showcase**: Prominent headline feature card paired with a real-time breaking **Latest News** sidebar.
- **Editor’s Picks**: Curated 4-column responsive grid spotlighting investigative and high-impact essays.
- **Trending & Popular**: Visual trending spotlight alongside a ranked 1–4 popularity ladder.
- **Stay Informed Hub**: Brand social channel hub paired with an asynchronous email newsletter capture form.
- **Visual Taxonomy Grid**: Categorical desk tiles with story counters linking into detailed desk feeds.
- **The Zango Experience**: Immersive multimedia hub featuring audio podcasts and cinematic visual dispatches.

### 2. Dual Dashboards
- **Chief Editor CMS (`/dashboard/admin`)**:
  - Live editorial KPI metrics (Total Articles, Newsletter Subscribers, Monthly Reads, Active Desks).
  - Story management table with instant publish/delete controls.
  - Interactive story publishing modal with category tagger, image upload selector, and excerpt generator.
  - Subscriber roster with one-click **Export to CSV**.
  - Real-time Firebase connection health indicator.
- **Writer / Contributor Studio (`/dashboard/author`)**:
  - Author performance metrics (Total Bylines, Total Reads, Average Read Time, Desk Affiliation).
  - Longform draft composer with **live word counter** and **estimated read time calculator**.
  - Article status tracker (Published, Under Editorial Review, Draft).

### 3. Dynamic Taxonomy & Routes
- **[`/category/[slug]`](src/app/category/[slug]/page.tsx)**: Dynamic topic feeds for 10 news desks (*News, Business, Technology, Opinion, Lifestyle, Sports, Features, Politics, Entertainment, Health, Education*) with sub-filter chips.
- **[`/categories`](src/app/categories/page.tsx)**: Comprehensive taxonomy directory with desk icons, story counts, descriptions, and latest story previews.
- **[`/author/[slug]`](src/app/author/[slug]/page.tsx)**: Verified journalist byline portfolios with avatars, verified staff badges, locations, social handles, readership statistics, and full article archives.
- **[`/trending`](src/app/trending/page.tsx)**: Real-time velocity ranking feed (ranked 1–10) with topic badges and read times.
- **[`/search`](src/app/search/page.tsx)**: Live instant search filtering across titles, excerpts, authors, categories, and tags.
- **[`/scope`](src/app/scope/page.tsx)**: Multimedia investigative studio with podcast player and visual field dispatches.
- **[`/marketplace`](src/app/marketplace/page.tsx)**: Regional directory connecting certified northern creators, tech vendors, and agro-exporters.
- **[`/terms`](src/app/terms/page.tsx)** & **[`/privacy`](src/app/privacy/page.tsx)**: Comprehensive editorial ethics code, fact-checking policies, copyright attribution, and privacy statements.

### 4. Interactive Reader Perspectives
- **[`/article/[slug]`](src/app/article/[slug]/page.tsx)**: High-typography editorial reader with estimated read time, clickable author byline, pull-quote blocks, and topic tag pills.
- **Community Perspectives (`ArticleComments`)**: Real-time reader discussion thread with comment submission form, timestamps, like counters, and optimistic UI updates wired to `/api/comments`.

---

## ⚡ API Architecture & Feeds

The Zango employs a dual-layer data architecture:
1. **Server Components (`src/app/page.tsx`)**: Directly access database services via `getArticles()`, eliminating internal HTTP round-trip latency (saving 50–100ms per request).
2. **REST Endpoints (`/api/*`)**: Provide non-conflicting, parameterized feeds for client components, infinite-scroll lists, and mobile consumers.

### Granular Filter Endpoints
```http
GET /api/articles
```
Supports orthogonal query parameters that never conflict:

| Parameter | Type | Example | Description |
|---|---|---|---|
| `feed` | string | `?feed=latest` | Breaking/latest stories (`isLatest: true`) |
| `feed` | string | `?feed=editors-picks` | Curated editorial selections (`isEditorsPick: true`) |
| `feed` | string | `?feed=trending` | Trending velocity stories (`isTrending: true`) |
| `feed` | string | `?feed=popular` | Ranked stories sorted by `popularRank` |
| `feed` | string | `?feed=featured` | Hero headline article (`isFeatured: true`) |
| `category` | string | `?category=business` | Filter by category desk |
| `author` | string | `?author=abdul-rahman`| Filter by author slug or name |
| `query` | string | `?query=climate` | Full-text search across title, excerpt, and content |
| `limit` | integer | `?limit=4` | Limit maximum returned results |

### Composite Landing Feed (BFF)
```http
GET /api/feeds/home
```
Returns all primary landing page sections in a single atomic payload to prevent client-side network waterfalls:
```json
{
  "success": true,
  "timestamp": "2026-11-01T06:23:29.795Z",
  "sections": {
    "featured": { "title": "Capital has Many Faces...", ... },
    "latestNews": [ ... ],
    "editorsPicks": [ ... ],
    "trending": { ... },
    "popular": [ ... ]
  }
}
```

### Interactive Endpoints
- **`POST /api/newsletter`**: Validates email and persists subscriptions.
- **`POST /api/comments`**: Validates and appends reader perspectives to specific articles.
- **`POST /api/articles`**: Handles programmatic dispatch publishing from the CMS.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.4.3](https://nextjs.org/) (App Router, Turbopack, Partial Prerendering)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: [Geist](https://vercel.com/font) via `next/font`
- **Icons**: [Lucide React](https://lucide.dev/) + Custom Brand SVGs
- **Persistence**: [Firebase SDK v11](https://firebase.google.com/) (Cloud Firestore) with graceful in-memory fallback
- **Runtime**: Node.js v20+ / v22 LTS

---

## 📂 Project Structure

```text
TheZango/
├── public/
│   └── assets/                    # 18 high-resolution assets extracted from Adobe XD
│       ├── logo.png               # Official The Zango brand mark
│       ├── hero-featured.jpg      # Main headline hero cover
│       ├── news-*.jpg             # Editorial news covers & thumbnails
│       └── social-image-*.png     # Verified journalist avatars
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # REST API Endpoints
│   │   │   ├── articles/          # GET (filtered feeds) & POST (create)
│   │   │   ├── comments/          # POST reader perspectives
│   │   │   ├── feeds/home/        # GET composite home sections
│   │   │   └── newsletter/        # POST email subscriptions
│   │   ├── article/[slug]/        # Longform dynamic article reader
│   │   ├── author/[slug]/         # Dynamic author portfolio & archive
│   │   ├── category/[slug]/       # Dynamic news desk feeds
│   │   ├── categories/            # 10-desk taxonomy directory
│   │   ├── dashboard/
│   │   │   ├── admin/             # Chief Editor CMS
│   │   │   └── author/            # Writer / Contributor Studio
│   │   ├── trending/              # Real-time velocity ranking feed
│   │   ├── search/                # Client-side instant search
│   │   ├── scope/                 # Zango Scope multimedia hub
│   │   ├── marketplace/           # Regional creators & tech directory
│   │   ├── about/                 # Editorial mission & masthead
│   │   ├── contact/               # Newsroom contacts & bureau tips
│   │   ├── advertise/             # Media kit & sponsorship tiers
│   │   ├── privacy/               # Privacy policy
│   │   ├── terms/                 # Editorial code of ethics & terms
│   │   ├── layout.tsx             # Root layout with smooth scrolling
│   │   └── page.tsx               # Dynamic Landing Page
│   ├── components/                # Modular UI Components
│   │   ├── navbar.tsx             # Sticky header, search, mobile drawer
│   │   ├── hero-section.tsx       # Featured story + Latest News sidebar
│   │   ├── editors-picks.tsx      # Curated 4-column responsive grid
│   │   ├── trending-popular.tsx   # Trending card + ranked 1-4 popular list
│   │   ├── stay-informed-banner.tsx # Social channels + newsletter form
│   │   ├── category-grid.tsx      # 6 visual desk tiles
│   │   ├── zango-experience.tsx   # Multimedia podcast/video banner
│   │   ├── article-comments.tsx   # Interactive reader perspective thread
│   │   ├── social-icons.tsx       # Dedicated SVG brand icons
│   │   └── footer.tsx             # Multi-column footer & quick links
│   ├── data/
│   │   └── mock-articles.ts       # Complete article catalog, authors & desks
│   ├── lib/
│   │   └── firebase/
│   │       ├── config.ts          # Resilient Firebase client initialization
│   │       └── db.ts              # Firestore CRUD & in-memory fallbacks
│   └── types/
│       └── index.ts               # Core TypeScript interfaces (Article, Author, Category, etc.)
├── .env.example                   # Environment configuration template
├── package.json                   # Dependencies and scripts (configured on port 3002)
└── README.md                      # Platform documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.0.0 or higher (Node 22 LTS recommended)
- **Package Manager**: `npm` (v10+)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/NorthDemy-Limited/The-Zango.git
cd The-Zango
npm install
```

### Environment Configuration
The platform functions out-of-the-box using built-in mock stores. To connect live **Firebase Firestore** storage, copy the environment template:
```bash
cp .env.example .env.local
```
Fill in your Firebase project credentials in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Running the Development Server
The application is pre-configured to bind to port **`3002`**:
```bash
npm run dev
```
Open [http://localhost:3002](http://localhost:3002) in your browser.

### Production Build
To validate TypeScript types, route generation, and compile optimized production bundles:
```bash
npm run build
npm run start
```

---

## 🔒 Firebase Persistence Architecture

The platform uses a **resilient hybrid data layer** in [`src/lib/firebase/db.ts`](src/lib/firebase/db.ts):
- When valid Firebase environment credentials are provided, all operations (`getArticles`, `createArticle`, `deleteArticle`, `getSubscribers`, `addSubscriber`) read and write directly to Firestore.
- When credentials are absent (e.g. local offline development or CI test environments), the system automatically falls back to an internal memory store pre-seeded from [`src/data/mock-articles.ts`](src/data/mock-articles.ts).
- The Chief Editor CMS displays a real-time badge indicating whether the platform is operating in **Live Firebase** or **Local Memory** mode.

---

## 🎨 Design Tokens

- **Brand Primary Red**: `#C61D1F`
- **Primary Hover Red**: `#A51719`
- **Soft Red Accent**: `#FDF2F2`
- **Neutral Dark**: `#000000`
- **Body Text**: `#535252`
- **Muted Subtext**: `#707070`
- **Borders & Dividers**: `#E5E6E8`, `#DFDFDF`
- **Backgrounds**: `#FFFFFF`, `#FAFAFA`

---

## 🤝 Git Discipline & Contribution Guide

This repository follows strict engineering and commit discipline:
- **One Fix = One Commit**: Each commit contains only the files relevant to that specific task.
- **Commit Format**: Conventional commit prefixes (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- **Default Branch**: `main`
- **Working / Feature Branch**: `AbuJulaybeeb`

### Submitting a Pull Request
1. Ensure your local branch passes production build checks:
   ```bash
   npm run build
   ```
2. Verify git status has no stray or temporary files:
   ```bash
   git status
   ```
3. Push changes to your tracking branch and open a PR:
   ```bash
   git push origin <your-branch-name>
   ```

---

## 📄 License

Copyright © 2026 **The Zango** / **NorthDemy Limited**. All Rights Reserved.
Unpublished proprietary software. Unauthorized reproduction, distribution, or reverse engineering is strictly prohibited.
