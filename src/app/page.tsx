import { Hero } from '@/components/home/hero'
import { FeaturedProducts } from '@/components/home/featured-products'
import { ValueProps } from '@/components/home/value-props'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <FeaturedProducts />
    </>
  )
}
