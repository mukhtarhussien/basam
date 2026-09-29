# Basam Luxe

نسخة Web فخمة وعصرية من Basam، مع لوحة Admin CMS وAPI رسمي لتطبيق Flutter.

## بدون بيانات وهمية
المشروع لا يزرع منتجات أو أخبار أو عروض أو صور تجريبية في قاعدة البيانات. إذا كانت قاعدة البيانات فارغة، الواجهة تبقى فارغة إلى أن يضيفها الأدمن.

## الإدارة
`/admin/login` تستخدم:
- Password hash باستخدام scrypt.
- TOTP Authenticator.
- Session موقعة HMAC داخل HttpOnly/SameSite cookie.
- Rate limit بسيط لمحاولات الدخول.

أسرار الإدارة تبقى في Environment Variables:
- `DATABASE_URL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_TOTP_SECRET_BASE32`
- `ADMIN_SESSION_SECRET`

## API للتطبيق
- `GET /api/mobile/home`
- `GET /api/mobile/products`
- `GET /api/mobile/products/:id`
- `GET /api/mobile/news`
- `GET /api/mobile/offers`
- `POST /api/mobile/orders`

كل endpoint يعيد JSON ثابت مع `meta.version = 1`.

مثال إنشاء طلب:
```json
{
  "product_id": 12,
  "customer_name": "الاسم",
  "phone": "07xxxxxxxxx",
  "note": "ملاحظة"
}
```

## التشغيل
```bash
npm install
npm run dev
```
