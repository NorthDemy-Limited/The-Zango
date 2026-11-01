export interface Author {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
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
  popularRank?: number;
  views?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface Subscriber {
  email: string;
  subscribedAt: string;
}
