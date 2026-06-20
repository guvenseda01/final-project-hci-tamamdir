# Frontend ↔ Backend Entegrasyon Rehberi
Bu dosya, tamamdir-web-app (React) ile tamamdir-backend (Express)
arasındaki entegrasyonun referansıdır. Backend endpoint sözleşmesi
ve mockData → backend alan eşlemesi aşağıdadır.
(a) Backend Endpoint Sözleşmesi
Hepsi http://localhost:3000 kökünde, başında /api. Yanıtlardan password_hash daima çıkarılıyor.
Auth — /api/auth
POST /register — body: { full_name, email, password (min 8) } → 201 { token, user, needs_interests:true }. E-posta @iyte.edu.tr veya @std.iyte.edu.tr ile bitiyorsa is_verified=1 (mavi rozet) otomatik atanır. E-posta kayıtlıysa 409.
POST /login — body: { email, password } → { token, user }. Hatalı bilgi 401.
GET /me — auth gerekli → { ...user, interests:[{id,name,icon,slug}] }.
Users — /api/users (:id = UUID)
GET /:id → herkese açık profil. PATCH /:id — auth, kendi profili — body: { full_name?, bio?, department?, year?, is_provider? }. POST /:id/avatar — auth, multipart alan adı avatar → { avatar_url }. GET /:id/interests. PUT /:id/interests — auth — body: { category_ids:[uuid] }. GET /:id/services. GET /:id/orders — auth — query ?role=buyer|provider.
Services — /api/services
GET / — optionalAuth — query: ?category=<slug>&search=<str>&sort=rating|price_asc|price_desc|newest&page=1&limit=20 → { services:[...], pagination:{total,page,limit,pages} }. POST / — auth — body: { category_id, title, description, price, price_unit?, delivery_days? }. GET /:id → servis + sağlayıcı + resimler. PATCH /:id — auth, sahibi. DELETE /:id — auth, sahibi. POST /:id/images — auth, multipart alan adı images (çoklu). DELETE /:id/images/:imageId — auth.
Orders — /api/orders
POST / — auth — body: { service_id, note?, scheduled_at? } → status pending. GET / — auth — query ?role=buyer|provider&status=. GET /:id — auth. Durum geçişleri (hepsi auth):

PATCH /:id/accept → accepted (bu senin "Tamamdır!" anın), yalnızca provider
PATCH /:id/start → in_progress, provider
PATCH /:id/complete → completed, provider; sağlayıcı cüzdanını kredilendirir + alıcıya yorum bildirimi
PATCH /:id/cancel — body: { reason? }, alıcı veya provider

Messages — /api/messages (hepsi auth)
GET /conversations → listede last_message, last_msg_at, karşı katılımcı. POST /conversations — body: { participant_id }. GET /conversations/:id → konuşma + mesajlar. POST / — body: { conversation_id, content }. PATCH /conversations/:id/read.
Reviews — /api/reviews
POST / — auth — body: { order_id, rating (1-5), comment? }; order başına tek yorum. GET /service/:id. GET /user/:id.
Categories — /api/categories
GET / → 12 kategori, her birinde service_count. GET /:id. Alanlar: { id(uuid), name, icon, slug }. Seed edilenler: Coding Lessons, Tennis Coaching, Custom Knitting, Graphic Design, Language Exchange, Photography, Instrument Lessons, Calculus Tutoring, House Cleaning, Nail Art, Pet Sitting, Handmade Goods.
(b) Mock → Backend Alan Eşleme Tablosu
KonuFrontend (mockData)BackendYapılacakID tipiid: 1 (sayı)id: uuid (string)Sayısal id varsayımını kaldır; string id kullanDoğrulamaisVerifiedis_verified (0/1)İsim + boolean dönüşümüFiyatprice:'₺150/hr', priceNum:150price:150, price_unit:'session'formatPrice(price, unit) yardımcısı yazSağlayıcıgömülü provider:{name, fullName, avatar, department, ordersCount, satisfaction}provider_id + ayrı user objesi (full_name, avatar_url, department, order_count, rating)Servis detayında sağlayıcıyı user objesinden eşleGörselimage:'unsplash...'service_images[] (image_url, is_cover)Kapak resmini is_cover'dan seç; yoksa placeholderYorumlargömülü reviewsList:[{name,avatar,rating,text}]ayrı GET /api/reviews/service/:id (reviewer, rating, comment)Ayrı çağrı; text→comment, name→reviewer.full_nameKategoriservis içinde category:'Tennis Coaching' (isim)category_id (uuid) + slug filtresiFiltreyi slug ile yapKullanıcıcurrentUser (statik), activeServicesGET /me + GET /users/:id/servicesMock'u kaldır, AuthContext'ten alKonuşmaparticipant(isim), messages:[{from:'me'/'them'}], unreadparticipant_a/b, mesajda sender_id, is_readfrom'u sender_id===myId ile hesaplaMesaj metnitextcontentİsim eşlemeOnboardinguseState(new Set([1,3,8])) sayısal idkategori uuid'leriSeçimi PUT /users/:id/interests ile uuid olarak gönder

