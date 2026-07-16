import { db } from './factories'

export function seedTestData() {
const electronics = db.category.create({
    id: 1,
    documentId: 'cat1',
    name: 'Electronics',
    slug: 'electronics',
  })
  const clothing = db.category.create({
    id: 2,
    documentId: 'cat2',
    name: 'Clothing',
    slug: 'clothing',
  })
  db.product.create({
    id: 1,
    documentId: 'prod1',
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Premium noise-cancelling headphones',
    price: 249900,
    comparePrice: 299900,
    images: [{ url: '/uploads/headphones.jpg', alternativeText: 'Headphones' }],
    category: electronics,
    stock: 50,
    featured: true,
  })
  db.product.create({
    id: 2,
    documentId: 'prod2',
    name: 'Cotton T-Shirt',
    slug: 'cotton-tshirt',
    description: 'Comfortable cotton t-shirt',
    price: 79900,
    images: [{ url: '/uploads/tshirt.jpg', alternativeText: 'T-Shirt' }],
    category: clothing,
    stock: 100,
    featured: false,
  })
}
