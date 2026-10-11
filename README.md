# Zal Nazorat — Telegram Mini App

Shaxsiy mashg‘ulot nazorati: kunlik reja, podxodlarni yozib borish, dam olish taymeri, texnika videolari, rekordlar va taraqqiyot grafiklari.

- **Server shart emas.** Bu statik sayt (`index.html`, `styles.css`, `data.js`, `app.js`). Ma’lumotlar Telegram CloudStorage’da
  saqlanadi — telefon, planshet va kompyuterdagi Telegram’da bir xil bo‘ladi. Zalda internet bo‘lmasa, avval qurilmada saqlanadi,
  keyin o‘zi sinxronlanadi.
- **Standart dastur:** Push / Pull / Legs × 2 (Du–Sh), Yakshanba — dam olish. Har kun ~2 soat: razminka → asosiy mashqlar → press → kardio.
  Hammasini ilovaning «Dastur» bo‘limida o‘zgartirish mumkin.

## Ishga tushirish

### 1. Saytni HTTPS’ga joylash
Telegram Mini App faqat `https://` manzilda ishlaydi. Eng oson yo‘llardan biri — GitHub Pages:

```bash
cd ~/zal-nazorat
git init && git add . && git commit -m "Zal Nazorat"
gh repo create zal-nazorat --public --source . --push
gh api -X POST repos/{owner}/zal-nazorat/pages -f "source[branch]=main" -f "source[path]=/"
# Manzil: https://<github-login>.github.io/zal-nazorat/
```

(Netlify / Cloudflare Pages / Vercel ham bo‘ladi — papkani yuklash kifoya. Kodda maxfiy narsa yo‘q.)

### 2. Bot yaratish (@BotFather)
1. `/newbot` → nom va username bering (masalan `zal_nazorat_bot`).
2. `/mybots` → botingiz → **Bot Settings → Menu Button → Configure menu button** → 1-qadamdagi URL → tugma nomi: `Zal`.
3. (Ixtiyoriy) `/newapp` → shu URL → `t.me/<bot>/<app>` ko‘rinishidagi to‘g‘ridan-to‘g‘ri havola.

Botni oching → pastdagi **Zal** tugmasi → ilova ochiladi.

## Mahalliy ko‘rish
```bash
cd ~/zal-nazorat && python3 -m http.server 8765
# brauzerda: http://127.0.0.1:8765  (Telegram tashqarisida ma’lumot faqat brauzerda saqlanadi)
```

## Fayllar
| Fayl | Nima bor |
|---|---|
| `data.js` | 50 ta mashq (nomi, guruh, texnika eslatmasi, video qidiruv so‘zlari) va haftalik dastur |
| `app.js` | Ilova mantiqi: saqlash/sinxron, mashg‘ulot rejimi, taymer, statistika, grafiklar |
| `styles.css` | Dizayn — Telegram mavzusi ranglarini (yorug‘/qorong‘i) avtomatik oladi |

## Kunlik eslatma
Bot har kuni 08:07 (Toshkent) da bugungi rejani yuboradi — alohida private repo `Tojiddinov/zal-nazorat-bot`
(GitHub Actions cron). Reja shu saytdagi `data.js` dan olinadi.

## Videolar
Har bir standart mashqda `data.js` → `video` (YouTube havolasi) bor; ilova ichida muqova bosilganda shu yerning o‘zida ochiladi.
Ilovada istalgan mashqning videosini o‘zingiz yoqtirganiga almashtirish mumkin («Mashqlar» → mashq → «Video havolasi»).

## Cheklovlar
- Telegram CloudStorage: 1024 ta yozuv (har kun = 1 yozuv → ~2,7 yil). 900 dan oshsa, Sozlamalar ogohlantiradi —
  **Zaxira nusxa** tugmasi bilan JSON’ni «Saqlangan xabarlar»ga yuborib qo‘ying.
- Ilova yopiq bo‘lsa, dam olish taymeri signal bermaydi (mashg‘ulot paytida ekran o‘chmasligi so‘raladi).
- Eslatma standart dastur bo‘yicha yoziladi: ilovada dasturni o‘zgartirsangiz (u Telegram bulutida, bot uni ko‘ra olmaydi),
  `data.js` dagi `DEFAULT_PROGRAM` ni ham yangilang.
