# Phase 4: Layout Shell, Navigation Hierarchy, and Route Table

## Summary

Implements the application layout shell (`Header`, `MobileDrawer`, `Footer`, and `Layout`), the static Turkish category navigation hierarchy and showroom contact metadata (`src/data/navigation.js`), and the complete route table in `src/App.js` (`/`, `/urunlerimiz`, `/kategori/:slug`, `/urun/:slug`, `/arama`, and `*` 404), while strictly omitting all e-commerce, account, WhatsApp, catalogue PDF, and legal links.

## Scope

Covers `src/data/navigation.js`, `src/components/layout/Header.js`, `src/components/layout/MobileDrawer.js`, `src/components/layout/Footer.js`, `src/components/layout/Layout.js`, and route configuration in `src/App.js` (along with unit and component tests in `src/**/*.test.js`).

## Acceptance criteria

- `src/data/navigation.js` must export `MAIN_NAV_CATEGORIES` as an array of 6 top-level category objects, each shaped `{ name, slug, href, children }` where `href` is `"/kategori/<slug>"`:
  1. `"Led Avizeler"` (`slug: "led-avizeler"`, `href: "/kategori/led-avizeler"`) with 9 children:
     - `"Kumandalı Led Avizeler"` (`slug: "kumandali-led-avizeler"`, `href: "/kategori/kumandali-led-avizeler"`)
     - `"İşletme Ofis Led Avizeler"` (`slug: "ofis-avize-ve-led-aydinlatma-modelleri"`, `href: "/kategori/ofis-avize-ve-led-aydinlatma-modelleri"`)
     - `"Tavana Sıfır Led Avize"` (`slug: "tavana-sifir-led-avize"`, `href: "/kategori/tavana-sifir-led-avize"`)
     - `"Modern Led Avize"` (`slug: "modern-led-avize"`, `href: "/kategori/modern-led-avize"`)
     - `"Dekoratif Led Avize"` (`slug: "dekoratif-led-avize"`, `href: "/kategori/dekoratif-led-avize"`)
     - `"Led Salon Avize"` (`slug: "led-salon-avize"`, `href: "/kategori/led-salon-avize"`)
     - `"Mutfak Led Avize"` (`slug: "mutfak-led-avize"`, `href: "/kategori/mutfak-led-avize"`)
     - `"Sarkıt Led Avize"` (`slug: "sarkit-led-avize"`, `href: "/kategori/sarkit-led-avize"`)
     - `"3 Renkli Led Avize"` (`slug: "3-renkli-led-avize"`, `href: "/kategori/3-renkli-led-avize"`)
  2. `"Plafonyer"` (`slug: "plafonyer-led-avize"`, `href: "/kategori/plafonyer-led-avize"`, `children: []`)
  3. `"Lineer Aydınlatma"` (`slug: "lineer-aydinlatma"`, `href: "/kategori/lineer-aydinlatma"`) with 2 children:
     - `"Sarkıt Lineer Aydınlatma"` (`slug: "sarkit-lineer-aydinlatma"`, `href: "/kategori/sarkit-lineer-aydinlatma"`)
     - `"Sıva Üstü Lineer Aydınlatma"` (`slug: "siva-ustu-lineer-aydinlatma"`, `href: "/kategori/siva-ustu-lineer-aydinlatma"`)
  4. `"Tekli Sarkıt Avizeler"` (`slug: "sarkit-avizeler"`, `href: "/kategori/sarkit-avizeler"`, `children: []`)
  5. `"Aplikler"` (`slug: "aplikler"`, `href: "/kategori/aplikler"`, `children: []`)
  6. `"Masa Lambaları"` (`slug: "masa-lambalari"`, `href: "/kategori/masa-lambalari"`, `children: []`)
- `src/data/navigation.js` must export `FLAT_MAIN_CATEGORIES` containing all 17 category entries (the 6 top-level categories and 11 child categories) flattened in depth-first order, each with `{ name, slug, href: "/kategori/<slug>" }`.
- `src/data/navigation.js` must export `SHOWROOM_CONTACT` with `address: "Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL"`, `phones: [{ display: "0532 499 12 28", href: "tel:05324991228" }, { display: "0212 931 28 07", href: "tel:02129312807" }]`, `mapUrl: "https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9"`, and `mapLabel: "Showroom & İmalat Google Harita Konumu"`.
- `Header` (`src/components/layout/Header.js`) must render `<header data-testid="site-header">` with a brand logo link (`data-testid="brand-logo"`) pointing to `"/"` whose text includes `"Lavabo"`.
- `Header` must render a desktop navigation region (`<nav aria-label="Ana navigasyon" data-testid="desktop-mega-menu">`) containing a `"Tüm Ürünler"` link to `"/urunlerimiz"`, links to all 6 top-level categories in `MAIN_NAV_CATEGORIES`, and links to all 11 child categories in their mega-menu/dropdown lists, each pointing to `"/kategori/<slug>"`.
- `Header` must render a search trigger (`data-testid="header-search-trigger"`, `aria-label="Ürün ara"`) that navigates to `"/arama"` when clicked.
- `Header` must render a mobile menu toggle button (`data-testid="mobile-menu-open"`, `aria-label="Menüyü aç"`, `aria-expanded` reflecting whether the mobile drawer is open) that opens `MobileDrawer` when clicked.
- `MobileDrawer` (`src/components/layout/MobileDrawer.js`) must render nothing (`data-testid="mobile-menu-drawer"` absent from the DOM) when `isOpen` is `false`.
- When `isOpen` is `true`, `MobileDrawer` must render an accessible dialog (`role="dialog"`, `aria-modal="true"`, `aria-label="Mobil menü"`, `data-testid="mobile-menu-drawer"`) along with a backdrop element (`data-testid="mobile-menu-backdrop"`), a close button (`data-testid="mobile-menu-close"`, `aria-label="Menüyü kapat"`), an `"Anasayfa"` link (`"/"`), a `"Tüm Ürünler"` link (`"/urunlerimiz"`), and links to the main categories (`"/kategori/<slug>"`).
- Clicking `data-testid="mobile-menu-close"`, clicking `data-testid="mobile-menu-backdrop"`, pressing the `Escape` key, or clicking any category/navigation link inside `MobileDrawer` must close the mobile drawer.
- `Footer` (`src/components/layout/Footer.js`) must render `<footer data-testid="site-footer">` displaying the showroom address `"Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL"`, both telephone links (`"0532 499 12 28"` with `href="tel:05324991228"` and `"0212 931 28 07"` with `href="tel:02129312807"`), the Google Maps link (`"Showroom & İmalat Google Harita Konumu"` with `href="https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9"`), and category links under `"Kategoriler"` (`"Ürünlerimiz"` pointing to `"/urunlerimiz"` plus main category links pointing to `"/kategori/<slug>"`).
- `Layout` (`src/components/layout/Layout.js`) must render `<Header />`, a `<main data-testid="layout-main">` landmark containing the active route `<Outlet />`, and `<Footer />` across all routes.
- `src/App.js` must configure the route table inside `<Layout />`:
  - `"/"` renders the home view preserving the `<h1>Lavabo Aydınlatma Katalog</h1>` heading and `data-testid="scss-demo-box"` (with class `"scss-demo-box"` and text matching `/Yerli Üretim LED Aydınlatma Kataloğu/i`).
  - `"/urunlerimiz"` and `"/kategori/:slug"` render the catalogue listing view preserving `data-testid="debug-result-count"`, `data-testid="debug-filter-summary"`, `data-testid="debug-product-list"`, the `"Yükleniyor..."` loading indicator, and the `role="alert"` error message from Phase 3b.
  - `"/urun/:slug"` renders the product detail placeholder (`data-testid="product-detail-placeholder"`) displaying a heading and the `:slug` route parameter.
  - `"/arama"` renders the search results placeholder (`data-testid="search-results-placeholder"`) displaying a heading and the current `?q=` search parameter value when present.
  - `"*"` renders the 404 Not Found view (`data-testid="not-found-page"`) displaying a `"Sayfa Bulunamadı"` heading and an `"Anasayfaya Dön"` link pointing to `"/"`.

## Edge cases and error handling

- `Header`, `MobileDrawer`, and `Footer` must never render any e-commerce or omitted links/controls: no cart (`Sepet`), checkout (`Ödeme`), buy buttons (`Satın Al`, `Sepete Ekle`), account/login (`Hesabım`, `Giriş`, `Üyelik`), order tracking (`Sipariş Takip`), wishlist (`İstek listesi`, `Favoriler`), product comparison (`Karşılaştır`), mobile `"Mağaza"` / `"Shop"` link, blog/about/FAQ/contact pages, floating WhatsApp link (`wa.me`), catalogue PDF links (`Fiyatlı Katalog İndir`, `Fiyatsız Katalog İndir`, `Premium Series Export Catalogue`), or legal/contract links (`Gizlilik politikası`, `Mesafeli Satış Sözleşmesi`, `Ön Bilgilendirme Formu`, `Teslimat ve İade Şartları`, `Üyelik Sözleşmesi`, `Kullanıcı Verilerinin Silinmesi`).
- When `Escape` is pressed while `MobileDrawer` is closed (`isOpen === false`), it must be a safe no-op and must not throw or leave lingering event listeners on unmount.
- When `"/arama"` is visited without a `q` query parameter or with a whitespace-only `?q=   ` parameter, `data-testid="search-results-placeholder"` must still render cleanly without crashing or displaying `"undefined"` / `"null"`.
- When an unknown URL path (such as `"/olmayan-sayfa-xyz"`) is visited, React Router must match the `"*"` catch-all route inside `<Layout />`, rendering `<Header />`, `data-testid="not-found-page"` with `"Sayfa Bulunamadı"`, and `<Footer />` (rather than falling back to the home page).

## Out of scope

- Full home page hero banner, featured category cards, and product showcase grids (covered in Phase 5).
- Full category sidebar accordion, swatch filter panel, sort toolbar, pagination controls, and product card grid on `/urunlerimiz` and `/kategori/:slug` (covered in Phase 6).
- Full product detail gallery, variant selector, and quick view modal on `/urun/:slug` (covered in Phase 7).
- Live search dropdown results and search page product grid on `/arama` (covered in Phase 8).

## Context / notes

- All source and test files use plain JavaScript (`.js`) and React Router v7 imports from `"react-router"` (`Link`, `NavLink`, `Outlet`, `Route`, `Routes`, `useParams`, `useSearchParams`, `MemoryRouter`).
- Existing tests in `src/App.test.js` and `src/hooks/phase-3-hooks-and-preview.test.js` must continue to pass without modification. Note that previously `"*"` rendered `HomePlaceholder` in `src/App.js`; now `"/"` renders the home view and `"*"` renders the 404 Not Found view (`data-testid="not-found-page"`).
- All verification uses Vitest + jsdom + `@testing-library/react` (`pnpm test`).
