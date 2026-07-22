import { readFileSync } from 'node:fs';
import path from 'node:path';

const STRAPI = 'http://localhost:1337';
const TOKEN =
  '7c1633f10dd5cde0c5825801036e307203cf16b55c7d6c889fbb10a87a8b055dc521bedccb1a6c1a22d11c091a398ad1e254f7d24f7f058c1cb60209d50e236f9827e67f6844788c96aa2d7129bba9556fa8f3555117a985eb7a0332c640c2e6f9e9c3f9ff10d8b2d3e3fbca9d2feb651c884f4c6efd29baad10e51b4eedde4d';

const SEED_FILE = path.join(process.cwd(), 'backend', 'scripts', 'seed.ts');

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${TOKEN}`, ...extra };
}

function parseSeed() {
  const src = readFileSync(SEED_FILE, 'utf8');
  const categories: Array<{ name: string; slug: string; description: string }> = [];
  const products: Array<{
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number;
    categorySlug: string;
    stock: number;
    featured: boolean;
  }> = [];

  const categoryRe = /\{\s*name:\s*'([^']+)',\s*slug:\s*'([^']+)',\s*description:\s*'([^']+)'\s*\}/g;
  for (const m of src.matchAll(categoryRe)) categories.push({ name: m[1], slug: m[2], description: m[3] });

  const productRe =
    /\{\s*name:\s*'([^']+)',\s*slug:\s*'([^']+)',\s*description:\s*'([^']+)',\s*price:\s*(\d+)(?:,\s*comparePrice:\s*(\d+))?,\s*categorySlug:\s*'([^']+)',\s*stock:\s*(\d+),\s*featured:\s*(true|false)/g;
  for (const m of src.matchAll(productRe)) {
    products.push({
      name: m[1],
      slug: m[2],
      description: m[3],
      price: Number(m[4]),
      comparePrice: m[5] ? Number(m[5]) : undefined,
      categorySlug: m[6],
      stock: Number(m[7]),
      featured: m[8] === 'true',
    });
  }
  return { categories, products };
}

async function findProduct(slug: string) {
  const res = await fetch(`${STRAPI}/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`lookup ${slug}: HTTP ${res.status}`);
  const j = (await res.json()) as any;
  return j.data?.[0] as { documentId: string } | undefined;
}

async function findCategory(slug: string) {
  const res = await fetch(`${STRAPI}/api/categories?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`lookup cat ${slug}: HTTP ${res.status}`);
  const j = (await res.json()) as any;
  return j.data?.[0] as { documentId: string } | undefined;
}

async function updateProduct(documentId: string, body: Record<string, unknown>) {
  const res = await fetch(`${STRAPI}/api/products/${documentId}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`update ${documentId}: HTTP ${res.status} ${t.slice(0, 200)}`);
  }
}

async function updateCategory(documentId: string, body: Record<string, unknown>) {
  const res = await fetch(`${STRAPI}/api/categories/${documentId}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`update cat ${documentId}: HTTP ${res.status} ${t.slice(0, 200)}`);
  }
}

async function main() {
  const { categories, products } = parseSeed();
  console.log(`[1/2] Parsed ${categories.length} categories, ${products.length} products from seed.ts`);

  console.log('[2/2] Updating Strapi...');
  let catOk = 0;
  for (const c of categories) {
    const found = await findCategory(c.slug);
    if (!found) { console.log(`  [skip] category ${c.slug} not found`); continue; }
    try {
      await updateCategory(found.documentId, { name: c.name, slug: c.slug, description: c.description });
      console.log(`  [cat-ok] ${c.slug}`);
      catOk++;
    } catch (e: any) {
      console.log(`  [cat-fail] ${c.slug}: ${e.message}`);
    }
  }

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const f = await findCategory(c.slug);
    if (f) categoryMap[c.slug] = f.documentId;
  }

  let pOk = 0;
  let pFail = 0;
  for (const p of products) {
    const found = await findProduct(p.slug);
    if (!found) { console.log(`  [skip] product ${p.slug} not found`); pFail++; continue; }
    try {
      await updateProduct(found.documentId, {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        featured: p.featured,
        category: categoryMap[p.categorySlug],
      });
      console.log(`  [prod-ok] ${p.slug.padEnd(28)} $${(p.price / 100).toFixed(2)} ${p.comparePrice ? 'compare $' + (p.comparePrice / 100).toFixed(2) : ''}`);
      pOk++;
    } catch (e: any) {
      console.log(`  [prod-fail] ${p.slug}: ${e.message}`);
      pFail++;
    }
  }
  console.log(`[done] categories: ${catOk}/${categories.length} ok, products: ${pOk} ok / ${pFail} failed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
