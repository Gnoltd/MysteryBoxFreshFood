import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { v4 as uuid } from 'uuid'

const SECRET = 'seed_mysterybox_2024'

// ─── Listing templates ────────────────────────────────────────────────────────
const LISTINGS = [
  // bakery (4)
  { title: 'Hộp Bánh Mì Sáng', category: 'bakery', price: 35_000, orig: 75_000, desc: 'Hộp 5 ổ bánh mì thập cẩm thừa cuối ngày — giòn rụm, nhân đa dạng.' },
  { title: 'Túi Bánh Ngọt Mix', category: 'bakery', price: 45_000, orig: 95_000, desc: 'Croissant, pain au chocolat và brioche còn tươi từ lò sáng.' },
  { title: 'Hộp Bánh Bao Hấp', category: 'bakery', price: 30_000, orig: 60_000, desc: '6 chiếc bánh bao nhân thịt & trứng muối, hấp nóng lúc đóng gói.' },
  { title: 'Combo Bánh Mì Que & Bơ', category: 'bakery', price: 40_000, orig: 80_000, desc: 'Bánh mì que giòn kèm hũ bơ pháp nhỏ — ăn sáng chuẩn vị.' },

  // fruit (4)
  { title: 'Hộp Trái Cây Nhiệt Đới', category: 'fruit', price: 55_000, orig: 110_000, desc: 'Xoài, dứa, thanh long và chôm chôm tươi thu hoạch hôm nay.' },
  { title: 'Túi Cam Sành & Quýt', category: 'fruit', price: 40_000, orig: 80_000, desc: '1 kg cam sành + 500 g quýt miền Tây ngọt lịm, giàu vitamin C.' },
  { title: 'Mix Dâu Tây Đà Lạt', category: 'fruit', price: 65_000, orig: 130_000, desc: '500 g dâu tây Đà Lạt loại 1 — có thể dùng trực tiếp hoặc làm sinh tố.' },
  { title: 'Hộp Chuối & Bơ Chín', category: 'fruit', price: 35_000, orig: 65_000, desc: '5 quả chuối sứ + 2 quả bơ chín mềm — combo dinh dưỡng lý tưởng.' },

  // vegetables (4)
  { title: 'Túi Rau Xanh Hằng Ngày', category: 'vegetables', price: 30_000, orig: 60_000, desc: 'Cải xanh, cải ngọt và rau muống hữu cơ thu hái sáng nay.' },
  { title: 'Hộp Củ Quả Mix', category: 'vegetables', price: 38_000, orig: 75_000, desc: 'Cà rốt, su su, bí đỏ và khoai tây — đủ để nấu bữa tối cho 4 người.' },
  { title: 'Túi Salad Sẵn Dùng', category: 'vegetables', price: 42_000, orig: 85_000, desc: 'Xà lách romaine, cải baby và rau thơm đã rửa sạch, sẵn sàng ăn ngay.' },
  { title: 'Combo Nấm & Cà Chua', category: 'vegetables', price: 50_000, orig: 95_000, desc: 'Nấm hương, nấm kim châm và cà chua bi — hoàn hảo cho canh và xào.' },

  // dairy (3)
  { title: 'Hộp Sữa Chua Tươi', category: 'dairy', price: 45_000, orig: 90_000, desc: '6 hũ sữa chua nguyên chất không đường từ trang trại địa phương.' },
  { title: 'Túi Phô Mai Mix', category: 'dairy', price: 60_000, orig: 120_000, desc: 'Phô mai mozzarella, cheddar và cream cheese còn hạn 3 ngày.' },
  { title: 'Combo Sữa Tươi & Kem', category: 'dairy', price: 55_000, orig: 110_000, desc: '1 L sữa tươi nguyên kem + 2 hộp kem tươi Úc cận date.' },

  // meat (3)
  { title: 'Hộp Thịt Nướng BBQ', category: 'meat', price: 85_000, orig: 170_000, desc: 'Gà, bò và heo nướng sẵn — chỉ cần hâm nóng và ăn ngay.' },
  { title: 'Túi Thịt Ướp Sẵn', category: 'meat', price: 75_000, orig: 150_000, desc: '500 g thịt heo ướp sả ớt và 300 g gà ướp mật ong — tươi, sẵn chiên.' },
  { title: 'Combo Hải Sản Hỗn Hợp', category: 'meat', price: 95_000, orig: 180_000, desc: 'Tôm tươi, mực và cá hồi phi lê — thu mua sáng, đóng gói trưa.' },

  // drinks (4)
  { title: 'Hộp Nước Ép Trái Cây', category: 'drinks', price: 50_000, orig: 100_000, desc: '4 chai 330 ml nước ép cam, dưa hấu, xoài và dứa ép lạnh.' },
  { title: 'Túi Sinh Tố Đông Lạnh', category: 'drinks', price: 55_000, orig: 110_000, desc: '3 túi hỗn hợp trái cây đông lạnh sẵn sàng xay — mỗi túi 250 g.' },
  { title: 'Combo Cà Phê Cold Brew', category: 'drinks', price: 65_000, orig: 130_000, desc: '2 chai 500 ml cold brew Arabica Đà Lạt — uống liền hoặc pha với sữa.' },
  { title: 'Hộp Trà Thảo Mộc', category: 'drinks', price: 40_000, orig: 80_000, desc: '8 gói trà atiso, trà gừng và trà hoa cúc hữu cơ nội địa.' },

  // other (4)
  { title: 'Hộp Bí Ẩn Tổng Hợp', category: 'other', price: 70_000, orig: 140_000, desc: 'Hộp thần bí gồm 5–7 món hàng ngày — không biết trước là gì!' },
  { title: 'Túi Đồ Ăn Nhẹ Mix', category: 'other', price: 45_000, orig: 90_000, desc: 'Hạt điều rang, bánh gạo và ô mai — combo ăn vặt văn phòng.' },
  { title: 'Hộp Bánh Ngọt Handmade', category: 'other', price: 60_000, orig: 120_000, desc: 'Brownie, cookie hạnh nhân và macarons tự làm tại nhà — giới hạn 10 hộp.' },
  { title: 'Combo Gia Vị & Sốt', category: 'other', price: 50_000, orig: 100_000, desc: 'Tương ớt, nước mắm Phú Quốc, dầu hào và dấm táo — bộ gia vị đủ dùng 1 tháng.' },
]

const REVIEWS = [
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

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(rnd(8, 21), rnd(0, 59), rnd(0, 59))
  return admin.firestore.Timestamp.fromDate(d)
}

function todayAt(hour: number, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return admin.firestore.Timestamp.fromDate(d)
}

export const seedDatabase = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    if (req.query.secret !== SECRET) {
      res.status(403).json({ error: 'Unauthorized. Pass ?secret=seed_mysterybox_2024' })
      return
    }

    try {
      const db = admin.firestore()
      const auth = admin.auth()

      // ── 1. Create vendor ────────────────────────────────────────────────────
      let vendorUid: string
      try {
        const existing = await auth.getUserByEmail('admin@gmail.com')
        vendorUid = existing.uid
        console.log('Vendor already exists:', vendorUid)
      } catch {
        const u = await auth.createUser({
          email: 'admin@gmail.com',
          password: 'admin123',
          displayName: 'Fresh Box Saigon',
        })
        vendorUid = u.uid
      }
      await db.doc(`users/${vendorUid}`).set({
        uid: vendorUid,
        role: 'vendor',
        displayName: 'Fresh Box Saigon',
        email: 'admin@gmail.com',
        lang: 'vi',
        storeName: 'Fresh Box Saigon',
        address: '123 Nguyễn Huệ, Q.1, TP.HCM',
        storeDescription: 'Chúng tôi cung cấp thực phẩm tươi surplus hàng ngày với giá cực tốt. Đặt hàng trước 18h để nhận hộp của bạn!',
        bankName: 'Vietcombank',
        bankAccount: '1234567890',
        bankAccountName: 'FRESH BOX SAIGON',
      }, { merge: true })

      // ── 2. Create customers ─────────────────────────────────────────────────
      const customerNames = ['Nguyễn Minh Anh', 'Trần Thị Bảo', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em']
      const customerUids: string[] = []
      for (let i = 0; i < 5; i++) {
        const email = `customer${i + 1}@gmail.com`
        let uid: string
        try {
          const existing = await auth.getUserByEmail(email)
          uid = existing.uid
        } catch {
          const u = await auth.createUser({ email, password: 'pass123456', displayName: customerNames[i] })
          uid = u.uid
        }
        await db.doc(`users/${uid}`).set({
          uid, role: 'customer', displayName: customerNames[i], email, lang: 'vi',
        }, { merge: true })
        customerUids.push(uid)
      }

      // ── 3. Create listings ──────────────────────────────────────────────────
      const listingIds: string[] = []
      const listingPrices: number[] = []

      for (const l of LISTINGS) {
        const ref = db.collection('listings').doc()
        const pickupStart = todayAt(17)
        const pickupEnd = todayAt(20)
        await ref.set({
          vendorId: vendorUid,
          vendorName: 'Fresh Box Saigon',
          type: 'mystery_box',
          title: l.title,
          description: l.desc,
          price: l.price,
          originalPrice: l.orig,
          quantityTotal: 50,
          quantityRemaining: rnd(5, 20),
          pickupStart,
          pickupEnd,
          category: l.category,
          imageUrl: '',
          status: 'active',
          createdAt: daysAgo(rnd(30, 90)),
          packedAt: todayAt(14),
        })
        listingIds.push(ref.id)
        listingPrices.push(l.price)
      }

      // ── 4. Create inventory items ───────────────────────────────────────────
      const inventoryItems = [
        { name: 'Bánh mì', category: 'bakery', unitPrice: 5000, unit: 'ổ', defaultQty: 10 },
        { name: 'Croissant', category: 'bakery', unitPrice: 15000, unit: 'cái', defaultQty: 6 },
        { name: 'Xoài', category: 'fruit', unitPrice: 20000, unit: 'kg', defaultQty: 2 },
        { name: 'Cam sành', category: 'fruit', unitPrice: 18000, unit: 'kg', defaultQty: 3 },
        { name: 'Rau cải xanh', category: 'vegetables', unitPrice: 8000, unit: 'bó', defaultQty: 5 },
        { name: 'Cà rốt', category: 'vegetables', unitPrice: 10000, unit: 'kg', defaultQty: 2 },
        { name: 'Sữa chua', category: 'dairy', unitPrice: 12000, unit: 'hũ', defaultQty: 6 },
        { name: 'Phô mai mozzarella', category: 'dairy', unitPrice: 35000, unit: 'gói', defaultQty: 2 },
        { name: 'Thịt heo nướng', category: 'meat', unitPrice: 45000, unit: '300g', defaultQty: 3 },
        { name: 'Tôm tươi', category: 'meat', unitPrice: 80000, unit: 'kg', defaultQty: 1 },
        { name: 'Nước ép cam', category: 'drinks', unitPrice: 25000, unit: 'chai', defaultQty: 4 },
        { name: 'Cold brew', category: 'drinks', unitPrice: 30000, unit: 'chai', defaultQty: 2 },
        { name: 'Hạt điều rang', category: 'other', unitPrice: 40000, unit: '200g', defaultQty: 3 },
        { name: 'Brownie chocolate', category: 'other', unitPrice: 20000, unit: 'miếng', defaultQty: 4 },
        { name: 'Dứa', category: 'fruit', unitPrice: 15000, unit: 'quả', defaultQty: 3 },
        { name: 'Nấm hương', category: 'vegetables', unitPrice: 30000, unit: '200g', defaultQty: 2 },
        { name: 'Bơ', category: 'fruit', unitPrice: 12000, unit: 'quả', defaultQty: 5 },
        { name: 'Thịt gà ướp', category: 'meat', unitPrice: 55000, unit: '500g', defaultQty: 2 },
        { name: 'Trà hoa cúc', category: 'drinks', unitPrice: 8000, unit: 'gói', defaultQty: 10 },
        { name: 'Khoai lang', category: 'vegetables', unitPrice: 12000, unit: 'kg', defaultQty: 2 },
        { name: 'Bánh bao', category: 'bakery', unitPrice: 8000, unit: 'cái', defaultQty: 6 },
        { name: 'Sữa tươi', category: 'dairy', unitPrice: 28000, unit: 'lít', defaultQty: 2 },
      ]
      for (const item of inventoryItems) {
        const ref = db.collection('inventory').doc(vendorUid).collection('items').doc()
        await ref.set({ ...item, bestBefore: null, createdAt: daysAgo(rnd(10, 60)) })
      }

      // ── 5. Create orders (1200 total over 90 days) ─────────────────────────
      const STATUS_WEIGHTS = [
        { status: 'picked_up', w: 60 },
        { status: 'paid', w: 20 },
        { status: 'cancelled', w: 10 },
        { status: 'refunded', w: 5 },
        { status: 'pending', w: 5 },
      ]
      function pickStatus() {
        const roll = rnd(1, 100)
        let acc = 0
        for (const s of STATUS_WEIGHTS) { acc += s.w; if (roll <= acc) return s.status }
        return 'paid'
      }
      function pickMethod() {
        const r = rnd(1, 3)
        return r === 1 ? 'stripe' : r === 2 ? 'cod' : 'bank_transfer'
      }

      const BATCH_SIZE = 450
      let batch = db.batch()
      let batchCount = 0
      let totalOrders = 0
      let pickedUpOrders: Array<{ id: string; listingId: string; vendorId: string; customerId: string }> = []

      for (let day = 0; day < 90; day++) {
        const ordersThisDay = rnd(8, 20)
        for (let o = 0; o < ordersThisDay; o++) {
          const listingIdx = rnd(0, listingIds.length - 1)
          const listingId = listingIds[listingIdx]
          const customerId = customerUids[rnd(0, customerUids.length - 1)]
          const qty = rnd(1, 3)
          const status = day < 85 ? (Math.random() < 0.8 ? 'picked_up' : pickStatus()) : pickStatus()
          const method = pickMethod()
          const ref = db.collection('orders').doc()
          const createdAt = daysAgo(day)

          batch.set(ref, {
            customerId,
            vendorId: vendorUid,
            listingId,
            listingTitle: LISTINGS[listingIdx].title,
            quantity: qty,
            totalPrice: listingPrices[listingIdx] * qty,
            status,
            paymentMethod: method,
            qrCode: uuid(),
            createdAt,
            pickupEnd: todayAt(20),
          })

          if (status === 'picked_up') {
            pickedUpOrders.push({ id: ref.id, listingId, vendorId: vendorUid, customerId })
          }

          batchCount++
          totalOrders++

          if (batchCount >= BATCH_SIZE) {
            await batch.commit()
            batch = db.batch()
            batchCount = 0
          }
        }
      }
      if (batchCount > 0) await batch.commit()

      // ── 6. Create reviews for picked_up orders (sample ~40%) ───────────────
      batch = db.batch()
      batchCount = 0
      let totalReviews = 0

      const reviewSample = pickedUpOrders.filter(() => Math.random() < 0.4)
      for (const o of reviewSample) {
        const ref = db.collection('reviews').doc()
        const customerName = customerNames[customerUids.indexOf(o.customerId)] ?? 'Khách hàng'
        batch.set(ref, {
          orderId: o.id,
          listingId: o.listingId,
          vendorId: o.vendorId,
          customerId: o.customerId,
          customerName,
          rating: rnd(3, 5),
          comment: REVIEWS[rnd(0, REVIEWS.length - 1)],
          createdAt: daysAgo(rnd(0, 89)),
        })
        batchCount++
        totalReviews++
        if (batchCount >= BATCH_SIZE) {
          await batch.commit()
          batch = db.batch()
          batchCount = 0
        }
      }
      if (batchCount > 0) await batch.commit()

      res.json({
        ok: true,
        vendorEmail: 'admin@gmail.com',
        vendorPassword: 'admin123',
        customerEmails: Array.from({ length: 5 }, (_, i) => `customer${i + 1}@gmail.com`),
        customerPassword: 'pass123456',
        listings: listingIds.length,
        inventoryItems: inventoryItems.length,
        orders: totalOrders,
        reviews: totalReviews,
      })
    } catch (err: any) {
      console.error('Seed error:', err)
      res.status(500).json({ error: err.message })
    }
  })
