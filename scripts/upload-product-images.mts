import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const STRAPI = 'http://localhost:1337';
const TOKEN =
  '7c1633f10dd5cde0c5825801036e307203cf16b55c7d6c889fbb10a87a8b055dc521bedccb1a6c1a22d11c091a398ad1e254f7d24f7f058c1cb60209d50e236f9827e67f6844788c96aa2d7129bba9556fa8f3555117a985eb7a0332c640c2e6f9e9c3f9ff10d8b2d3e3fbca9d2feb651c884f4c6efd29baad10e51b4eedde4d';

const ASSETS_DIR = path.join(process.cwd(), '.tmp', 'product-images');

type ProductImage = {
  slug: string;
  name: string;
  photoId: string;
  fileName: string;
  alt: string;
};

const productImages: ProductImage[] = [
  { slug: 'wireless-headphones', name: 'Wireless Headphones', photoId: '1505740420928-5e560c06d30e', fileName: 'wireless-headphones.jpg', alt: 'Black over-ear wireless headphones' },
  { slug: 'smart-watch', name: 'Smart Watch', photoId: '1523275335684-37898b6baf30', fileName: 'smart-watch.jpg', alt: 'Smart watch with fitness band' },
  { slug: 'bluetooth-speaker', name: 'Bluetooth Speaker', photoId: '1563203425-a1c5aeeb2e94', fileName: 'bluetooth-speaker.jpg', alt: 'Portable Bluetooth speaker' },
  { slug: 'cotton-tshirt', name: 'Cotton T-Shirt', photoId: '1521572163474-6864f9cf17ab', fileName: 'cotton-tshirt.jpg', alt: 'Cotton t-shirt' },
  { slug: 'denim-jacket', name: 'Denim Jacket', photoId: '1551537482-f2075a1d41f2', fileName: 'denim-jacket.jpg', alt: 'Classic denim jacket' },
  { slug: 'running-shoes', name: 'Running Shoes', photoId: '1542291026-7eec264c27ff', fileName: 'running-shoes.jpg', alt: 'Athletic running shoes' },
  { slug: 'scented-candle-set', name: 'Scented Candle Set', photoId: '1574266742257-41460b7992ee', fileName: 'scented-candle-set.jpg', alt: 'Soy wax scented candles' },
  { slug: 'throw-blanket', name: 'Throw Blanket', photoId: '1592078615290-033ee584e267', fileName: 'throw-blanket.jpg', alt: 'Soft throw blanket folded' },
  { slug: 'plant-pot-set', name: 'Plant Pot Set', photoId: '1459411552884-841db9b3cc2a', fileName: 'plant-pot-set.jpg', alt: 'Set of ceramic plant pots with green plants' },
  { slug: 'the-art-of-coding', name: 'The Art of Coding', photoId: '1532012197267-da84d127e765', fileName: 'the-art-of-coding.jpg', alt: 'Open programming book on desk' },
  { slug: 'design-patterns', name: 'Design Patterns', photoId: '1544716278-ca5e3f4abd8c', fileName: 'design-patterns.jpg', alt: 'Stack of programming books' },
  { slug: 'javascript-good-parts', name: 'JavaScript: The Good Parts', photoId: '1543007630-9710e4a00a20', fileName: 'javascript-good-parts.jpg', alt: 'JavaScript reference book cover' },
  { slug: 'yoga-mat', name: 'Yoga Mat', photoId: '1599447421416-3414500d18a5', fileName: 'yoga-mat.jpg', alt: 'Rolled yoga mat with strap' },
  { slug: 'water-bottle', name: 'Water Bottle', photoId: '1602143407151-7111542de6e8', fileName: 'water-bottle.jpg', alt: 'Insulated stainless steel water bottle' },
  { slug: 'resistance-bands-set', name: 'Resistance Bands Set', photoId: '1518611012118-696072aa579a', fileName: 'resistance-bands-set.jpg', alt: 'Set of resistance bands' },
];

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${TOKEN}`, ...extra };
}

async function probeUnsplash(photoId: string): Promise<boolean> {
  const url = `https://images.unsplash.com/photo-${photoId}?w=200&fit=crop`;
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchUnsplashImage(photoId: string): Promise<{ buf: ArrayBuffer; mime: string }> {
  const url = `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&q=80&auto=format`;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'curl/8.7.1', Accept: 'image/jpeg,image/*' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1000) throw new Error(`tiny payload ${buf.byteLength}B`);
      const mime = res.headers.get('content-type') ?? 'image/jpeg';
      return { buf, mime };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error(`Unsplash fetch failed for ${photoId} after retries: ${(lastErr as Error)?.message}`);
}

async function saveLocally(buf: ArrayBuffer, fileName: string) {
  mkdirSync(ASSETS_DIR, { recursive: true });
  await writeFileSync(path.join(ASSETS_DIR, fileName), Buffer.from(buf));
}

async function findProduct(slug: string) {
  const url = `${STRAPI}/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`lookup ${slug}: HTTP ${res.status}`);
  const json = (await res.json()) as any;
  const hit = json?.data?.[0];
  if (!hit) throw new Error(`product ${slug} not found`);
  return hit as { documentId: string; id: number };
}

async function deleteExistingUploadByName(name: string): Promise<void> {
  const url = `${STRAPI}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return;
  const json = (await res.json()) as any;
  const files: Array<{ id: number }> = json ?? [];
  for (const f of files) {
    await fetch(`${STRAPI}/api/upload/files/${f.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {});
  }
}

async function deleteExistingUploadByHash(hint: string): Promise<void> {
  const url = `${STRAPI}/api/upload/files?filters[alternativeText][$eq]=${encodeURIComponent(hint)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return;
  const json = (await res.json()) as any;
  const files: Array<{ id: number }> = json ?? [];
  for (const f of files) {
    await fetch(`${STRAPI}/api/upload/files/${f.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {});
  }
}

async function uploadImage(buf: ArrayBuffer, mime: string, fileName: string, alt: string): Promise<number> {
  const form = new FormData();
  form.append('files', new Blob([buf], { type: mime }), fileName);
  form.append('fileInfo', JSON.stringify({ name: fileName, alternativeText: alt }));
  const res = await fetch(`${STRAPI}/api/upload`, { method: 'POST', headers: authHeaders(), body: form });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`upload ${fileName}: HTTP ${res.status} ${t.slice(0, 300)}`);
  }
  const arr = (await res.json()) as Array<{ id: number; name: string }>;
  if (!arr || arr.length === 0) throw new Error(`upload ${fileName}: empty response`);
  return arr[0].id as number;
}

async function attachImageToProduct(documentId: string, fileId: number) {
  const res = await fetch(`${STRAPI}/api/products/${documentId}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ data: { images: [fileId] } }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`attach to ${documentId}: HTTP ${res.status} ${t.slice(0, 300)}`);
  }
}

async function main() {
  console.log('[1/4] Probing all Unsplash IDs in parallel...');
  const probeResults = await Promise.all(productImages.map(async (p) => ({ slug: p.slug, ok: await probeUnsplash(p.photoId) })));
  const dead = probeResults.filter((r) => !r.ok);
  if (dead.length > 0) {
    console.log('[fail] Dead Unsplash IDs:');
    for (const d of dead) console.log(`  - ${d.slug}`);
    process.exit(2);
  }
  console.log('[1/4] All 15 IDs return 200.');

  console.log('[2/4] Deleting old uploads (picsum aurastore-*) ...');
  for (const p of productImages) {
    await deleteExistingUploadByHash(p.slug).catch(() => {});
  }
  try {
    const list = await fetch(`${STRAPI}/api/upload/files?pagination[pageSize]=100`, { headers: authHeaders() });
    if (list.ok) {
      const arr = (await list.json()) as Array<{ id: number; name: string }>;
      for (const f of arr) {
        if (f.name.startsWith('aurastore-')) {
          await fetch(`${STRAPI}/api/upload/files/${f.id}`, { method: 'DELETE', headers: authHeaders() }).catch(() => {});
        }
      }
    }
  } catch {}

  console.log('[3/4] Downloading curated product images from Unsplash (serial, with retry)...');
  const downloaded = new Map<string, { buf: ArrayBuffer; mime: string }>();
  for (const p of productImages) {
    try {
      const { buf, mime } = await fetchUnsplashImage(p.photoId);
      downloaded.set(p.slug, { buf, mime });
      await saveLocally(buf, p.fileName);
      console.log(`  [down] ${p.slug.padEnd(28)} ${buf.byteLength}B`);
    } catch (e: any) {
      console.log(`  [fail] ${p.slug}: ${e.message}`);
    }
  }

  console.log('[4/4] Uploading + attaching to Strapi products (serial)...');
  let ok = 0;
  let failed = 0;
  for (const p of productImages) {
    try {
      const product = await findProduct(p.slug);
      let d = downloaded.get(p.slug);
      if (!d) d = await fetchUnsplashImage(p.photoId);
      const fileId = await uploadImage(d.buf, d.mime, p.fileName, p.alt);
      await attachImageToProduct(product.documentId, fileId);
      console.log(`  [ok]   ${p.slug.padEnd(28)} (${p.name}) -> file id ${fileId}`);
      ok++;
    } catch (e: any) {
      console.log(`  [fail] ${p.slug}: ${e.message}`);
      if (e.cause) console.log(`    cause: ${(e.cause as any)?.message ?? e.cause}`);
      failed++;
    }
  }
  console.log(`[done] ${ok} ok, ${failed} failed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
