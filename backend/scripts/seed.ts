import { createStrapi, type Core } from '@strapi/strapi';
import { Buffer } from 'node:buffer';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import path from 'node:path';

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  categorySlug: string;
  stock: number;
  featured: boolean;
  imageSeed: string;
};

const categoriesData = [
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices, and tech accessories' },
  { name: 'Clothing', slug: 'clothing', description: 'Fashion apparel for men and women' },
  { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor, and home essentials' },
  { name: 'Books', slug: 'books', description: 'Fiction, non-fiction, and educational' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear, equipment, and activewear' },
];

const productsData: SeedProduct[] = [
  { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Premium over-ear wireless headphones with hybrid active noise cancellation and 30-hour battery life.', price: 19900, comparePrice: 24900, categorySlug: 'electronics', stock: 50, featured: true, imageSeed: 'aurastore-headphones' },
  { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness tracker with heart-rate monitor, built-in GPS, sleep tracking, and 7-day battery life.', price: 14900, categorySlug: 'electronics', stock: 30, featured: true, imageSeed: 'aurastore-watch' },
  { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', description: 'Portable waterproof Bluetooth speaker with deep bass, 360-degree sound, and 12-hour playtime.', price: 5900, comparePrice: 7900, categorySlug: 'electronics', stock: 100, featured: false, imageSeed: 'aurastore-speaker' },
  { name: 'Cotton T-Shirt', slug: 'cotton-tshirt', description: 'Soft 100% organic cotton tee in a classic everyday fit. Available in multiple colors.', price: 2499, comparePrice: 3499, categorySlug: 'clothing', stock: 200, featured: true, imageSeed: 'aurastore-tshirt' },
  { name: 'Denim Jacket', slug: 'denim-jacket', description: 'Classic denim jacket cut for a modern, easy fit. Pairs with anything, layer-friendly.', price: 8900, categorySlug: 'clothing', stock: 40, featured: false, imageSeed: 'aurastore-jacket' },
  { name: 'Running Shoes', slug: 'running-shoes', description: 'Lightweight road runners with responsive cushioning and breathable mesh upper.', price: 12900, comparePrice: 17900, categorySlug: 'sports-outdoors', stock: 60, featured: true, imageSeed: 'aurastore-shoes' },
  { name: 'Scented Candle Set', slug: 'scented-candle-set', description: 'Set of three hand-poured soy-wax candles with cotton wicks and warm, long-lasting fragrance.', price: 3900, categorySlug: 'home-living', stock: 45, featured: false, imageSeed: 'aurastore-candles' },
  { name: 'Throw Blanket', slug: 'throw-blanket', description: 'Plush, ultra-soft microfiber throw blanket. Machine washable and wrinkle-resistant.', price: 6900, categorySlug: 'home-living', stock: 80, featured: true, imageSeed: 'aurastore-blanket' },
  { name: 'Plant Pot Set', slug: 'plant-pot-set', description: 'Set of three ceramic indoor planters with drainage holes and matching saucers.', price: 4900, categorySlug: 'home-living', stock: 35, featured: false, imageSeed: 'aurastore-pots' },
  { name: 'The Art of Coding', slug: 'the-art-of-coding', description: 'A comprehensive guide to writing clean, maintainable, production-ready code.', price: 3499, comparePrice: 4999, categorySlug: 'books', stock: 120, featured: true, imageSeed: 'aurastore-book1' },
  { name: 'Design Patterns', slug: 'design-patterns', description: 'Modern software design patterns explained for real-world web and backend systems.', price: 3999, comparePrice: 5499, categorySlug: 'books', stock: 90, featured: false, imageSeed: 'aurastore-book2' },
  { name: 'JavaScript: The Good Parts', slug: 'javascript-good-parts', description: 'A focused look at the most powerful, elegant features of the JavaScript language.', price: 2999, categorySlug: 'books', stock: 150, featured: false, imageSeed: 'aurastore-book3' },
  { name: 'Yoga Mat', slug: 'yoga-mat', description: 'Non-slip eco-friendly yoga mat with carrying strap and alignment guide.', price: 7900, comparePrice: 9900, categorySlug: 'sports-outdoors', stock: 65, featured: true, imageSeed: 'aurastore-yoga' },
  { name: 'Water Bottle', slug: 'water-bottle', description: 'Vacuum-insulated stainless-steel water bottle. Keeps drinks cold for 24 hours or hot for 12.', price: 3499, categorySlug: 'sports-outdoors', stock: 200, featured: false, imageSeed: 'aurastore-bottle' },
  { name: 'Resistance Bands Set', slug: 'resistance-bands-set', description: 'Set of five resistance bands with stackable tension levels from light to extra-heavy.', price: 2999, comparePrice: 4499, categorySlug: 'sports-outdoors', stock: 85, featured: false, imageSeed: 'aurastore-bands' },
];

const ASSETS_DIR = path.join(process.cwd(), 'scripts', 'assets');

async function ensureAssetsDir() {
  await mkdir(ASSETS_DIR, { recursive: true });
}

async function fetchImageToDisk(seed: string): Promise<{ filePath: string; mime: string; ext: string }> {
  const ext = 'jpg';
  const filePath = path.join(ASSETS_DIR, `${seed}.${ext}`);
  try {
    // Skip re-download if a previous run already cached this image on disk.
    await access(filePath, FS.F_OK);
    return { filePath, mime: 'image/jpeg', ext };
  } catch {
    /* download */
  }
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Image fetch failed for ${seed}: HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  await writeFile(filePath, Buffer.from(ab));
  return { filePath, mime: 'image/jpeg', ext };
}

async function getOrUploadImage(
  strapi: Core.Strapi,
  productSlug: string,
  seed: string,
): Promise<number> {
  const existing = await strapi.db.query('plugin::upload.file').findOne({
    where: { name: `${productSlug}-${seed}` },
  });
  if (existing?.id) return existing.id as number;

  const { filePath, mime, ext } = await fetchImageToDisk(seed);
  const fileService = strapi.plugin('upload').service('file');
  const uploaded: any = await fileService.upload({
    data: { fileInfo: { name: `${productSlug}-${seed}`, alternativeText: productSlug } },
    files: {
      name: `${productSlug}-${seed}`,
      alternativeText: productSlug,
      ext,
      mime,
      size: require('node:fs').statSync(filePath).size,
      filepath: filePath,
    } as any,
  });
  const fileId = Array.isArray(uploaded) ? uploaded[0]?.id : uploaded?.id;
  if (!fileId) throw new Error(`Upload returned no id for ${productSlug}`);
  return fileId as number;
}

async function seed() {
  await ensureAssetsDir();
  console.log('[1/3] Pre-downloading product images in parallel...');
  await Promise.all(productsData.map((p) => fetchImageToDisk(p.imageSeed)));
  console.log('[2/3] Starting Strapi...');
  const app = await createStrapi().load();

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const existing = await app.documents('api::category.category').findFirst({
      filters: { slug: { $eq: cat.slug } },
    });
    if (existing) {
      categoryMap[cat.slug] = existing.documentId;
      await app.documents('api::category.category').update({
        documentId: existing.documentId,
        data: { description: cat.description },
        status: 'published',
      });
    } else {
      const created = await app.documents('api::category.category').create({
        data: { name: cat.name, slug: cat.slug, description: cat.description },
        status: 'published',
      });
      categoryMap[cat.slug] = created.documentId;
    }
  }

  console.log('[3/3] Uploading images and attaching to products...');
  for (const prod of productsData) {
    const fileId = await getOrUploadImage(app as unknown as Core.Strapi, prod.slug, prod.imageSeed);

    const existing = await app.documents('api::product.product').findFirst({
      filters: { slug: { $eq: prod.slug } },
      status: 'published',
    });

    const data: Record<string, unknown> = {
      description: prod.description,
      price: prod.price,
      comparePrice: prod.comparePrice ?? null,
      stock: prod.stock ?? 0,
      featured: prod.featured ?? false,
      category: categoryMap[prod.categorySlug],
      images: [fileId],
    };

    if (existing) {
      await app.documents('api::product.product').update({
        documentId: existing.documentId,
        data: data as any,
        status: 'published',
      });
    } else {
      await app.documents('api::product.product').create({
        data: { name: prod.name, slug: prod.slug, ...data } as any,
        status: 'published',
      });
    }
  }

  console.log(
    `Seed complete: ${categoriesData.length} categories, ${productsData.length} products (all published), ${productsData.length} images uploaded.`,
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
