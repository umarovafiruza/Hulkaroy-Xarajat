# 💎 Smart Expense Tracker — Shaxsiy Xarajatlarni Hisoblash Tizimi

Zamonaviy **Glassmorphism** va **Dark Mode** estetikasida yaratilgan, toza HTML5, CSS3 va vanilla JavaScript (ES6+) asosidagi to'liq funksional frontend veb-ilova.

---

## 🌟 Loyiha Imkoniyatlari va Xususiyatlari

### 1. 🎨 UI/UX va Glassmorphism Dizayn
- **Ranglar palitrasi**: Chuqur to'q fonlar (`#0b1120`, `#1e293b`), xiralashtirilgan shaffof oynasimon kartalar (`backdrop-filter: blur(16px)`), daromadlar uchun zumrad yashil (`#10b981`), xarajatlar uchun pushti/qizil (`#f43f5e`), hamda neon orqa fon nurlari.
- **Tipografiya**: O'qishga juda qulay **Inter** Google shrifti.
- **Responsiv**: Mobil telefonlar, planshetlar va noutbuklar/katta ekranlar uchun moslashuvchan CSS Grid va Flexbox tizimi.
- **Mikro-animatsiyalar**: Hover effektlari, tugmalar bosilish to'lqinlari, ogohlantirish modallari va bildirishnoma (toast) animatsiyalari.

### 2. 📊 Boshqaruv Paneli (Dashboard Stats)
- **Jami Balans**: Hisobdagi jami mavjud mablag'. Boshlang'ich balans, barcha daromadlar va xarajatlar inobatga olingan holda real vaqt rejimida avtomatik hisoblanadi.
- **Oylik Byudjet & Progress Bar**: Oylik rejalashtirilgan limit, ishlatilgan foiz, sarflangan va qolgan summa. Foizga qarab progress ranglari yashil, to'q sariq yoki qizilga o'zgaradi.
- **Limit Ogohlantirishi (80% dan oshganda)**: Oylik xarajat belgilangan limitning 80% idan oshganda ekranda maxsus ogohlantirish bildirishnomasi (banner va toast) paydo bo'ladi.
- **Bugungi Xarajat**: Faqat bugungi kunda amalga oshirilgan to'lovlar yig'indisi va amaliyotlar soni.
- **Oylik Jami Xarajat**: Joriy oydagi umumiy sarf-xarajat va o'rtacha kunlik sarf ko'rsatkichi.

### 3. ⚡ Tezkor Xarajat Qo'shish Formasi (Quick Add Form)
- **Amaliyot turi**: Xarajat yoki Daromad tanlovi.
- **Summa**: So'm formatida kiritish hamda tezkor tugmalar (`+10 000`, `+25 000`, `+50 000`, `+100 000`, `+500 000`).
- **Kategoriyalar**: Oziq-ovqat 🍔, Transport 🚗, Kommunal 💡, Ta'lim 📚, Ko‘ngilochar 🎮, Xaridlar 🛍️, Salomatlik 💊, Boshqa ✨.
- **To'lov turi**: Karta (Bank / Uzum / Click) 💳 yoki Naqd pul 💵.
- **Izoh va Sana**: Xarajat nomi va sana tanlagich (avtomatik bugungi sana bilan to'ldiriladi).

### 4. 📈 Vizual Tahlil (Donut Chart)
- **Chart.js CDN** orqali chizilgan interaktiv aylanma diagramma.
- O'rtasida umumiy sarflangan xarajat summasi.
- Diagramma yonida kategoriyalar ulushi (foiz va summa) ro'yxati.
- Davr bo'yicha saralash: **"Shu oy"** va **"Barchasi"**.

### 5. 📜 Xarajatlar Tarixi & CRUD
- Har bir xarajat qatorida: kategoriya ikonasi, to'lov usuli nishoni, sana, summa va o'chirish tugmasi.
- **Jonli Qidiruv**: Izoh, kategoriya nomi yoki summa bo'yicha bir zumda qidirish.
- **Filtrlar**: Kategoriya (Oziq-ovqat, Transport, Kommunal va h.k.) va To'lov usuli (Karta, Naqd pul) bo'yicha filtrlash.
- **Tartiblash**: Eng yangi, eng eski, eng katta yoki eng kichik summa bo'yicha saralash.
- **Tasdiqlash oynasi**: Xarajatni o'chirishdan oldin xavfsiz tasdiqlash modali.
- **Eksport (CSV)**: Barcha xarajatlarni Excel/Sheets uchun UTF-8 BOM formatidagi `.csv` fayl ko'rinishida yuklab olish.
- **Bo'sh holat (Empty State)**: Hali xarajat bo'lmaganda yoki qidiruv natijasiz bo'lganda chiroyli bo'sh holat kartasi.

### 6. 💾 Ma'lumotlarni Saqlash (LocalStorage)
- Barcha kiritilgan xarajatlar, oylik byudjet va boshlang'ich balans foydalanuvchining brauzeridagi `localStorage`da saqlanadi.
- Sahifa yangilanganda ham ma'lumotlar yo'qolmaydi.
- Ilk bor ochilganda real hayotiy namunaviy (demo) ma'lumotlar avtomatik yuklanadi.

---

## 🚀 Qanday ishga tushirish mumkin?

Hech qanday qo'shimcha kutubxona o'rnatish (`npm install` yoki boshqa) talab etilmaydi!

1. `index.html` faylini istalgan brauzerda (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) ikki marta bosib oching.
2. Yoki loyiha papkasida terminal orqali:
   ```powershell
   Start-Process index.html
   ```
   buyrug'ini bering.

---

## 📁 Fayllar Strukturasi

```text
hisob-kitob/
├── index.html       # Semantik HTML5 strukturasi, modallar va vidjetlar
├── style.css        # Glassmorphism, CSS o'zgaruvchilari, dark mode & responsive dizayn
├── app.js           # Barcha JavaScript logikasi, hisob-kitoblar, chart va localStorage
└── README.md        # Loyiha qo'llanmasi
```

Yaratuvchi: Senior Front-end Dasturchisi & UI/UX Dizayneri (2026).
