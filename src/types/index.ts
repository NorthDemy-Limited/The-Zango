export interface Author {
  id: string;
  name: string;
  slug: string;
  role: string;
  avatar?: string;
  bio?: string;
  location?: string;
  twitter?: string;
  linkedin?: string;
}

export interface Comment {
  id: string;
  articleSlug: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
  likes?: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags?: string[];
  author: Author;
  publishedAt: string;
  readTime: string;
  isFeatured?: boolean;
  isLatest?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  isEditorsPick?: boolean;
  popularRank?: number;
  views?: number;
  commentsCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  status?: "live" | "active" | "updated" | "breaking";
  lastUpdated?: string;
  isLive?: boolean;
}

export interface Subscriber {
  email: string;
  subscribedAt: string;
}
