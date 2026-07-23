import { createStrapi, type Core } from '@strapi/strapi';

const SEED_USER = 'user_test_123';

const HEADPHONES_DOC = 'wireless-headphones'; // looked up by slug at seed-time
const BOTTLE_DOC = 'water-bottle';
const HEADPHONES_PRICE_CENTS = 19900; // $199.00, Phase 1 cents convention
const BOTTLE_PRICE_CENTS = 3499;       // $34.99, Phase 1 cents convention

const PAID_ADDRESS = {
  fullName: 'Jane Doe',
  street: '221B Baker Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  country: 'India',
};

async function seed() {
  const app = await createStrapi().load();

  // Resolve the products we'll attach as snapshot line items.
  async function findProduct(slug: string) {
    const prod = await app.documents('api::product.product').findFirst({
      filters: { slug: { $eq: slug } },
      fields: ['name', 'price', 'slug'],
      populate: { images: { fields: ['url'] } },
    });
    if (!prod) throw new Error(`Product not found by slug: ${slug}`);
    return prod;
  }

  const headphones = await findProduct(HEADPHONES_DOC);
  const bottle = await findProduct(BOTTLE_DOC);

  // Phase 1 ships these slugs; image API can vary but is captured for diagnostic.
  const headphonesImage = ((headphones as any).images?.[0]?.url ?? null) as string | null;
  const bottleImage = ((bottle as any).images?.[0]?.url ?? null) as string | null;
  const headphonesName = String(headphones.name ?? '');
  const bottleName = String(bottle.name ?? '');

  // Idempotency: delete prior seed rows for the test user.
  const existing = await app.documents('api::order.order').findMany({
    filters: { clerkUserId: { $eq: SEED_USER } },
    fields: ['documentId'],
  });
  for (const doc of existing) {
    await app.documents('api::order.order').delete({ documentId: doc.documentId });
    console.log(`  Removed existing seed order ${doc.documentId}`);
  }

  // ord_paid_1 — 2 x Wireless Headphones, status 'paid'.
  const paidItems = [
    {
      productId: String(headphones.documentId ?? ''),
      name: headphonesName,
      price: HEADPHONES_PRICE_CENTS,
      qty: 2,
      image: headphonesImage,
    },
  ];
  await app.documents('api::order.order').create({
    data: {
      clerkUserId: SEED_USER,
      items: paidItems,
      total: HEADPHONES_PRICE_CENTS * 2,
      status: 'paid',
      paymentId: 'pay_test_seed_1',
      razorpayOrderId: 'order_test_seed_1',
      address: PAID_ADDRESS,
      email: 'testuser+clerk_test@example.com',
    },
    status: 'published',
  });
  console.log('  Created ord_paid_1 (paid)');

  // ord_pending_1 — 1 x Water Bottle, status 'pending'.
  const pendingItems = [
    {
      productId: String(bottle.documentId ?? ''),
      name: bottleName,
      price: BOTTLE_PRICE_CENTS,
      qty: 1,
      image: bottleImage,
    },
  ];
  await app.documents('api::order.order').create({
    data: {
      clerkUserId: SEED_USER,
      items: pendingItems,
      total: BOTTLE_PRICE_CENTS * 1,
      status: 'pending',
      razorpayOrderId: 'order_test_seed_pending_1',
      paymentId: undefined,
      address: PAID_ADDRESS,
      email: 'testuser+clerk_test@example.com',
    },
    status: 'published',
  });
  console.log('  Created ord_pending_1 (pending)');

  const count = await app.documents('api::order.order').count({
    filters: { clerkUserId: { $eq: SEED_USER } },
  });
  console.log(
    `Seed complete: ${count} orders for clerkUserId=${SEED_USER} ` +
    `(1 paid with 2 x ${HEADPHONES_DOC}, 1 pending with 1 x ${BOTTLE_DOC}).`,
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
