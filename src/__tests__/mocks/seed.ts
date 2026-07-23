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
  // Phase 2: orders are seeded through factory fixtures so /api/orders
  // handlers have realistic data. Tests that need orders should call
  // seedOrdersForUser() or use the relevant fixture directly.
  db.order.create({
    id: 1,
    documentId: 'ord_paid_1',
    clerkUserId: 'user_test_123',
    total: 499800,
    status: 'paid',
    paymentId: 'pay_test_seed_1',
    razorpayOrderId: 'order_test_seed_1',
    email: 'testuser+clerk_test@example.com',
    items: [{ productId: 'prod1', name: 'Wireless Headphones', price: 249900, qty: 2, image: '/uploads/headphones.jpg' }],
    address: {
      fullName: 'Jane Doe',
      street: '221B Baker Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
    },
    createdAt: '2026-07-22T18:18:05.000Z',
    updatedAt: '2026-07-22T18:18:05.000Z',
  })
}
