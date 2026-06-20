'use strict';
process.chdir(require('path').join(__dirname, '../..'));
/**
 * seed-demo.js  –  run once to populate the DB with demo data.
 *
 *   node src/config/seed-demo.js           # skips if services already exist
 *   node src/config/seed-demo.js --force   # drops & re-seeds
 *
 * Every demo user has password: demo1234
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { v4: uuidv4 } = require('uuid');
const bcrypt          = require('bcryptjs');
const { initDB, run, get, all } = require('./database');

async function main() {
  await initDB();

  // ── Idempotency ────────────────────────────────────────────────────────────
  const row = await get('SELECT COUNT(*) AS n FROM services');
  if (row?.n > 0) {
    if (!process.argv.includes('--force')) {
      console.log('ℹ️  Demo data already present. Run with --force to re-seed.');
      process.exit(0);
    }
    // --force: wipe everything except categories
    for (const t of ['reviews','orders','messages','conversations','user_interests','service_images','services','users']) {
      await run(`DELETE FROM ${t}`);
    }
    console.log('⚠️  Cleared existing data (categories kept).');
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  const cats = await all('SELECT * FROM categories');
  if (cats.length === 0) { console.error('No categories – run initDB first.'); process.exit(1); }
  const catBySlug = Object.fromEntries(cats.map(c => [c.slug, c]));

  // ── Password ───────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('demo1234', 10);

  // ── Users ──────────────────────────────────────────────────────────────────
  const providerDefs = [
    { full_name: 'Can Yılmaz',   email: 'can.yilmaz@iyte.edu.tr',   dept: 'Mechanical Engineering', year: '3rd', bio: 'Varsity tennis player, coaching since 2021.' },
    { full_name: 'Deniz Arslan', email: 'deniz.arslan@iyte.edu.tr',  dept: 'Computer Engineering',   year: '4th', bio: 'Senior CS student — Python, Java, C++ tutor.' },
    { full_name: 'Melis Kaya',   email: 'melis.kaya@iyte.edu.tr',    dept: 'Industrial Design',      year: '3rd', bio: 'Knitting since age 10. Custom orders welcome.' },
    { full_name: 'Bora Tekin',   email: 'bora.tekin@iyte.edu.tr',    dept: 'Mathematics',            year: 'Grad', bio: 'Math TA — Calculus I & II, Linear Algebra.' },
    { full_name: 'Elif Şahin',   email: 'elif.sahin@iyte.edu.tr',    dept: 'Architecture',           year: '4th', bio: 'Architect-photographer. Studio-quality shots.' },
    { full_name: 'Mert Özdemir', email: 'mert.ozdemir@iyte.edu.tr',  dept: 'Music',                  year: '2nd', bio: 'Guitar and piano lessons, all levels.' },
    { full_name: 'Selin Aydın',  email: 'selin.aydin@iyte.edu.tr',   dept: 'Visual Arts',            year: '3rd', bio: 'Graphic designer — logos, UI, posters.' },
    { full_name: 'Kerem Çelik',  email: 'kerem.celik@iyte.edu.tr',   dept: 'German Language',        year: '4th', bio: 'Native German speaker. Erasmus prep.' },
  ];

  const buyerDefs = [
    { full_name: 'Refia Kılıç',  email: 'refia@iyte.edu.tr',         dept: 'Computer Engineering',   year: '2nd', bio: '' },
    { full_name: 'Ayşe Demir',   email: 'ayse.demir@iyte.edu.tr',    dept: 'Civil Engineering',      year: '1st', bio: '' },
  ];

  const uid = {};
  for (const u of [...providerDefs, ...buyerDefs]) {
    const id = uuidv4();
    uid[u.email] = id;
    const isProvider = providerDefs.some(p => p.email === u.email) ? 1 : 0;
    await run(
      `INSERT INTO users (id, full_name, email, password_hash, bio, department, year, is_verified, is_verified_student, is_provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      [id, u.full_name, u.email, hash, u.bio, u.dept, u.year, isProvider]
    );
  }

  // ── Services ───────────────────────────────────────────────────────────────
  const svcDefs = [
    // core — one per provider, covering most categories
    { email: 'can.yilmaz@iyte.edu.tr',   slug: 'tennis-coaching',    title: 'Tennis Coaching',            price: 150, unit: 'hour',    days: 1,
      desc: 'Experienced varsity player offering private lessons at campus courts for beginners and intermediate players. Includes technique drills, match play, and strategy tailored to your level.' },
    { email: 'deniz.arslan@iyte.edu.tr',  slug: 'coding-lessons',     title: 'Coding Lessons',              price: 200, unit: 'hour',    days: 1,
      desc: 'Python, Java, C++ and web development tutoring. Assignment help, project support and exam prep. Available online or at the library. All levels welcome.' },
    { email: 'melis.kaya@iyte.edu.tr',    slug: 'custom-knitting',    title: 'Custom Knitting',             price: 120, unit: 'item',    days: 4,
      desc: 'Handmade with premium Turkish wool. Custom patterns, sweaters, scarves, beanies — each piece unique. Delivery within 3–5 days.' },
    { email: 'bora.tekin@iyte.edu.tr',    slug: 'calculus-tutoring',  title: 'Calculus Tutoring',           price: 100, unit: 'hour',    days: 1,
      desc: 'Math TA covering Calculus I & II, Linear Algebra and Differential Equations. Visual explanations + practice problems. Great for midterm/final prep.' },
    { email: 'elif.sahin@iyte.edu.tr',    slug: 'photography',        title: 'Campus Photography',          price: 250, unit: 'session', days: 2,
      desc: 'Portrait and event photography on IYTE campus. Edited photos delivered within 48 hours. Perfect for LinkedIn profiles and student portfolios.' },
    { email: 'mert.ozdemir@iyte.edu.tr',  slug: 'instrument-lessons', title: 'Guitar & Piano Lessons',      price: 120, unit: 'hour',    days: 1,
      desc: 'Beginner to intermediate lessons in guitar and piano. Learn chords, scales, and songs you love. Flexible scheduling — campus music room available.' },
    { email: 'selin.aydin@iyte.edu.tr',   slug: 'graphic-design',     title: 'Graphic Design',              price: 180, unit: 'item',    days: 3,
      desc: 'Logo design, social media assets, UI mockups and posters. Adobe Illustrator and Figma. Fast turnaround for campus projects and clubs.' },
    { email: 'kerem.celik@iyte.edu.tr',   slug: 'language-exchange',  title: 'German Language Exchange',    price: 80,  unit: 'hour',    days: 1,
      desc: 'Native German speaker offering conversation practice and grammar sessions. Perfect for Erasmus prep, language electives, or just fun.' },

    // extras — richer marketplace
    { email: 'deniz.arslan@iyte.edu.tr',  slug: 'graphic-design',     title: 'UI/UX Prototyping',           price: 220, unit: 'item',    days: 3,
      desc: 'Figma prototypes for mobile and web apps. User-flow diagrams, wireframes and high-fidelity mockups for coursework or startup projects.' },
    { email: 'bora.tekin@iyte.edu.tr',    slug: 'coding-lessons',     title: 'Data Structures Tutoring',    price: 110, unit: 'hour',    days: 1,
      desc: 'Linked lists, trees, graphs, sorting algorithms and complexity analysis. Ideal for CS students preparing for algorithm exams or interviews.' },
    { email: 'elif.sahin@iyte.edu.tr',    slug: 'graphic-design',     title: 'Architecture Visualization',  price: 300, unit: 'item',    days: 5,
      desc: '3D renders and architectural drawings in AutoCAD and SketchUp. Portfolio-quality visuals for studio submissions or competitions.' },
    { email: 'melis.kaya@iyte.edu.tr',    slug: 'handmade-goods',     title: 'Handmade Accessories',        price: 50,  unit: 'item',    days: 3,
      desc: 'Custom bracelets, keychains and tote bags made to order. IYTE colours available. Great as gifts or souvenirs.' },
    { email: 'can.yilmaz@iyte.edu.tr',    slug: 'pet-sitting',        title: 'Pet Sitting',                 price: 60,  unit: 'day',     days: 1,
      desc: 'Dog walking and cat sitting in the campus area. Daily photo updates. Trusted and reliable — campus pet owner himself.' },
  ];

  const svcId = {};
  for (const s of svcDefs) {
    const cat = catBySlug[s.slug];
    if (!cat) { console.warn(`  ⚠  category not found: ${s.slug}`); continue; }
    const id = uuidv4();
    svcId[s.title] = id;
    await run(
      `INSERT INTO services (id, provider_id, category_id, title, description, price, price_unit, delivery_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, uid[s.email], cat.id, s.title, s.desc, s.price, s.unit, s.days]
    );
  }

  // ── Completed orders + reviews ─────────────────────────────────────────────
  const ordersToSeed = [
    { title: 'Tennis Coaching',        buyer: 'refia@iyte.edu.tr',       rating: 5, comment: 'Amazing coach! Improved my backhand in just 3 sessions. Highly recommended.' },
    { title: 'Tennis Coaching',        buyer: 'ayse.demir@iyte.edu.tr',  rating: 5, comment: 'Super patient and professional. Tamamdır indeed!' },
    { title: 'Coding Lessons',         buyer: 'ayse.demir@iyte.edu.tr',  rating: 5, comment: 'Explained recursion so clearly. Passed my midterm!' },
    { title: 'Calculus Tutoring',      buyer: 'refia@iyte.edu.tr',       rating: 5, comment: 'Finally understood integration by parts. Life saver!' },
    { title: 'Calculus Tutoring',      buyer: 'ayse.demir@iyte.edu.tr',  rating: 5, comment: 'Best tutor on campus. Clear explanations every time.' },
    { title: 'Custom Knitting',        buyer: 'refia@iyte.edu.tr',       rating: 5, comment: 'The scarf is so soft. Even helped me pick the right wool colour.' },
    { title: 'Guitar & Piano Lessons', buyer: 'ayse.demir@iyte.edu.tr',  rating: 4, comment: 'Great teacher, very patient. Learned 3 chords in the first session.' },
    { title: 'Campus Photography',     buyer: 'refia@iyte.edu.tr',       rating: 5, comment: 'Beautiful shots, delivered in 24 hours. Will definitely book again!' },
    { title: 'Graphic Design',         buyer: 'ayse.demir@iyte.edu.tr',  rating: 5, comment: 'Delivered exactly what I asked for, on time. Super professional.' },
  ];

  let daysAgo = 12;
  for (const o of ordersToSeed) {
    const serviceId = svcId[o.title];
    if (!serviceId) continue;
    const svc = await get('SELECT provider_id, price FROM services WHERE id = ?', [serviceId]);
    if (!svc) continue;

    const orderId = uuidv4();
    const completedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const completedAt = `NOW() - INTERVAL '${daysAgo} days'`;
    await run(
      `INSERT INTO orders (id, service_id, buyer_id, provider_id, status, price_at_order, completed_at, updated_at)
       VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)`,
      [orderId, serviceId, uid[o.buyer], svc.provider_id, svc.price, completedAt, completedAt]
    );
    await run('UPDATE services SET order_count = order_count + 1 WHERE id = ?', [serviceId]);

    const reviewId = uuidv4();
    await run(
      `INSERT INTO reviews (id, order_id, service_id, reviewer_id, provider_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, orderId, serviceId, uid[o.buyer], svc.provider_id, o.rating, o.comment]
    );

    // Recalculate service + provider ratings
    const sr = await get('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE service_id = ?', [serviceId]);
    await run('UPDATE services SET rating = ?, review_count = ? WHERE id = ?',
      [Math.round((sr.avg ?? 0) * 10) / 10, sr.cnt, serviceId]);

    const pr = await get('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE provider_id = ?', [svc.provider_id]);
    await run('UPDATE users SET rating = ?, review_count = ? WHERE id = ?',
      [Math.round((pr.avg ?? 0) * 10) / 10, pr.cnt, svc.provider_id]);

    daysAgo = Math.max(1, daysAgo - 1);
  }

  // ── Pending order (for Tamamdır! test) ────────────────────────────────────
  // Refia (buyer) → Coding Lessons → Deniz (provider)
  const pendingSvcId = svcId['Coding Lessons'];
  const refiaId      = uid['refia@iyte.edu.tr'];
  if (pendingSvcId && refiaId) {
    const svc = await get('SELECT provider_id, price FROM services WHERE id = ?', [pendingSvcId]);
    if (svc) {
      const pendingOrderId = uuidv4();
      await run(
        `INSERT INTO orders (id, service_id, buyer_id, provider_id, status, price_at_order, note)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
        [pendingOrderId, pendingSvcId, refiaId, svc.provider_id, svc.price,
         'Need help with my Python project this week — data structures assignment.']
      );

      // Conversation + messages between Refia ↔ Deniz
      const [pA, pB] = [refiaId, svc.provider_id].sort();
      const convId = uuidv4();
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await run(
        `INSERT INTO conversations (id, participant_a, participant_b, last_message, last_msg_at)
         VALUES (?, ?, ?, ?, ?)`,
        [convId, pA, pB, 'Sure! Send me your code and we can schedule a session.', thirtyMinsAgo]
         VALUES (?, ?, ?, ?, NOW() - INTERVAL '30 minutes')`,
        [convId, pA, pB, 'Sure! Send me your code and we can schedule a session.']
      );

      const chatMsgs = [
        { sender: refiaId,        text: "Hi! I need help with my Python data structures assignment. Can we schedule a session?" },
        { sender: svc.provider_id, text: "Of course! What topics are you struggling with?" },
        { sender: refiaId,        text: "Mostly linked lists and binary trees. The assignment is due Friday." },
        { sender: svc.provider_id, text: "No problem, I can help with those. Are you free tomorrow at 3pm in the library?" },
        { sender: refiaId,        text: "Yes, that works perfectly! I'll place an order now." },
        { sender: svc.provider_id, text: "Sure! Send me your code and we can schedule a session." },
      ];

      for (const m of chatMsgs) {
        await run('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)',
          [uuidv4(), convId, m.sender, m.text]);
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = {
    users:    (await get('SELECT COUNT(*) AS n FROM users')).n,
    services: (await get('SELECT COUNT(*) AS n FROM services')).n,
    orders:   (await get('SELECT COUNT(*) AS n FROM orders')).n,
    reviews:  (await get('SELECT COUNT(*) AS n FROM reviews')).n,
  };

  console.log('\n✅  Demo seed complete\n');
  console.log(`   Users     : ${counts.users} (${providerDefs.length} providers + ${buyerDefs.length} buyers)`);
  console.log(`   Services  : ${counts.services}`);
  console.log(`   Orders    : ${counts.orders} (${counts.orders - 1} completed + 1 pending)`);
  console.log(`   Reviews   : ${counts.reviews}`);
  console.log('\n   Test accounts (password: demo1234)');
  console.log('   Provider  : deniz.arslan@iyte.edu.tr  (has pending order → Tamamdır! test)');
  console.log('   Buyer     : refia@iyte.edu.tr         (placed the pending order)');
  console.log('   Any user  : can.yilmaz@iyte.edu.tr,  bora.tekin@iyte.edu.tr,  …\n');
  process.exit(0);
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
