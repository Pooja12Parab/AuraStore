const { createStrapi } = require('@strapi/strapi');

async function seed() {
  const app = await createStrapi().load();

  const categoriesData = [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices, and tech accessories' },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion apparel for men and women' },
    { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor, and home essentials' },
    { name: 'Books', slug: 'books', description: 'Fiction, non-fiction, and educational' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear, equipment, and activewear' },
  ];

  const productsData = [
    { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Premium noise-cancelling wireless headphones with 30-hour battery life.', price: 249900, comparePrice: 299900, categorySlug: 'electronics', stock: 50, featured: true },
    { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness tracker with heart rate monitor, GPS, and 7-day battery.', price: 129900, categorySlug: 'electronics', stock: 30, featured: true },
    { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', description: 'Portable waterproof speaker with deep bass and 12-hour playtime.', price: 49900, categorySlug: 'electronics', stock: 100, featured: false },
    { name: 'Cotton T-Shirt', slug: 'cotton-tshirt', description: 'Comfortable 100% organic cotton t-shirt. Available in multiple colors.', price: 79900, categorySlug: 'clothing', stock: 200, featured: true },
    { name: 'Denim Jacket', slug: 'denim-jacket', description: 'Classic denim jacket with a modern fit. Perfect for layering.', price: 299900, categorySlug: 'clothing', stock: 40, featured: false },
    { name: 'Running Shoes', slug: 'running-shoes', description: 'Lightweight running shoes with responsive cushioning and breathable mesh.', price: 899900, categorySlug: 'clothing', stock: 60, featured: true },
    { name: 'Scented Candle Set', slug: 'scented-candle-set', description: 'Set of 3 hand-poured soy wax candles.', price: 149900, categorySlug: 'home-living', stock: 45, featured: false },
    { name: 'Throw Blanket', slug: 'throw-blanket', description: 'Ultra-soft microfiber throw blanket. Machine washable.', price: 249900, categorySlug: 'home-living', stock: 80, featured: true },
    { name: 'Plant Pot Set', slug: 'plant-pot-set', description: 'Set of 3 ceramic plant pots with drainage holes.', price: 199900, categorySlug: 'home-living', stock: 35, featured: false },
    { name: 'The Art of Coding', slug: 'the-art-of-coding', description: 'A comprehensive guide to writing clean, maintainable code.', price: 49900, categorySlug: 'books', stock: 120, featured: true },
    { name: 'Design Patterns', slug: 'design-patterns', description: 'Modern design patterns for web applications.', price: 59900, categorySlug: 'books', stock: 90, featured: false },
    { name: 'JavaScript: The Good Parts', slug: 'javascript-good-parts', description: 'Deep dive into the best features of JavaScript.', price: 39900, categorySlug: 'books', stock: 150, featured: false },
    { name: 'Yoga Mat', slug: 'yoga-mat', description: 'Non-slip, eco-friendly yoga mat with carrying strap.', price: 299900, categorySlug: 'sports-outdoors', stock: 65, featured: true },
    { name: 'Water Bottle', slug: 'water-bottle', description: 'Insulated stainless steel water bottle. Keeps drinks cold for 24 hours.', price: 199900, categorySlug: 'sports-outdoors', stock: 200, featured: false },
    { name: 'Resistance Bands Set', slug: 'resistance-bands-set', description: 'Set of 5 resistance bands with different tension levels.', price: 149900, categorySlug: 'sports-outdoors', stock: 85, featured: false },
  ];

  const categoryMap: Record<string, number> = {};

  for (const cat of categoriesData) {
    const existing = await app.documents('api::category.category').findFirst({
      filters: { slug: { $eq: cat.slug } },
      status: 'published',
    });
    if (existing) {
      categoryMap[cat.slug] = existing.id;
      // Update description in case it was empty
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
      categoryMap[cat.slug] = created.id;
    }
  }

  for (const prod of productsData) {
    const existing = await app.documents('api::product.product').findFirst({
      filters: { slug: { $eq: prod.slug } },
      status: 'published',
    });
    if (existing) {
      await app.documents('api::product.product').update({
        documentId: existing.documentId,
        data: {
          description: prod.description,
          price: prod.price,
          comparePrice: prod.comparePrice || null,
          stock: prod.stock || 0,
          featured: prod.featured || false,
          category: categoryMap[prod.categorySlug],
        },
        status: 'published',
      });
      continue;
    }
    await app.documents('api::product.product').create({
      data: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        comparePrice: prod.comparePrice || null,
        stock: prod.stock || 0,
        featured: prod.featured || false,
        category: categoryMap[prod.categorySlug],
      },
      status: 'published',
    });
  }

  console.log(`Seed complete: ${categoriesData.length} categories, ${productsData.length} products (all published).`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });