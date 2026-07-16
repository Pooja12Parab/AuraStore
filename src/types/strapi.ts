export interface StrapiImage {
  id: number;
  url: string;
  alternativeText?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
}

export interface StrapiCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  image?: StrapiImage;
}

export interface StrapiProduct {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: StrapiImage[];
  category: StrapiCategory;
  stock?: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: Pagination;
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
}