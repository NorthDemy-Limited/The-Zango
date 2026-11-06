-- ==============================================================================
-- THE ZANGO — PRODUCTION-GRADE SUPABASE DATABASE SCHEMA
-- Digital Journalism & Media Platform for Northern Nigeria & the Sahel
-- 
-- INSTRUCTIONS FOR YOUR COLLEAGUE:
-- 1. Open your Supabase Project Dashboard: https://supabase.com/dashboard
-- 2. Go to "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this entire script, and click "Run" (green button)
-- 4. All tables, security policies, role enums, indexes, and initial data will be initialized.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean/Drop Legacy Types if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'newsroom_role') THEN
        CREATE TYPE newsroom_role AS ENUM ('admin', 'editor', 'writer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- 3. Categories Table (All 11 Newsroom Desks)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'live',
    last_updated TEXT DEFAULT 'Today',
    is_live BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Newsroom Team & Editorial Role Clearance
CREATE TABLE IF NOT EXISTS public.newsroom_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'writer' CHECK (role IN ('admin', 'editor', 'writer')),
    desk TEXT NOT NULL DEFAULT 'General News',
    avatar TEXT DEFAULT '/assets/social-image-1.png',
    bio TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    articles_count INTEGER DEFAULT 0,
    joined_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Articles Table (Dispatches & Manuscripts)
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    author_name TEXT NOT NULL DEFAULT 'The Zango Bureau',
    author_slug TEXT NOT NULL DEFAULT 'the-zango-bureau',
    author_role TEXT NOT NULL DEFAULT 'Editorial Desk',
    author_avatar TEXT,
    published_at TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'Mon DD, YYYY'),
    read_time TEXT NOT NULL DEFAULT '4 min read',
    is_featured BOOLEAN DEFAULT FALSE,
    is_latest BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_editors_pick BOOLEAN DEFAULT FALSE,
    popular_rank INTEGER,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_views ON public.articles(views DESC);
CREATE INDEX IF NOT EXISTS idx_newsroom_members_email ON public.newsroom_members(email);
CREATE INDEX IF NOT EXISTS idx_newsroom_members_role ON public.newsroom_members(role);

-- 6. Writer Submissions (Author Studio Review Queue)
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    submitted_at TEXT DEFAULT 'Just now',
    word_count INTEGER DEFAULT 0,
    read_time TEXT DEFAULT '4 min read',
    cover_image TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- 7. Newsletter Subscribers Roster
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);

-- 8. Reader Perspectives (Public Article Comments)
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    article_slug TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT 'Just now'
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON public.comments(article_slug);

-- 9. Row Level Security (RLS) Setup
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing public policies if re-running script to avoid duplicate policy error
DROP POLICY IF EXISTS "Public categories read" ON public.categories;
DROP POLICY IF EXISTS "Public newsroom read" ON public.newsroom_members;
DROP POLICY IF EXISTS "Public articles read" ON public.articles;
DROP POLICY IF EXISTS "Public comments read" ON public.comments;
DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
DROP POLICY IF EXISTS "Public insert subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Public insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin full articles" ON public.articles;
DROP POLICY IF EXISTS "Admin full categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full newsroom" ON public.newsroom_members;
DROP POLICY IF EXISTS "Admin full submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admin full subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admin full comments" ON public.comments;

-- Public read access
CREATE POLICY "Public categories read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public newsroom read" ON public.newsroom_members FOR SELECT USING (true);
CREATE POLICY "Public articles read" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Public comments read" ON public.comments FOR SELECT USING (true);

-- Public insert actions (comment submission, newsletter signups, author pitch drafts)
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert subscribers" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);

-- Editorial Admin & Service Role clearance (Full CRUD)
CREATE POLICY "Admin full articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full newsroom" ON public.newsroom_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full subscribers" ON public.subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- 10. PRE-POPULATED SEED DATA (Idempotent: ON CONFLICT DO NOTHING)
-- ==============================================================================

-- A. All 11 News Desks
INSERT INTO public.categories (id, name, slug, description, count, status, is_live) VALUES
('news', 'News', 'news', 'Breaking news, political updates and current affairs from across Northern Nigeria and the Sahel.', 28, 'breaking', true),
('business', 'Business', 'business', 'Economic insights, market dynamics, venture funding, commodities and private equity.', 22, 'live', true),
('technology', 'Technology', 'technology', 'Digital innovation, software ecosystems, climate-tech, and AI localization.', 34, 'live', true),
('opinion', 'Opinion', 'opinion', 'Critical analysis, thoughtful commentary, and perspective essays from leading regional thinkers.', 16, 'updated', false),
('lifestyle', 'Lifestyle', 'lifestyle', 'Sahelian culture, architecture, contemporary health, culinary traditions, and youth trends.', 12, 'active', false),
('sports', 'Sports', 'sports', 'National football leagues, regional athletics, martial arts, and sporting triumphs.', 10, 'active', false),
('features', 'Features', 'features', 'Deep-dive longform journalism, field reports, and investigative exposés.', 18, 'live', true),
('politics', 'Politics', 'politics', 'Governance, parliamentary policy, fiscal accountability, and grassroots civic engagement.', 15, 'breaking', true),
('entertainment', 'Entertainment', 'entertainment', 'Cinema, Kannywood storytelling, contemporary Sahelian music, and performing arts.', 9, 'active', false),
('health', 'Health', 'health', 'Public healthcare, maternal survival initiatives, and medical logistics across rural clinics.', 8, 'live', true),
('education', 'Education', 'education', 'STEM curricula, university research breakthroughs, and technical vocational literacy.', 11, 'active', false)
ON CONFLICT (id) DO NOTHING;

-- B. Newsroom Editorial Staff & Roles
INSERT INTO public.newsroom_members (id, name, email, role, desk, avatar, bio, status, articles_count, joined_at) VALUES
('member-1', 'Usman Bello', 'usman.bello@thezango.org', 'admin', 'Executive & Investigation', '/assets/social-image-1.png', 'Chief Executive & Bureau Chief with 15+ years in Sahelian socio-political investigative reporting.', 'active', 42, '2024-01-15'),
('member-2', 'Aisha Dahiru', 'aisha.dahiru@thezango.org', 'editor', 'Business & Capital Markets', '/assets/social-image-2.png', 'Senior Markets Editor analyzing private equity, agribusiness finance, and trade dynamics across Northern Nigeria.', 'active', 28, '2024-03-01'),
('member-3', 'Ibrahim Garba', 'ibrahim.garba@thezango.org', 'editor', 'Security & Regional Conflict', '/assets/social-image-3.png', 'Defense and Lake Chad basin correspondent, specializing in counter-insurgency and humanitarian corridors.', 'active', 35, '2024-04-10'),
('member-4', 'Fatima Sanusi', 'fatima.sanusi@thezango.org', 'writer', 'Technology & Digital Economy', '/assets/social-image-4.png', 'Tech correspondent tracking venture capital, AI hubs, and mobile banking adoption from Kano to Kaduna.', 'active', 19, '2024-06-20'),
('member-5', 'Zainab Aliyu', 'zainab.aliyu@thezango.org', 'writer', 'Culture, Heritage & Arts', '/assets/social-image-1.png', 'Cultural essayist documenting Sahelian architecture, Hausa literature, and contemporary creative movements.', 'active', 14, '2024-08-05')
ON CONFLICT (id) DO NOTHING;

-- C. Sample Published Dispatches
INSERT INTO public.articles (
    id, slug, title, excerpt, content, cover_image, category, 
    author_name, author_slug, author_role, author_avatar, 
    published_at, read_time, is_featured, is_latest, is_trending, is_popular, is_editors_pick, views
) VALUES
(
    'art-001',
    'capital-has-many-faces-deal-has-a-price',
    'Capital Has Many Faces, But Every Deal Has a Price',
    'Venture capitalists in Lagos and London are pouring millions into Northern tech hubs. But local founders are finding that equity comes with cultural and governance strings.',
    '<h2>The Influx of Northern Frontier Capital</h2><p>In the quiet co-working spaces of Kano and Kaduna, a subtle shift is underway. For years, the narrative around tech in Northern Nigeria was defined by grassroots resilience and scarce institutional funding. Today, that picture is evolving rapidly.</p><p>As international development funds and pan-African syndicates look beyond the saturated Lagos corridor, northern founders are navigating unprecedented deal flows.</p><blockquote>"Raising capital is not the finish line; it is the moment when governance accountability truly begins."</blockquote><p>Our investigation reveals how early-stage ventures are balancing rapid scaling demands with sustainable unit economics suited to Sahelian commerce.</p>',
    '/assets/hero-featured.jpg',
    'Business',
    'Abdul Rahman',
    'abdul-rahman',
    'Senior Business Analyst',
    '/assets/social-image-1.png',
    'Oct 24, 2026',
    '6 min read',
    true, false, true, true, true, 28400
),
(
    'art-002',
    'kano-sahel-climate-agritech-revolution',
    'How Solar-Powered Drip Irrigation is Insulating Kano Farmers from Fuel Price Surges',
    'From Danbatta to Kura, farming cooperatives are cutting irrigation overheads by 65% with decentralized solar arrays, securing dry-season yields despite macroeconomic shocks.',
    '<h2>Decentralized Clean Energy in the Sahel</h2><p>Diesel pump rentals once devoured up to 40% of smallholder agricultural revenue during Northern Nigeria''s dry season. With fuel subsidy adjustments, costs reached unsustainable peaks.</p><p>Enter cooperative solar micro-grids. By pooling capital through agricultural thrift societies, farmers in Danbatta have deployed shared solar-powered boreholes.</p><p>Data compiled over two harvest cycles demonstrates a 65% drop in operational overheads and a 30% increase in dry-season tomato yields.</p>',
    '/assets/trending-hero.jpg',
    'Technology',
    'Fatima Aliyu',
    'fatima-aliyu',
    'Climate & Science Correspondent',
    '/assets/social-image-3.png',
    'Oct 25, 2026',
    '4 min read',
    false, true, true, false, true, 16200
),
(
    'art-003',
    'sahelian-earth-architecture-revival-kaduna',
    'Passive Cooling: Reviving Sahelian Earth Architecture in Modern Urban Housing',
    'Urban planners and architects in Kaduna and Niamey are reviving compressed stabilized earth blocks (CSEB) to lower indoor temperatures by 7°C without air conditioning.',
    '<h2>Indigenous Materials Meet Modern Engineering</h2><p>As cooling energy costs climb across West Africa, sustainable architects are revisiting centuries-old Sahelian earthen construction techniques.</p><p>Modern compressed earth blocks, stabilized with minimal mineral binders, offer superior thermal mass compared to conventional hollow concrete blocks.</p><p>Field measurements in new civic housing pilots show interior temperatures remaining 5 to 7 degrees Celsius cooler than exterior midday ambient heat.</p>',
    '/assets/news-hausa-digital.png',
    'Features',
    'Zainab Usman',
    'zainab-usman',
    'Culture & Architecture Contributor',
    '/assets/social-image-1.png',
    'Oct 26, 2026',
    '5 min read',
    false, true, false, false, false, 9800
)
ON CONFLICT (id) DO NOTHING;

-- D. Initial Subscribers
INSERT INTO public.subscribers (email, subscribed_at) VALUES
('ibrahim.k@startupkano.com', '2026-07-20'),
('fatima.al@kadunahub.ng', '2026-07-21'),
('usman.tech@innovate.ng', '2026-07-22'),
('maryam.s@oxfordalumni.org', '2026-07-23'),
('bello.invest@savannah.vc', '2026-07-24')
ON CONFLICT (email) DO NOTHING;
