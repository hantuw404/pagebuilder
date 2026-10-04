# PRD — SEO REFERENCE CLONER

## 1. PRODUCT OVERVIEW

### Product Name

SEO Reference Cloner

### Product Type

AI-powered SEO content analyzer + HTML structure-preserving cloner.

### Core Concept

User memasukkan:

* Link website referensi
* Brand baru
* Title baru

System kemudian:

1. Mengambil source HTML referensi.
2. Mengambil rendered DOM jika diperlukan.
3. Menganalisis struktur halaman.
4. Menganalisis SEO content.
5. Membuat blueprint struktur referensi.
6. Membuat content baru berdasarkan blueprint.
7. Mengidentifikasi seluruh content, asset, dan link yang dapat diganti.
8. Mengelompokkan URL yang sama menjadi satu mapping.
9. Meminta user memasukkan replacement URL untuk asset/link yang perlu diganti.
10. Melakukan replacement pada HTML asli.
11. Mempertahankan struktur HTML, CSS, JS, class, ID, layout, dan behavior semaksimal mungkin.
12. Menghasilkan HTML clone final.

---

# 2. CORE PRINCIPLE

## STRUCTURE-PRESERVING CONTENT REPLACEMENT

Produk ini BUKAN website generator.

Produk ini adalah HTML cloner/replacer.

### Source of Truth

HTML referensi merupakan source of truth untuk:

* DOM structure
* element hierarchy
* section order
* class
* ID
* CSS
* JavaScript
* layout
* responsive behavior
* animation
* component structure
* button structure
* form structure
* image placement
* link placement
* FAQ structure
* review structure
* footer structure

AI hanya mengubah bagian yang memang ditentukan sebagai replaceable.

---

# 2A. STRICT AI STRUCTURE ANALYSIS (CLASSIFICATION-ONLY)

AI **boleh** dilibatkan untuk analisis struktur, tetapi dengan batasan keras:

## Yang BOLEH dilakukan AI:

* Mengklasifikasi setiap elemen teks: **CONTENT** (artikel/FAQ/review asli) atau **LOCKED** (UI, template, produk, navigasi, placeholder).
* Menentukan **scope** — daftar elemen yang boleh diganti.
* Mengenali keberadaan FAQ, review, artikel, heading.

## Yang TIDAK BOLEH dilakukan AI:

* Mengubah, menambah, menghapus, atau menyusun ulang HTML.
* Menyentuh class, ID, CSS, JavaScript, layout, animasi, struktur DOM.
* Menulis HTML apa pun.
* Memperluas scope di luar daftar yang disetujui.

## Prinsip implementasi:

```text
AI  →  klasifikasi (indeks elemen)  →  whitelist
code →  transformasi HTML (Cheerio) menggunakan whitelist
```

* AI hanya mengembalikan daftar indeks elemen konten (JSON).
* Kode memvalidasi indeks tersebut terhadap DOM nyata.
* Hanya elemen dalam whitelist yang menjadi REPLACEABLE; sisanya LOCKED.
* Jika AI gagal / tidak tersedia → fallback ke klasifikasi rule-based (deterministik).
* Transformasi HTML **selalu** dilakukan oleh kode, bukan AI — sehingga struktur tidak mungkin rusak.

Target tetap sama:

```text
Structural similarity: 100%
Content differences: Expected
```

---

# 3. INPUT

## Required Input

### Reference URL

```text
https://example.com/
```

### New Brand

```text
SAKAUTOTO
```

### New Title

```text
SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor
```

---

# 4. EXTRACTION ENGINE

System harus menyediakan minimal dua extraction mode.

## Mode A — Raw Source

Mengambil HTML source seperti konsep browser:

```text
View Source / Ctrl + U
```

Digunakan untuk mendapatkan:

* original HTML
* metadata
* linked CSS
* linked JS
* image URL
* favicon
* canonical
* OG tags
* links
* inline scripts
* inline styles

## Mode B — Rendered DOM

Digunakan apabila website menggunakan:

* JavaScript
* SPA
* dynamic rendering
* lazy loading
* client-side generated content

Rendered DOM digunakan sebagai fallback atau complement terhadap raw source.

### Priority

```text
Raw HTML
   ↓
Check completeness
   ↓
Incomplete?
   ↓ YES
Rendered DOM
```

System tidak boleh menganggap rendered DOM sebagai pengganti raw HTML secara otomatis apabila raw HTML sudah lengkap.

---

# 5. PAGE ANALYSIS

Setelah extraction, AI melakukan full analysis.

## Metadata

Detect:

* title
* meta description
* meta keywords
* robots
* canonical
* OG title
* OG description
* OG image
* Twitter metadata
* JSON-LD
* other relevant metadata

System harus membedakan:

```text
FOUND
NOT FOUND
UNVERIFIED
```

Jangan mengarang metadata yang tidak ditemukan.

---

# 6. HTML STRUCTURE ANALYSIS

System membuat DOM map.

Contoh:

```text
BODY
├── HEADER
│   ├── LOGO
│   ├── NAVIGATION
│   └── CTA
│
├── MAIN
│   ├── HERO
│   │   ├── H1
│   │   ├── P
│   │   └── IMAGE
│   │
│   ├── CONTENT
│   │   ├── H2
│   │   ├── P
│   │   └── P
│   │
│   ├── FAQ
│   │   ├── QUESTION
│   │   ├── ANSWER
│   │   └── ...
│   │
│   └── REVIEW
│
└── FOOTER
```

System harus menyimpan DOM structure tersebut.

---

# 7. REPLACEABLE ELEMENT DETECTION

Setiap element diklasifikasikan menjadi:

```text
LOCKED
```

atau

```text
REPLACEABLE
```

## LOCKED

Default:

* div
* section
* container
* wrapper
* class
* ID
* CSS
* JS
* inline styling
* layout attributes
* animation attributes
* structural attributes

System tidak boleh mengubahnya kecuali diperlukan untuk replacement.

## REPLACEABLE

Contoh:

* H1
* H2
* H3
* paragraph
* title
* meta description
* FAQ question
* FAQ answer
* review text
* brand name
* image URL
* logo URL
* favicon URL
* CTA URL
* social URL
* internal URL

---

# 8. BRAND REPLACEMENT ENGINE

Brand lama harus dideteksi dari:

* visible text
* title
* meta
* alt
* aria-label
* link text
* image filename
* structured data jika relevan

Contoh:

```text
OLD BRAND:
ALEXISTOGEL

NEW BRAND:
SAKAUTOTO
```

System membuat global brand mapping.

Tetapi replacement harus dilakukan secara semantic.

Jangan melakukan blind string replacement terhadap seluruh HTML jika berisiko mengubah:

* CSS
* JavaScript
* unrelated strings
* IDs
* filenames
* external URLs

---

# 9. TITLE REPLACEMENT ENGINE

User title menjadi primary content intent.

Contoh:

```text
NEW TITLE:
SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor
```

AI melakukan:

* keyword extraction
* intent extraction
* semantic topic mapping
* title mapping
* heading mapping
* paragraph mapping
* FAQ mapping

Title baru harus menjadi pusat korelasi konten.

---

# 10. SEO CONTENT ENGINE

AI harus membuat:

* meta title
* meta description jika referensi memiliki/relevan
* H1
* H2
* H3
* paragraph
* FAQ
* review placeholder jika referensi memiliki review
* CTA copy jika memang merupakan content element

## Golden Rule

Jumlah element mengikuti referensi.

Contoh:

```text
Reference:
6 paragraphs

Output:
6 paragraphs
```

```text
Reference:
5 FAQ

Output:
5 FAQ
```

```text
Reference:
8 reviews

Output:
8 reviews
```

Tidak boleh menambahkan section hanya karena AI merasa halaman akan lebih bagus.

---

# 11. WORD COUNT PRESERVATION

Target:

```text
Reference article: 500 words
Target output: 475–525 words
```

Ideal:

```text
±5%
```

Selain total word count, system harus mempertahankan:

* paragraph count
* approximate paragraph length
* heading count
* FAQ count
* review count

Jika kebutuhan semantic membuat perbedaan kecil tidak terhindarkan, struktur tetap menjadi prioritas.

---

# 12. KEYWORD MAPPING

AI membuat:

### Primary Keyword

Keyword utama dari Title Baru.

### Secondary Keywords

Keyword pendukung.

### Related Terms

Semantic terms.

Mapping harus konsisten antara:

```text
META
↓
H1
↓
H2
↓
ARTICLE
↓
FAQ
↓
OTHER CONTENT
```

Tidak boleh keyword stuffing.

---

# 13. RAW META OUTPUT

Metadata harus ditampilkan sebagai raw text.

Format:

```text
META TITLE:
...

META DESCRIPTION:
...

META KEYWORDS:
...

ROBOTS:
...

CANONICAL:
...

OG TITLE:
...

OG DESCRIPTION:
...
```

Jangan menghasilkan:

```html
<meta>
<title>
<head>
```

pada bagian analisis/output konten.

---

# 14. ASSET EXTRACTION

System melakukan inventory terhadap seluruh asset.

Detect:

* img src
* srcset
* picture source
* favicon
* OG image
* CSS background-image
* inline background-image
* video poster
* relevant media assets

Contoh:

```text
ASSET #01

Type:
IMAGE

URL:
https://oldsite.com/assets/logo.webp

Occurrences:
12

Detected role:
LOGO
```

---

# 15. ASSET GROUPING

URL yang sama harus dikelompokkan.

Contoh:

```text
https://oldsite.com/logo.webp
× 12
```

menjadi satu mapping.

User tidak perlu memasukkan URL 12 kali.

---

# 16. ASSET REPLACEMENT UI

System menampilkan:

```text
ASSET REPLACEMENT

[01]
Role: LOGO
Original:
https://oldsite.com/logo.webp

Used:
12 times

New URL:
[________________________]

[02]
Role: HERO
Original:
https://oldsite.com/hero.webp

Used:
4 times

New URL:
[________________________]
```

User dapat:

* replace
* keep original
* skip

---

# 17. LINK EXTRACTION

System harus menganalisis seluruh link.

Detect:

```text
<a href="">
<link href="">
canonical
alternate
OG URL
social links
image links
form action
CTA URLs
```

Namun sistem **tidak boleh memaksakan kategori link tertentu**.

Struktur link harus mengikuti referensi asli.

---

# 18. LINK PRESERVATION PRINCIPLE

Jika reference menggunakan:

```text
/register
/login
/promo
```

pertahankan format relative URL.

Jangan otomatis mengubah menjadi:

```text
https://domain.com/register
```

Jika reference menggunakan absolute URL:

```text
https://oldsite.com/register
```

pertahankan absolute URL kecuali user menggantinya.

---

# 19. REPEATED LINK MAPPING

Jika URL yang sama muncul berkali-kali:

```text
https://oldsite.com/register
× 24
```

system membuat satu mapping:

```text
OLD:
https://oldsite.com/register

OCCURRENCES:
24

NEW:
[________________________]
```

Replacement berlaku ke seluruh occurrence.

---

# 20. LINK GROUPING

Link grouping harus mengikuti pola reference.

System boleh mengenali secara internal:

* internal
* external
* social
* asset
* navigation
* CTA

Tetapi UI replacement tidak boleh mengubah struktur reference.

Contoh:

Jika 5 button berbeda menggunakan URL yang sama, tetap dianggap satu mapping:

```text
/register × 5
```

---

# 21. URL REPLACEMENT SAFETY

Replacement dilakukan berdasarkan exact URL/reference mapping.

Contoh:

```text
OLD:
https://oldsite.com/register

NEW:
https://newsite.com/register
```

Jangan melakukan replacement substring secara membabi buta.

Harus mempertimbangkan:

* exact URL
* URL encoded version
* HTML escaped version
* relative equivalent
* query string
* fragments

---

# 22. IMAGE / LOGO QUESTIONS

Setelah extraction, system hanya menanyakan asset yang perlu input user.

Contoh:

```text
We found 4 major visual assets.

Logo
[New URL]

Hero
[New URL]

Favicon
[New URL]

Background
[Keep original]
```

Jika user tidak memberikan replacement:

```text
KEEP ORIGINAL
```

Tidak boleh mengarang URL baru.

---

# 23. HTML REPLACEMENT ENGINE

Replacement dilakukan terhadap original HTML.

Contoh:

```html
<h1>OLD BRAND | OLD TITLE</h1>
```

menjadi:

```html
<h1>NEW BRAND | NEW TITLE</h1>
```

Tetapi:

```html
<div class="hero-container">
```

tetap:

```html
<div class="hero-container">
```

---

# 24. DO NOT REBUILD HTML

System tidak boleh:

1. mengambil screenshot
2. meminta AI membuat website baru
3. membuat HTML baru dari nol
4. menghapus CSS/JS
5. menyederhanakan DOM

Kecuali user secara eksplisit meminta redesign.

Default operation:

```text
ORIGINAL HTML
+
REPLACEMENT MAP
=
FINAL HTML
```

---

# 25. REPLACEMENT MAP

Internal representation:

```json
{
  "brand": {
    "old": "ALEXISTOGEL",
    "new": "SAKAUTOTO"
  },
  "title": {
    "new": "SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor"
  },
  "assets": {
    "https://oldsite.com/logo.webp": "https://newsite.com/logo.webp"
  },
  "links": {
    "https://oldsite.com/register": "https://newsite.com/register"
  }
}
```

Content mapping juga menyimpan DOM target sehingga replacement tidak bergantung hanya pada string matching.

---

# 26. CONTENT SLOT SYSTEM

Setiap content element diberi ID internal.

Contoh:

```text
CONTENT-001
Type: H1
Original: OLD TITLE
Replacement: NEW TITLE
```

```text
CONTENT-002
Type: PARAGRAPH
Original: ...
Replacement: ...
```

```text
CONTENT-003
Type: FAQ QUESTION
Original: ...
Replacement: ...
```

Hal ini mencegah AI mengubah structural HTML.

---

# 27. REVIEW HANDLING

Jika reference mempunyai review:

```text
Reference:
8 reviews
```

output:

```text
8 review
```

Namun jika tidak ada data review asli yang sah:

```text
EXAMPLE / PLACEHOLDER
```

harus diberi label.

Jangan membuat review palsu yang dipresentasikan sebagai pengalaman pelanggan nyata.

Jangan membuat structured review schema yang menyesatkan.

---

# 28. FAQ HANDLING

Jika reference:

```text
FAQ = 5
```

output:

```text
FAQ = 5
```

AI harus membuat pertanyaan baru berdasarkan:

* new title
* new brand
* article intent
* reference FAQ structure

Tidak boleh sekadar mengganti brand dari FAQ lama.

---

# 29. ADDITIONAL ELEMENT PRESERVATION

Pertahankan jika ditemukan:

* breadcrumb
* CTA
* table
* result section
* tags
* footer
* navigation
* badges
* feature list
* related content
* schema
* disclaimer

Jangan menambahkan elemen yang tidak ada.

---

# 30. ANALYSIS OUTPUT

Output pertama wajib:

# A. ANALISIS REFERENSI

Format:

```text
ANALISIS REFERENSI

URL:
...

META:
- Meta title:
- Meta description:
- Metadata lain:

STRUKTUR:
- H1:
- H2:
- H3:
- Paragraf:
- Estimasi jumlah kata:
- Gaya penulisan:

FAQ:
- Ada/Tidak ada
- Jumlah:
- Pola:

REVIEW:
- Ada/Tidak ada
- Jumlah:
- Pola:

ELEMEN TAMBAHAN:
- ...

KEYWORD:
- Primary keyword:
- Secondary keywords:
- Related terms:

BLUEPRINT:
1.
2.
3.
4.
...
```

---

# 31. CONTENT OUTPUT

Output kedua:

# B. HASIL KONTEN

Urutan harus mengikuti reference.

Contoh:

```text
1. RAW META

2. ARTIKEL

3. FAQ

4. REVIEW

5. ELEMEN TAMBAHAN
```

Tidak boleh menyisipkan analisis di antara content.

---

# 32. CLONE WORKFLOW

Full workflow:

```text
USER
 │
 │ Reference URL
 │ Brand
 │ Title
 ▼
FETCHER
 │
 ├── Raw HTML
 └── Rendered DOM
 │
 ▼
PARSER
 │
 ├── DOM Tree
 ├── Metadata
 ├── Assets
 ├── Links
 └── Content
 │
 ▼
ANALYZER
 │
 ├── SEO Analysis
 ├── Structure Analysis
 ├── Keyword Analysis
 └── Blueprint
 │
 ▼
AI CONTENT ENGINE
 │
 ├── Meta
 ├── Headings
 ├── Article
 ├── FAQ
 └── Review
 │
 ▼
MAPPING ENGINE
 │
 ├── Content Mapping
 ├── Asset Mapping
 └── Link Mapping
 │
 ▼
USER REVIEW
 │
 ├── New image URLs
 ├── New logo
 ├── New favicon
 └── New links
 │
 ▼
REPLACEMENT ENGINE
 │
 ▼
HTML VALIDATOR
 │
 ▼
EXPORT
```

---

# 33. HTML VALIDATION

Sebelum export:

Check:

* HTML syntax
* broken tags
* missing closing tags
* duplicate IDs
* broken href
* broken src
* malformed attributes
* accidental replacement inside CSS
* accidental replacement inside JS
* missing assets
* missing content
* DOM structure changes

System harus membandingkan:

```text
REFERENCE DOM STRUCTURE
vs
FINAL DOM STRUCTURE
```

Target:

```text
Structural similarity: 100%
```

Content differences:

```text
Expected
```

---

# 34. STRUCTURE DIFF

System menghasilkan internal diff:

```text
STRUCTURE CHECK

Sections:
PASS

H1:
PASS

H2:
PASS

Paragraph count:
6 → 6 PASS

FAQ:
5 → 5 PASS

Review:
8 → 8 PASS

CSS:
UNCHANGED

JS:
UNCHANGED

DOM:
UNCHANGED
```

Diff hanya ditampilkan jika user meminta atau jika terdapat error.

---

# 35. EXPORT

Output minimal:

```text
clone/
├── index.html
└── replacement-map.json
```

Jika reference mempunyai local assets dan user memilih download assets:

```text
clone/
├── index.html
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── css/
├── js/
└── replacement-map.json
```

Default jangan download asset jika tidak diperlukan.

---

# 36. ERROR HANDLING

Jika URL tidak dapat diakses:

```text
REFERENCE ACCESS FAILED
```

Jangan generate berdasarkan tebakan.

Jika raw HTML incomplete:

```text
RAW SOURCE INCOMPLETE
```

Gunakan rendered DOM jika memungkinkan.

Jika rendered DOM juga gagal:

```text
INSUFFICIENT ACCESS
```

Minta user menyediakan:

* HTML source
* exported HTML
* screenshot
* relevant page source

---

# 37. IMPORTANT SAFETY / INTEGRITY RULES

System tidak boleh:

* mengarang metadata
* mengarang struktur
* mengarang jumlah FAQ
* mengarang jumlah review
* mengklaim review palsu sebagai customer review
* mengklaim ranking
* mengklaim kemenangan
* mengklaim hasil yang dijamin
* mengubah struktur tanpa alasan
* menambahkan content hanya untuk memperpanjang artikel

Untuk halaman perjudian/topik regulated:

* gunakan bahasa bertanggung jawab
* hindari klaim kemenangan yang dijamin
* jangan membuat misleading claims
* perhatikan hukum wilayah yang berlaku

---

# 38. UI — STEP 1

## Reference Setup

```text
REFERENCE URL

[ https://________________________ ]

NEW BRAND

[ ______________________________ ]

NEW TITLE

[ ______________________________ ]

[ ANALYZE REFERENCE ]
```

---

# 39. UI — STEP 2

## Reference Analysis

```text
REFERENCE ANALYZED

Structure
✓ 1 H1
✓ 2 H2
✓ 1 H3
✓ 6 paragraphs

FAQ
✓ 5 questions

Reviews
✓ 8 items

Assets
✓ 12 unique URLs

Links
✓ 7 unique URLs
```

Button:

```text
GENERATE CONTENT
```

---

# 40. UI — STEP 3

## Generated Content

Display:

```text
META
ARTICLE
FAQ
REVIEW
```

Show:

```text
Reference:
~310 words

Generated:
~302 words

Structure:
PASS
```

---

# 41. UI — STEP 4

## Asset Mapping

```text
LOGO
Original URL
[...]
Used 12×

New URL
[________________]

[KEEP ORIGINAL]
```

Repeat only for unique assets.

---

# 42. UI — STEP 5

## Link Mapping

Example:

```text
UNIQUE LINKS FOUND: 7

1.
https://oldsite.com/register
Used 24×

New URL:
[________________]

2.
https://oldsite.com/login
Used 11×

New URL:
[________________]
```

Links that do not need replacement can remain untouched.

---

# 43. UI — STEP 6

## Final Preview

```text
REFERENCE
ALEXISTOGEL

        ↓

CLONE
SAKAUTOTO

Structure:
100% preserved

Content:
REPLACED

Assets:
4 / 4 mapped

Links:
7 / 7 mapped
```

Button:

```text
GENERATE HTML
```

---

# 44. FINAL RESULT

System generates:

```text
SAKAUTOTO-CLONE.zip
```

Containing the final HTML and optional local assets.

---

# 45. FUTURE FEATURES

Potential future versions:

### Multi-page cloning

```text
Homepage
About
Contact
FAQ
Landing Page
AMP
```

### Batch cloning

```text
Reference
     ↓
Brand A
Brand B
Brand C
Brand D
```

### Multiple title variants

```text
Brand
+
10 titles
```

### AMP cloning

Raw AMP HTML harus diperlakukan sebagai struktur terpisah dari normal HTML.

### Automatic asset downloading

Download referenced assets dan rewrite paths.

### CSS URL replacement

Detect:

```css
background-image: url(...)
```

### Font mapping

Detect external fonts dan allow replacement.

### Sitemap-aware cloning

Analyze multiple pages dari satu domain.

---

# 46. SUCCESS CRITERIA

Produk dianggap berhasil jika:

### Content

* Brand baru konsisten.
* Title baru menjadi primary intent.
* Content benar-benar baru.
* SEO relationship konsisten.
* Word count mendekati reference.
* Paragraph count sama.
* Heading count sama.
* FAQ count sama.
* Review count sama.

### Structure

* DOM structure preserved.
* CSS preserved.
* JS preserved.
* Responsive behavior preserved.
* Animation preserved.
* Existing component structure preserved.

### Replacement

* Repeated URL hanya membutuhkan satu mapping.
* Semua occurrence terganti dengan benar.
* Asset replacement tidak merusak HTML.
* Link replacement tidak merusak HTML.
* Unmapped asset/link tetap original.

### Integrity

* Tidak mengarang data reference.
* Tidak menambahkan section tanpa dasar.
* Tidak melakukan blind replacement.
* Tidak mengubah locked elements.

---

# 47. CORE PRODUCT PHILOSOPHY

> **Analyze the reference.**
>
> **Understand the structure.**
>
> **Generate new content.**
>
> **Map the replacements.**
>
> **Preserve the original HTML.**
>
> **Replace only what needs replacing.**

Produk ini harus selalu berpikir:

```text
NOT:

"How do I build this website?"

BUT:

"How do I preserve this exact website structure
while replacing its content with new, relevant content?"
```

Itulah definisi utama **SEO Reference Cloner**.
