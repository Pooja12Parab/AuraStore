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
})
