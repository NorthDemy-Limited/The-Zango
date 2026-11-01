import { Article, Category, Author, Comment } from "@/types";

export const AUTHORS: Author[] = [
  {
    id: "author-1",
    name: "Abdul Rahman",
    slug: "abdul-rahman",
    role: "Senior Business Analyst",
    avatar: "/assets/social-image-1.png",
    location: "Kano & Abuja, Nigeria",
    twitter: "@abdul_zango",
    linkedin: "abdul-rahman-zango",
    bio: "Abdul Rahman has over 9 years of journalism experience dissecting venture capital flows, sovereign wealth allocations, and frontier enterprise ecosystems across Northern Nigeria and the Sahel corridor.",
  },
  {
    id: "author-2",
    name: "The Zango Bureau",
    slug: "the-zango-bureau",
    role: "Editorial Desk & Fact-Checking Unit",
    avatar: "/assets/social-image-2.png",
    location: "Abuja, Nigeria",
    bio: "The Zango Bureau is our multi-city investigations desk, synthesizing official market records, trade statistics, and field reporting from 19 northern states.",
  },
  {
    id: "author-3",
    name: "Fatima Aliyu",
    slug: "fatima-aliyu",
    role: "Climate & Science Correspondent",
    avatar: "/assets/social-image-3.png",
    location: "Kaduna, Nigeria",
    twitter: "@fatima_climate",
    linkedin: "fatima-aliyu-sci",
    bio: "Reporting on climate-smart agriculture, Sahelian desertification mitigation, solar mini-grids, and rural resilience transitions.",
  },
  {
    id: "author-4",
    name: "Ibrahim Bello",
    slug: "ibrahim-bello",
    role: "Technology Editor",
    avatar: "/assets/social-image-4.png",
    location: "Abuja, Nigeria",
    twitter: "@ibrahim_bello_tech",
    linkedin: "ibrahim-bello-editor",
    bio: "Leading coverage of AI localization, telecommunications policy, venture capital syndicates, and software engineering talent across West Africa.",
  },
  {
    id: "author-5",
    name: "Zainab Usman",
    slug: "zainab-usman",
    role: "Culture & Linguistics Contributor",
    avatar: "/assets/social-image-1.png",
    location: "Kano, Nigeria",
    twitter: "@zainab_lingua",
    bio: "Focusing on indigenous language technology, digital preservation of Hausa literature, and creative economy entrepreneurship.",
  },
  {
    id: "author-7",
    name: "Usman Kabir",
    slug: "usman-kabir",
    role: "Ecosystem Reporter",
    avatar: "/assets/social-image-3.png",
    location: "Kano, Nigeria",
    twitter: "@usman_ecosystem",
    bio: "Chronicling incubation centers, maker labs, and angel syndicates powering Northern Nigeria's tech revolution.",
  },
  {
    id: "author-8",
    name: "Amina Dahiru",
    slug: "amina-dahiru",
    role: "Digital Inclusion Fellow",
    avatar: "/assets/social-image-4.png",
    location: "Jos, Plateau State",
    twitter: "@amina_dahiru",
    bio: "Advocating for rural connectivity, digital literacy for women, and multilingual technology access.",
  },
];

export const CATEGORIES: Category[] = [
  { id: "news", name: "News", slug: "news", description: "Breaking news, political updates and current affairs from across Northern Nigeria and beyond.", count: 24 },
  { id: "business", name: "Business", slug: "business", description: "Economic insights, market dynamics, venture funding and startup growth.", count: 18 },
  { id: "technology", name: "Technology", slug: "technology", description: "Digital innovation, software engineering, climate tech, and tech ecosystems.", count: 32 },
  { id: "opinion", name: "Opinion", slug: "opinion", description: "Critical analysis, thoughtful commentary, and perspective essays from leading voices.", count: 14 },
  { id: "lifestyle", name: "Lifestyle", slug: "lifestyle", description: "Culture, arts, health, culinary traditions, and youth trends.", count: 11 },
  { id: "sports", name: "Sports", slug: "sports", description: "National and regional athletics, football leagues, and sporting achievements.", count: 9 },
  { id: "features", name: "Features", slug: "features", description: "Long-form journalism, human interest stories, and investigative reports.", count: 15 },
  { id: "politics", name: "Politics", slug: "politics", description: "Governance, policy analysis, legislative developments, and civic accountability.", count: 12 },
  { id: "entertainment", name: "Entertainment", slug: "entertainment", description: "Cinema, Kannywood culture, contemporary music, and performing arts.", count: 8 },
  { id: "health", name: "Health", slug: "health", description: "Public health initiatives, maternal care innovations, and medical technology.", count: 7 },
  { id: "education", name: "Education", slug: "education", description: "STEM curricula, university research breakthroughs, and vocational literacy.", count: 10 },
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: "comm-1",
    articleSlug: "capital-has-many-faces-deal-has-a-price",
    authorName: "Garba Sani",
    content: "Spot on analysis. Many founders in Kano make the mistake of raising expensive debt before establishing repeatable customer demand. Local syndicates are definitely the missing link.",
    createdAt: "2 hours ago",
    likes: 14,
  },
  {
    id: "comm-2",
    articleSlug: "capital-has-many-faces-deal-has-a-price",
    authorName: "Hadiza Al-Hassan",
    content: "The breakdown of governance friction during Series A was eye-opening. We need more case studies like this documenting northern startup journeys.",
    createdAt: "5 hours ago",
    likes: 9,
  },
  {
    id: "comm-3",
    articleSlug: "tomato-jos-agriarche-top-funded-startups-h1-2026",
    authorName: "Dr. Aliyu Mahmud",
    content: "Tomato Jos proves that backward integration in agriculture is commercially viable in Northern Nigeria when backed by patient, catalytic capital.",
    createdAt: "Yesterday",
    likes: 21,
  },
];

export const ARTICLES: Article[] = [
  {
    id: "art-1",
    slug: "capital-has-many-faces-deal-has-a-price",
    title: "Capital has Many Faces, and Every Deal has a Price",
    excerpt: "Musa is a startup founder who, in the beginning of his journey, had little knowledge about funding, and what funding is all about. He believed it worked in a linear format; build a product, pitch it, and someone writes a cheque. It was only after his third rejection from a programme that he realised capital had rules, personalities, and expectations …",
    content: `
Musa is a startup founder who, in the beginning of his journey, had little knowledge about funding, and what funding is all about. He believed it worked in a linear format: build a product, pitch it, and someone writes a cheque. It was only after his third rejection from a prestigious accelerator programme that he realised capital had rules, personalities, and rigorous expectations.

### The Myth of Frictionless Capital

For entrepreneurs building in frontier ecosystems like Kano, Kaduna, and Maiduguri, access to seed venture funding has often been painted as an elusive golden ticket. Yet, the realities of capitalization extend far beyond valuation figures and term sheets. 

"Capital isn't homogenous," explains Aminu Bello, a venture partner at Savannah Ventures. "Debt behaves differently from equity, and grant capital carries entirely distinct reporting obligations. A founder who takes on debt expecting venture-style grace periods is heading for insolvency."

### Unpacking the Costs of Early Investment

When founders trade equity for acceleration, the hidden price tags frequently emerge in governance friction, pivot constraints, and board realignment. Deals that look generous on surface multiples can severely penalize cap tables during subsequent Series A rounds.

Key lessons learned by northern founders in H1 2026:
1. **Instrument Alignment**: Never use short-term high-yield commercial debt to finance R&D or unvalidated market experiments.
2. **Local Syndicates**: Northern angel syndicates are maturing rapidly, offering strategic distribution networks that Silicon Valley or London money cannot deliver on the ground.
3. **Revenue Over Pitch Decks**: In an era of tighter liquidity, customer-funded growth provides the strongest leverage in any negotiation.

As the northern tech corridor continues to expand, founders who master the nuanced psychology of investment will be the ones who build enduring, cross-border African institutions.
    `,
    coverImage: "/assets/hero-featured.jpg",
    category: "Business",
    tags: ["Venture Capital", "Northern Startups", "Founders", "Funding"],
    author: AUTHORS[0],
    publishedAt: "May 19, 2026",
    readTime: "6 min read",
    isFeatured: true,
    views: 4520,
    commentsCount: 2,
  },
  {
    id: "art-2",
    slug: "tomato-jos-agriarche-top-funded-startups-h1-2026",
    title: "Tomato Jos, Agriarche Emerge Among Nigeria’s Top-Funded Startups in H1 2026",
    excerpt: "Sabou Capital has announced a $2 million impact-linked debt investment in Tomato Jos Farming and Processing Limited, in a move aimed at strengthening local tomato production and reducing Nigeria’s dependence on food imports.",
    content: `
Sabou Capital has announced a $2 million impact-linked debt investment in Tomato Jos Farming and Processing Limited, in a move aimed at strengthening local tomato production and reducing Nigeria’s dependence on costly paste imports.

Operating out of Kaduna State, Tomato Jos has pioneered an integrated model bridging thousands of smallholder farmers directly to modern automated processing facilities. The fresh injection of capital is expected to expand production capacity to over 150 metric tonnes daily.

Simultaneously, agricultural fintech platform Agriarche secured $3.5 million in strategic debt and equity to bolster its grain trade logistics and warehousing receipt infrastructure throughout Kano, Jigawa, and Bauchi states.
    `,
    coverImage: "/assets/news-tomato-jos.jpg",
    category: "Business",
    tags: ["Agriculture", "Investment", "Food Security", "Kaduna"],
    author: AUTHORS[1],
    publishedAt: "July 14, 2026",
    readTime: "4 min read",
    isLatest: true,
    isPopular: true,
    popularRank: 1,
    views: 3890,
    commentsCount: 1,
  },
  {
    id: "art-3",
    slug: "turning-northern-nigerias-climate-challenge-into-startup-opportunity",
    title: "Turning Northern Nigeria’s Climate Challenge into a Startup Opportunity",
    excerpt: "Ideas, Innovation, and impact - how startups are building climate-smart solutions. Northern communities are facing a dual threat with rising temperatures and severe droughts.",
    content: `
Northern communities are facing a dual threat. While rising temperatures contribute to severe droughts, the rainy seasons have become shorter and more intense, often leading to flash floods that destroy crop yields.

Yet, amidst these ecological hurdles, a new generation of climate-tech startups is turning environmental vulnerability into scalable technological innovation. From solar-powered cold storage hubs in rural marketplaces to AI-driven drought forecasting tools tailored for Hausa-speaking farmers, innovation is thriving where adversity is highest.
    `,
    coverImage: "/assets/trending-hero.jpg",
    category: "Technology",
    tags: ["Climate Tech", "Sustainability", "Agritech", "Green Energy"],
    author: AUTHORS[2],
    publishedAt: "July 13, 2024",
    readTime: "5 min read",
    isLatest: true,
    isTrending: true,
    isPopular: true,
    popularRank: 2,
    views: 3120,
    commentsCount: 0,
  },
  {
    id: "art-4",
    slug: "gitex-nigeria-west-africas-biggest-tech-gathering-is-back",
    title: "GITEX Nigeria: West Africa’s Biggest Tech Gathering is Back",
    excerpt: "GITEX Nigeria returns with renewed focus on Artificial Intelligence, public-private digital infrastructure, and cross-border tech partnerships between Africa and the Gulf.",
    content: `
GITEX Nigeria has officially announced its return, establishing a multi-city presence across Abuja and Lagos. Over 10,000 delegates, including government officials, tech unicorns, and international sovereign wealth funds, are set to deliberate on the digital future of Africa.

With the federal government’s drive toward digital exports and AI adoption, this year's summit promises unprecedented exposure for homegrown northern innovators and technology hubs.
    `,
    coverImage: "/assets/news-gitex.jpg",
    category: "Technology",
    tags: ["Conferences", "Global Tech", "GITEX", "Abuja"],
    author: AUTHORS[3],
    publishedAt: "June 22, 2024",
    readTime: "3 min read",
    isLatest: true,
    isPopular: true,
    popularRank: 3,
    views: 2840,
    commentsCount: 0,
  },
  {
    id: "art-5",
    slug: "yare-platform-making-digital-content-accessible-in-african-languages",
    title: "YARE: The Platform Making Digital Content Accessible in African Languages",
    excerpt: "For millions of young people across Northern Nigeria, the digital economy is now opening up in Hausa and indigenous tongues through YARE's innovative localisation engine.",
    content: `
For millions of young people across Northern Nigeria, navigating software documentation, financial interfaces, and educational courses has long been hampered by linguistic barriers.

YARE is transforming this paradigm by deploying high-accuracy neural translation models tailored specifically for Hausa, Fulfulde, Kanuri, and Nupe, allowing tech platforms and government agencies to localize digital services with unprecedented cultural fluency.
    `,
    coverImage: "/assets/news-hausa-digital.png",
    category: "Features",
    tags: ["Indigenous Tech", "Localization", "Hausa", "AI"],
    author: AUTHORS[4],
    publishedAt: "June 18, 2024",
    readTime: "5 min read",
    isLatest: true,
    isPopular: true,
    popularRank: 4,
    views: 2470,
    commentsCount: 0,
  },
  {
    id: "art-6",
    slug: "nigerian-founder-wins-prestigious-oxford-skoll-scholarship",
    title: "Nigerian Founder Wins Prestigious Oxford Skoll Scholarship",
    excerpt: "Celebrating transformational social entrepreneurship, the Oxford Skoll Centre awards full fellowship to founder addressing education inequality across Northern Nigeria.",
    content: `
The Skoll Centre for Social Entrepreneurship at the University of Oxford’s Saïd Business School has awarded its prestigious Skoll Scholarship to prominent northern Nigerian educational innovator Maryam Sanusi.

Her initiative, which has equipped over 45,000 adolescent girls with foundational literacy and computer programming skills in non-formal learning centers, was selected from hundreds of global candidates.
    `,
    coverImage: "/assets/news-oxford-skoll.jpg",
    category: "News",
    tags: ["Education", "Scholarships", "Social Enterprise", "Global Recognition"],
    author: AUTHORS[1],
    publishedAt: "June 14, 2024",
    readTime: "4 min read",
    isLatest: true,
    views: 2190,
    commentsCount: 0,
  },
  {
    id: "art-7",
    slug: "why-startup-kanos-climate-innovation-push-matters-for-northern-nigeria",
    title: "Why Startup Kano’s Climate Innovation Push Matters for Northern Nigeria",
    excerpt: "“Northern communities are facing a dual threat. While rising temperatures contribute to severe droughts, the rainy seasons have become shorter and more intense, often leading to flash floods that destroy …",
    content: `
Startup Kano, one of Northern Nigeria’s premier incubation and acceleration hubs, has officially inaugurated its Climate Innovation Fellowship.

The initiative aims to nurture early-stage climate innovators with seed micro-grants, prototyping spaces, and direct links to international climate finance syndicates. As the Sahelian desertification creeps southward, local engineering initiatives are providing practical, community-owned solutions.
    `,
    coverImage: "/assets/news-startup-kano.png",
    category: "Technology",
    tags: ["Startup Kano", "Incubation", "Ecosystem", "Kano"],
    author: AUTHORS[5],
    publishedAt: "July 14, 2026",
    readTime: "5 min read",
    isEditorsPick: true,
    views: 1850,
    commentsCount: 0,
  },
  {
    id: "art-8",
    slug: "breaking-language-barrier-da-hausa-initiatives-push-for-digital-inclusion",
    title: "Breaking the Language Barrier: Inside Da Hausa Initiative’s Push for Digital and Financial Inclusion",
    excerpt: "For millions of young people across Northern Nigeria, the digital economy is a difficult concept, it is not coming with ease, clarity and largely in a language that is not …",
    content: `
Language should never be an obstacle to economic self-determination. The Da Hausa Initiative has launched a series of open-access audio, video, and text courses demystifying web development, fintech tools, and digital accounting in conversational Hausa.

Over 120,000 learners have already graduated through their micro-credential bootcamps across 14 northern states, signaling an appetite for vernacular technology education.
    `,
    coverImage: "/assets/news-hausa-barrier.jpg",
    category: "Features",
    tags: ["Inclusion", "Hausa Language", "Education", "Digital Economy"],
    author: AUTHORS[6],
    publishedAt: "July 14, 2026",
    readTime: "4 min read",
    isEditorsPick: true,
    views: 1980,
    commentsCount: 0,
  },
  {
    id: "art-9",
    slug: "sabou-capital-invests-2m-tomato-jos-local-production",
    title: "Sabou Capital Invests $2m In Tomato Jos As Nigeria Moves To Cut Tomato Paste Imports",
    excerpt: "Sabou Capital has announced a $2 million impact-linked debt investment in Tomato Jos Farming and Processing Limited, in a move aimed at strengthening local tomato production and reducing Nigeria’s dependence …",
    content: `
Nigeria currently expends hundreds of millions of dollars annually importing processed tomato concentrate despite being Africa's second-largest producer of fresh tomatoes.

By backing Tomato Jos's state-of-the-art cold chain and processing hub, Sabou Capital is setting a benchmark for catalytic private equity that blends healthy commercial returns with verifiable food security impact.
    `,
    coverImage: "/assets/news-sabou-capital.jpg",
    category: "Business",
    tags: ["Agribusiness", "Industrialization", "Private Equity", "Kaduna"],
    author: AUTHORS[1],
    publishedAt: "July 14, 2026",
    readTime: "4 min read",
    isEditorsPick: true,
    views: 2210,
    commentsCount: 0,
  },
  {
    id: "art-10",
    slug: "nitda-opens-applications-digital-export-acceleration-programme",
    title: "NITDA Opens Applications for Digital Export Acceleration Programme Pilot Cohort",
    excerpt: "The National Information Technology Development Agency (NITDA), through the Office of Nigerian Digital Innovation (ONDI) and the Digital Trade Desk under the Federal Ministry of Communications, Innovation and Digital Economy …",
    content: `
The National Information Technology Development Agency (NITDA), through the Office of Nigerian Digital Innovation (ONDI) and the Digital Trade Desk, has officially invited applications for the maiden cohort of the Digital Export Acceleration Programme (DEAP).

The initiative provides structured market-entry support, international certification subsidies, and legal structuring assistance for Nigerian software developers, digital agencies, and BPO companies aiming to serve North American and European clients.
    `,
    coverImage: "/assets/news-nitda-export.jpg",
    category: "News",
    tags: ["Policy", "NITDA", "Digital Export", "Government"],
    author: AUTHORS[3],
    publishedAt: "July 14, 2026",
    readTime: "3 min read",
    isEditorsPick: true,
    views: 1640,
    commentsCount: 0,
  }
];
