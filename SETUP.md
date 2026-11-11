# إعداد تشغيل حسابات VYRO الحقيقية

الواجهة منشورة على GitHub Pages، لكن GitHub Pages لا يشغّل قاعدة بيانات أو نظام حسابات بمفرده. أضفنا تكامل Supabase؛ يلزم إكمال الخطوات التالية مرة واحدة.

## 1) أنشئ مشروع Supabase
1. افتح https://supabase.com/dashboard وأنشئ حساباً/مشروعاً مجانياً.
2. اختر كلمة مرور قوية لقاعدة البيانات واحتفظ بها لنفسك.
3. من Project Settings > API انسخ Project URL و anon / publishable key فقط.

## 2) أنشئ الجداول والسياسات
1. افتح SQL Editor في مشروع Supabase.
2. افتح ملف supabase-schema.sql في مستودع VYRO وانسخ محتواه بالكامل.
3. الصقه في SQL Editor واضغط Run.
4. من Authentication > URL Configuration أضف:
   - Site URL: https://ly0100ali-arch.github.io
   - Redirect URL: https://ly0100ali-arch.github.io/VYRO/

## 3) اربط الموقع
1. افتح ملف supabase-config.js في مستودع VYRO واضغط Edit.
2. ضع Project URL في SUPABASE_URL، ومفتاح anon/publishable في SUPABASE_ANON_KEY.
3. احفظ التغييرات (Commit changes). سيبدأ GitHub Actions النشر تلقائياً.

مثال:
```js
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY";
```

## الأمان
- لا تضع أبداً service_role أو مفتاحاً سرياً في ملفات الموقع.
- ملف SQL يفعّل Row Level Security على الجداول ويقيّد التعديل بمالك السجل.
- لا تشارك كلمة مرور قاعدة البيانات أو مفاتيحك السرية في المحادثة.
- التسجيل بالبريد قد يتطلب تأكيد البريد الإلكتروني حسب إعدادات Supabase.

## ما تم تجهيزه
- واجهة إنشاء حساب وتسجيل دخول بالبريد وكلمة المرور.
- استعادة كلمة المرور عبر البريد.
- جلسة تسجيل دخول عبر Supabase Auth.
- مخطط قاعدة بيانات للملفات الشخصية والمنشورات والتعليقات والإعجابات والمتابعة والإشعارات.

تنبيه: الواجهة الأساسية الحالية ما زالت تستخدم التخزين المحلي للمنشورات. الجداول السحابية جاهزة في المخطط، لكن مزامنة الموجز ورفع الصور والرسائل الفورية تحتاج مراحل تطوير إضافية قبل اعتبارها وظائف مفعّلة.