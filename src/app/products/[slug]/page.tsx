import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/strapi-queries'
import { ProductDetail } from '@/components/product/product-detail'

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  try {
    const product = await getProductBySlug((await params).slug)
    return { title: `${product.name} | AuraStore` }
  } catch {
    return { title: 'Product not found | AuraStore' }
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params
  let product
  try {
    product = await getProductBySlug(slug)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Product not found')) {
      notFound()
    }
    throw error
  }

  return <ProductDetail product={product} />
}

