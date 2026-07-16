import qs from 'qs'
import { strapiFetch } from './strapi'
import { queryOptions } from '@tanstack/react-query'
import type { StrapiCategory, StrapiListResponse, StrapiProduct } from '@/types/strapi'

const productPopulate = {
  images: { fields: ['url', 'alternativeText', 'width', 'height', 'formats'] },
  category: { fields: ['id', 'name', 'slug'] },
}

const categoryPopulate = {
  image: { fields: ['url', 'alternativeText'] },
}

export async function getProducts(params?: {
  category?: string
  sort?: string
}): Promise<StrapiListResponse<StrapiProduct>> {
  const query = qs.stringify(
    {
      populate: productPopulate,
      sort: params?.sort || 'name:asc',
      ...(params?.category && { filters: { category: { slug: { $eq: params.category } } } }),
    },
    { encodeValuesOnly: true }
  )
  return strapiFetch<StrapiListResponse<StrapiProduct>>(`/products?${query}`)
}

export async function getProductBySlug(slug: string): Promise<StrapiProduct> {
  const query = qs.stringify(
    { populate: productPopulate, filters: { slug: { $eq: slug } }, limit: 1 },
    { encodeValuesOnly: true }
  )
  const response = await strapiFetch<StrapiListResponse<StrapiProduct>>(`/products?${query}`)
  const product = response.data[0]
  if (!product) throw new Error(`Product not found: ${slug}`)
  return product
}

export async function getCategories(): Promise<StrapiListResponse<StrapiCategory>> {
  const query = qs.stringify({ populate: categoryPopulate }, { encodeValuesOnly: true })
  return strapiFetch<StrapiListResponse<StrapiCategory>>(`/categories?${query}`)
}

export async function getCategoryBySlug(slug: string): Promise<StrapiCategory> {
  const query = qs.stringify(
    { populate: categoryPopulate, filters: { slug: { $eq: slug } }, limit: 1 },
    { encodeValuesOnly: true }
  )
  const response = await strapiFetch<StrapiListResponse<StrapiCategory>>(`/categories?${query}`)
  const category = response.data[0]
  if (!category) throw new Error(`Category not found: ${slug}`)
  return category
}

export const productQueryOptions = (filters?: { category?: string }) =>
  queryOptions({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60_000,
  })

export const categoryQueryOptions = () =>
  queryOptions({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60_000,
  })
