import { factory, primaryKey } from '@mswjs/data'

export const db = factory({
  category: {
    id: primaryKey(Number),
    documentId: String,
    name: String,
    slug: String,
    description: String,
    image: Object,
  },
  product: {
    id: primaryKey(Number),
    documentId: String,
    name: String,
    slug: String,
    description: String,
    price: Number,
    comparePrice: Number,
    images: Array,
    category: Object,
    stock: Number,
    featured: Boolean,
  },
  order: {
    id: primaryKey(Number),
    documentId: String,
    clerkUserId: String,
    total: Number,
    status: String,
    paymentId: String,
    razorpayOrderId: String,
    email: String,
    items: Array,
    address: Object,
    createdAt: String,
    updatedAt: String,
  },
})

export type OrderSeedData = {
  documentId: string
  clerkUserId: string
  total: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentId?: string
  razorpayOrderId: string
  email: string
  items: Array<{ productId: string; name: string; price: number; qty: number; image: string | null }>
  address: {
    fullName: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export const orderPaidFixture: OrderSeedData = {
  documentId: 'ord_paid_1',
  clerkUserId: 'user_test_123',
  total: 39800,
  status: 'paid',
  paymentId: 'pay_test_seed_1',
  razorpayOrderId: 'order_test_seed_1',
  email: 'testuser+clerk_test@example.com',
  items: [
    { productId: 'prod_hp_1', name: 'Wireless Headphones', price: 19900, qty: 2, image: null },
  ],
  address: {
    fullName: 'Jane Doe',
    street: '221B Baker Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
  },
}

export const orderPendingFixture: OrderSeedData = {
  documentId: 'ord_pending_1',
  clerkUserId: 'user_test_123',
  total: 3499,
  status: 'pending',
  paymentId: null as unknown as string, // omitted in DB
  razorpayOrderId: 'order_test_seed_pending_1',
  email: 'testuser+clerk_test@example.com',
  items: [
    { productId: 'prod_btl_1', name: 'Water Bottle', price: 3499, qty: 1, image: null },
  ],
  address: {
    fullName: 'Jane Doe',
    street: '221B Baker Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
  },
}

