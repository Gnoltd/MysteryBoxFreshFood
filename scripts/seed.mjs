// Run: node scripts/seed.mjs
// Requires .env.seed with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// ── Load .env.seed ─────────────────────────────────────────────────────────────
const envPath = resolve(__dir, '../.env.seed')
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
} catch {
  console.error('❌  .env.seed not found. Copy .env.seed.example → .env.seed and fill in your values.')
  process.exit(1)
}

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('❌  Missing one of: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
  process.exit(1)
}

// ── Import firebase-admin from functions folder ────────────────────────────────
const { default: admin } = await import('../functions/node_modules/firebase-admin/lib/index.js')
const { v4: uuid } = await import('../functions/node_modules/uuid/dist/esm-node/index.js').catch(() =>
  import('../functions/node_modules/uuid/dist/cjs/index.js')
)

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})

const db = admin.firestore()
const auth = admin.auth()

// ── Helpers ────────────────────────────────────────────────────────────────────
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(rnd(8, 21), rnd(0, 59), rnd(0, 59))
  return admin.firestore.Timestamp.fromDate(d)
}

function todayAt(hour, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return admin.firestore.Timestamp.fromDate(d)
}

// ── Data ───────────────────────────────────────────────────────────────────────
const LISTINGS = [
  { title: 'Hộp Bánh Mì Sáng',           category: 'bakery',     price: 35_000, orig: 75_000,  desc: 'Hộp 5 ổ bánh mì thập cẩm thừa cuối ngày — giòn rụm, nhân đa dạng.' },
  { title: 'Túi Bánh Ngọt Mix',           category: 'bakery',     price: 45_000, orig: 95_000,  desc: 'Croissant, pain au chocolat và brioche còn tươi từ lò sáng.' },
  { title: 'Hộp Bánh Bao Hấp',           category: 'bakery',     price: 30_000, orig: 60_000,  desc: '6 chiếc bánh bao nhân thịt & trứng muối, hấp nóng lúc đóng gói.' },
  { title: 'Combo Bánh Mì Que & Bơ',     category: 'bakery',     price: 40_000, orig: 80_000,  desc: 'Bánh mì que giòn kèm hũ bơ pháp nhỏ — ăn sáng chuẩn vị.' },
  { title: 'Hộp Trái Cây Nhiệt Đới',     category: 'fruit',      price: 55_000, orig: 110_000, desc: 'Xoài, dứa, thanh long và chôm chôm tươi thu hoạch hôm nay.' },
  { title: 'Túi Cam Sành & Quýt',        category: 'fruit',      price: 40_000, orig: 80_000,  desc: '1 kg cam sành + 500g quýt miền Tây ngọt lịm, giàu vitamin C.' },
  { title: 'Mix Dâu Tây Đà Lạt',         category: 'fruit',      price: 65_000, orig: 130_000, desc: '500g dâu tây Đà Lạt loại 1 — dùng trực tiếp hoặc làm sinh tố.' },
  { title: 'Hộp Chuối & Bơ Chín',        category: 'fruit',      price: 35_000, orig: 65_000,  desc: '5 quả chuối sứ + 2 quả bơ chín mềm — combo dinh dưỡng lý tưởng.' },
  { title: 'Túi Rau Xanh Hằng Ngày',     category: 'vegetables', price: 30_000, orig: 60_000,  desc: 'Cải xanh, cải ngọt và rau muống hữu cơ thu hái sáng nay.' },
  { title: 'Hộp Củ Quả Mix',             category: 'vegetables', price: 38_000, orig: 75_000,  desc: 'Cà rốt, su su, bí đỏ và khoai tây — đủ nấu bữa tối cho 4 người.' },
  { title: 'Túi Salad Sẵn Dùng',         category: 'vegetables', price: 42_000, orig: 85_000,  desc: 'Xà lách romaine, cải baby và rau thơm đã rửa sạch — ăn ngay.' },
  { title: 'Combo Nấm & Cà Chua',        category: 'vegetables', price: 50_000, orig: 95_000,  desc: 'Nấm hương, nấm kim châm và cà chua bi — hoàn hảo cho canh và xào.' },
  { title: 'Hộp Sữa Chua Tươi',          category: 'dairy',      price: 45_000, orig: 90_000,  desc: '6 hũ sữa chua nguyên chất không đường từ trang trại địa phương.' },
  { title: 'Túi Phô Mai Mix',             category: 'dairy',      price: 60_000, orig: 120_000, desc: 'Phô mai mozzarella, cheddar và cream cheese còn hạn 3 ngày.' },
  { title: 'Combo Sữa Tươi & Kem',       category: 'dairy',      price: 55_000, orig: 110_000, desc: '1 L sữa tươi nguyên kem + 2 hộp kem tươi Úc cận date.' },
  { title: 'Hộp Thịt Nướng BBQ',         category: 'meat',       price: 85_000, orig: 170_000, desc: 'Gà, bò và heo nướng sẵn — chỉ cần hâm nóng và ăn ngay.' },
  { title: 'Túi Thịt Ướp Sẵn',           category: 'meat',       price: 75_000, orig: 150_000, desc: '500g thịt heo ướp sả ớt và 300g gà ướp mật ong — sẵn chiên.' },
  { title: 'Combo Hải Sản Hỗn Hợp',      category: 'meat',       price: 95_000, orig: 180_000, desc: 'Tôm tươi, mực và cá hồi phi lê — thu mua sáng, đóng gói trưa.' },
  { title: 'Hộp Nước Ép Trái Cây',       category: 'drinks',     price: 50_000, orig: 100_000, desc: '4 chai 330ml nước ép cam, dưa hấu, xoài và dứa ép lạnh.' },
  { title: 'Túi Sinh Tố Đông Lạnh',      category: 'drinks',     price: 55_000, orig: 110_000, desc: '3 túi hỗn hợp trái cây đông lạnh sẵn sàng xay — mỗi túi 250g.' },
  { title: 'Combo Cà Phê Cold Brew',      category: 'drinks',     price: 65_000, orig: 130_000, desc: '2 chai 500ml cold brew Arabica Đà Lạt — uống liền hoặc pha sữa.' },
  { title: 'Hộp Trà Thảo Mộc',           category: 'drinks',     price: 40_000, orig: 80_000,  desc: '8 gói trà atiso, trà gừng và trà hoa cúc hữu cơ nội địa.' },
  { title: 'Hộp Bí Ẩn Tổng Hợp',        category: 'other',      price: 70_000, orig: 140_000, desc: 'Hộp thần bí gồm 5–7 món hàng ngày — không biết trước là gì!' },
  { title: 'Túi Đồ Ăn Nhẹ Mix',          category: 'other',      price: 45_000, orig: 90_000,  desc: 'Hạt điều rang, bánh gạo và ô mai — combo ăn vặt văn phòng.' },
  { title: 'Hộp Bánh Ngọt Handmade',     category: 'other',      price: 60_000, orig: 120_000, desc: 'Brownie, cookie hạnh nhân và macarons tự làm — giới hạn 10 hộp.' },
  { title: 'Combo Gia Vị & Sốt',         category: 'other',      price: 50_000, orig: 100_000, desc: 'Tương ớt, nước mắm Phú Quốc, dầu hào và dấm táo — bộ gia vị đủ 1 tháng.' },
]

const INVENTORY_ITEMS = [
  { name: 'Bánh mì', category: 'bakery', unitPrice: 5000, unit: 'ổ', defaultQty: 10 },
  { name: 'Croissant', category: 'bakery', unitPrice: 15000, unit: 'cái', defaultQty: 6 },
  { name: 'Bánh bao', category: 'bakery', unitPrice: 8000, unit: 'cái', defaultQty: 6 },
  { name: 'Xoài', category: 'fruit', unitPrice: 20000, unit: 'kg', defaultQty: 2 },
  { name: 'Cam sành', category: 'fruit', unitPrice: 18000, unit: 'kg', defaultQty: 3 },
  { name: 'Dâu tây', category: 'fruit', unitPrice: 50000, unit: '500g', defaultQty: 1 },
  { name: 'Bơ', category: 'fruit', unitPrice: 12000, unit: 'quả', defaultQty: 5 },
  { name: 'Dứa', category: 'fruit', unitPrice: 15000, unit: 'quả', defaultQty: 3 },
  { name: 'Rau cải xanh', category: 'vegetables', unitPrice: 8000, unit: 'bó', defaultQty: 5 },
  { name: 'Cà rốt', category: 'vegetables', unitPrice: 10000, unit: 'kg', defaultQty: 2 },
  { name: 'Nấm hương', category: 'vegetables', unitPrice: 30000, unit: '200g', defaultQty: 2 },
  { name: 'Khoai lang', category: 'vegetables', unitPrice: 12000, unit: 'kg', defaultQty: 2 },
  { name: 'Sữa chua', category: 'dairy', unitPrice: 12000, unit: 'hũ', defaultQty: 6 },
  { name: 'Phô mai mozzarella', category: 'dairy', unitPrice: 35000, unit: 'gói', defaultQty: 2 },
  { name: 'Sữa tươi', category: 'dairy', unitPrice: 28000, unit: 'lít', defaultQty: 2 },
  { name: 'Thịt heo nướng', category: 'meat', unitPrice: 45000, unit: '300g', defaultQty: 3 },
  { name: 'Thịt gà ướp', category: 'meat', unitPrice: 55000, unit: '500g', defaultQty: 2 },
  { name: 'Tôm tươi', category: 'meat', unitPrice: 80000, unit: 'kg', defaultQty: 1 },
  { name: 'Nước ép cam', category: 'drinks', unitPrice: 25000, unit: 'chai', defaultQty: 4 },
  { name: 'Cold brew', category: 'drinks', unitPrice: 30000, unit: 'chai', defaultQty: 2 },
  { name: 'Trà hoa cúc', category: 'drinks', unitPrice: 8000, unit: 'gói', defaultQty: 10 },
  { name: 'Hạt điều rang', category: 'other', unitPrice: 40000, unit: '200g', defaultQty: 3 },
]

const REVIEW_COMMENTS = [
  'Ngon lắm, sẽ mua lại!', 'Hàng tươi, đóng gói cẩn thận.', 'Giá rẻ mà chất lượng tốt.',
  'Giao hàng đúng giờ, hài lòng.', 'Sản phẩm đúng mô tả, thích lắm!',
  'Tuyệt vời, tiết kiệm được nhiều tiền.', 'Rất tươi ngon, mua thêm lần nữa.',
  'Hộp bí ẩn mà toàn đồ ngon, thích quá!', 'Chất lượng vượt mong đợi.',
  'Nhanh và tiện, recommend cho mọi người!', 'Đồ ăn còn tươi lắm, không bị hỏng gì.',
  'Giá này mà ngon vậy thì quá xứng!', 'Rất hài lòng với đơn hàng.',
  'Mua lần 2 rồi, lần nào cũng tốt.', 'Đóng gói kỹ, hàng nguyên vẹn.',
  'Nhanh, gọn, ngon. Sẽ mua tiếp!', 'Fresh and tasty, great value!',
  'Loved the variety in the box.', 'Amazing deal for the quality!',
  'Will definitely order again!',
]

const CUSTOMER_NAMES = ['Nguyễn Minh Anh', 'Trần Thị Bảo', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em']

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  Starting seed...\n')

  // 1. Vendor
  console.log('👤  Creating vendor: admin@gmail.com / admin123')
  let vendorUid
  try {
    const existing = await auth.getUserByEmail('admin@gmail.com')
    vendorUid = existing.uid
    console.log('   Already exists, reusing uid:', vendorUid)
  } catch {
    const u = await auth.createUser({ email: 'admin@gmail.com', password: 'admin123', displayName: 'Fresh Box Saigon' })
    vendorUid = u.uid
    console.log('   Created uid:', vendorUid)
  }
  await db.doc(`users/${vendorUid}`).set({
    uid: vendorUid, role: 'vendor', displayName: 'Fresh Box Saigon',
    email: 'admin@gmail.com', lang: 'vi',
    storeName: 'Fresh Box Saigon',
    address: '123 Nguyễn Huệ, Q.1, TP.HCM',
    storeDescription: 'Thực phẩm tươi surplus hàng ngày — đặt trước 18h để nhận hộp của bạn!',
    bankName: 'Vietcombank', bankAccount: '1234567890', bankAccountName: 'FRESH BOX SAIGON',
  }, { merge: true })

  // 2. Customers
  console.log('\n👥  Creating 5 customers...')
  const customerUids = []
  for (let i = 0; i < 5; i++) {
    const email = `customer${i + 1}@gmail.com`
    let uid
    try {
      const existing = await auth.getUserByEmail(email)
      uid = existing.uid
    } catch {
      const u = await auth.createUser({ email, password: 'pass123456', displayName: CUSTOMER_NAMES[i] })
      uid = u.uid
    }
    await db.doc(`users/${uid}`).set(
      { uid, role: 'customer', displayName: CUSTOMER_NAMES[i], email, lang: 'vi' },
      { merge: true }
    )
    customerUids.push(uid)
    console.log(`   ${email} ✓`)
  }

  // 3. Listings
  console.log('\n🛍️   Creating 26 listings...')
  const listingIds = []
  const listingPrices = []
  for (const l of LISTINGS) {
    const ref = db.collection('listings').doc()
    await ref.set({
      vendorId: vendorUid, vendorName: 'Fresh Box Saigon',
      type: 'mystery_box', title: l.title, description: l.desc,
      price: l.price, originalPrice: l.orig,
      quantityTotal: 50, quantityRemaining: rnd(5, 20),
      pickupStart: todayAt(17), pickupEnd: todayAt(20),
      category: l.category, imageUrl: '', status: 'active',
      createdAt: daysAgo(rnd(30, 90)), packedAt: todayAt(14),
    })
    listingIds.push(ref.id)
    listingPrices.push(l.price)
  }
  console.log(`   ${listingIds.length} listings created ✓`)

  // 4. Inventory
  console.log('\n📦  Creating inventory items...')
  for (const item of INVENTORY_ITEMS) {
    const ref = db.collection('inventory').doc(vendorUid).collection('items').doc()
    await ref.set({ ...item, bestBefore: null, createdAt: daysAgo(rnd(10, 60)) })
  }
  console.log(`   ${INVENTORY_ITEMS.length} items created ✓`)

  // 5. Orders — 1200 across 90 days in batches of 400
  console.log('\n🧾  Creating ~1200 orders over 90 days...')
  const STATUS_ROLL = [
    ...Array(60).fill('picked_up'),
    ...Array(20).fill('paid'),
    ...Array(10).fill('cancelled'),
    ...Array(5).fill('refunded'),
    ...Array(5).fill('pending'),
  ]
  const METHODS = ['stripe', 'stripe', 'cod', 'bank_transfer']

  let batch = db.batch()
  let batchCount = 0
  let totalOrders = 0
  const pickedUpOrders = []

  for (let day = 0; day < 90; day++) {
    const count = rnd(10, 18)
    for (let o = 0; o < count; o++) {
      const idx = rnd(0, listingIds.length - 1)
      const customerId = customerUids[rnd(0, 4)]
      const qty = rnd(1, 3)
      const status = STATUS_ROLL[rnd(0, STATUS_ROLL.length - 1)]
      const method = METHODS[rnd(0, METHODS.length - 1)]
      const ref = db.collection('orders').doc()

      batch.set(ref, {
        customerId, vendorId: vendorUid,
        listingId: listingIds[idx], listingTitle: LISTINGS[idx].title,
        quantity: qty, totalPrice: listingPrices[idx] * qty,
        status, paymentMethod: method,
        qrCode: uuid(), createdAt: daysAgo(day),
        pickupEnd: todayAt(20),
      })

      if (status === 'picked_up') {
        pickedUpOrders.push({ id: ref.id, listingId: listingIds[idx], customerId, idx })
      }

      batchCount++
      totalOrders++
      if (batchCount >= 400) {
        await batch.commit()
        batch = db.batch()
        batchCount = 0
        process.stdout.write('.')
      }
    }
  }
  if (batchCount > 0) await batch.commit()
  console.log(`\n   ${totalOrders} orders created ✓`)

  // 6. Reviews (~40% of picked_up orders)
  console.log('\n⭐  Creating reviews...')
  batch = db.batch()
  batchCount = 0
  let totalReviews = 0
  const reviewSample = pickedUpOrders.filter(() => Math.random() < 0.4)

  for (const o of reviewSample) {
    const ref = db.collection('reviews').doc()
    batch.set(ref, {
      orderId: o.id, listingId: o.listingId,
      vendorId: vendorUid, customerId: o.customerId,
      customerName: CUSTOMER_NAMES[customerUids.indexOf(o.customerId)] ?? 'Khách hàng',
      rating: rnd(3, 5),
      comment: REVIEW_COMMENTS[rnd(0, REVIEW_COMMENTS.length - 1)],
      createdAt: daysAgo(rnd(0, 89)),
    })
    batchCount++
    totalReviews++
    if (batchCount >= 400) {
      await batch.commit()
      batch = db.batch()
      batchCount = 0
    }
  }
  if (batchCount > 0) await batch.commit()
  console.log(`   ${totalReviews} reviews created ✓`)

  console.log('\n✅  Seed complete!')
  console.log('─────────────────────────────────────────')
  console.log(`  Vendor:   admin@gmail.com  /  admin123`)
  console.log(`  Customers: customer1–5@gmail.com  /  pass123456`)
  console.log(`  Listings: ${listingIds.length}`)
  console.log(`  Orders:   ${totalOrders}`)
  console.log(`  Reviews:  ${totalReviews}`)
  console.log('─────────────────────────────────────────')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
