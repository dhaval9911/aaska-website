# Aaska Website — Project State

> Last updated: 2026-06-03
> Monorepo root: `/Users/dc/private/aaska-website`

---

## Overview

E-commerce platform for **Resin Dreams** — a resin art business. Sells handmade resin products (frames, coasters, keychains, etc.) and raw resin supplies.

**Stack:**

- `apps/api` — NestJS 11 (`@aaska/api`)
- `apps/web` — Next.js 15 App Router (`@aaska/web`)
- `packages/ui` — Shared component library (`@aaska/ui`): Button, Card, Input, PageShell
- `packages/config` — Shared ESLint/TS config
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth v5 (JWT, credentials provider)
- **State:** Zustand v5 with `persist` (cart, wishlist)
- **Admin data fetching:** TanStack React Query v5
- **Forms:** React Hook Form + Zod
- **Deployment:** Docker Compose (3 containers: `aaska-postgres`, `aaska-api`, `aaska-web`)
- **Image upload:** `POST /api/storage/upload` → returns `{ path: string }` (auto-compressed to WebP)

---

## Phase History

### Phase 1 — Core e-commerce (complete)

- Product catalog, categories, cart, wishlist, checkout, order placement
- Customer-facing pages: home, products, product detail, checkout, order confirmation
- Basic admin panel scaffolding

### Phase 2 — Admin CMS (complete)

- Full admin CRUD for products, categories, orders
- Image upload with compression
- Auth-gated admin layout

### Phase 3 — Subcategories + Homepage Tiles (complete)

- Prisma schema extended: Category self-relation (subcategories), homepage display fields
- Product schema extended: `compareAtPrice`, `showComparePrice`
- NestJS API extended: tree view, slug-based lookup, depth validation, bulk reorder
- Admin categories page rebuilt: tree view, inline toggle, homepage tiles reorder, full form

### Phase 4 — Product Variants + Polish (complete)

- `ProductVariant` model added to Prisma schema; `hasVariants` on Product; `variantId` on CartItem
- NestJS API: full variant CRUD on products, cart validates variantId when required
- Admin form: variant builder with presets, reorder, per-variant sale price, live preview
- Storefront: variant selector pills on product detail (desktop + mobile), dynamic price/stock update
- **Fix:** `whitespace-pre-line` added to description `<p>` — newlines render correctly
- **Feature:** `showStock Boolean @default(true)` on Product — admin toggle controls stock badge visibility per product; "Out of stock" always shown regardless of toggle

---

## Current Project Status

**All features through Phase 3 are built, passing TypeScript check, built, and deployed.**

Docker containers running:

- `aaska-postgres` — PostgreSQL
- `aaska-api` — NestJS API (port 4000)
- `aaska-web` — Next.js (port 3000)

---

## All Files — What They Do

### Prisma / Database

| File                                                                             | Purpose                                                                                                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                                           | Full schema: User, Category (self-relation), Product (compareAtPrice), Cart, CartItem, Order, OrderItem                                 |
| `prisma/seed.ts`                                                                 | Seeds 10 top-level categories (with featuredOnHome/homeDisplayOrder), 7 subcategories, 3 sample products with compareAtPrice            |
| `prisma/migrations/20260531092923_subcategories_and_compare_price/migration.sql` | Adds parentId FK, bannerImage, homeTileImage, featuredOnHome, homeDisplayOrder to Category; compareAtPrice, showComparePrice to Product |

**Category model fields:**

- `id`, `name`, `slug` (unique), `image?`
- `parentId?` → self-relation (max 1 level deep enforced in service)
- `parent Category?`, `children Category[]` (relation name: `"CategoryChildren"`)
- `bannerImage?`, `homeTileImage?`
- `featuredOnHome Boolean @default(false)`
- `homeDisplayOrder Int @default(0)`
- `description?`, `createdAt`

**Product model fields:**

- `id`, `name`, `slug`, `description`, `price Decimal(10,2)`
- `compareAtPrice Decimal(10,2)?`, `showComparePrice Boolean @default(false)`
- `stock Int`, `unit ProductUnit` (enum), `images String[]`
- `categoryId` → FK to Category

---

### NestJS API (`apps/api/src/modules/`)

#### Categories Module

| File                                       | Purpose                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `categories/categories.controller.ts`      | Routes — IMPORTANT: `PATCH home-order` declared BEFORE `PATCH :id` to avoid routing collision                                              |
| `categories/categories.service.ts`         | Full service with `CATEGORY_SELECT` const; tree/flat queries, findBySlug (includes products from children), depth validation, bulk reorder |
| `categories/dto/create-category.dto.ts`    | All fields including parentId, bannerImage, homeTileImage, featuredOnHome, homeDisplayOrder, description                                   |
| `categories/dto/update-category.dto.ts`    | Same as create but all optional                                                                                                            |
| `categories/dto/reorder-home-tiles.dto.ts` | `{ tiles: [{ id, homeDisplayOrder }] }` — uses `@ValidateNested` + `@Type(() => HomeTileOrderItem)`                                        |

**API endpoints:**

- `GET /categories` — flat list, `createdAt desc`
- `GET /categories?tree=true` — parents with children nested
- `GET /categories/:slug` — category + children + products (parent includes child products)
- `POST /categories` — create (depth guard)
- `PATCH /categories/home-order` — bulk reorder featured tiles
- `PATCH /categories/:id` — update (self-parent guard, depth guard)
- `DELETE /categories/:id` — delete

#### Products Module

| File                                 | Purpose                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------- |
| `products/products.service.ts`       | Standard CRUD; `create` and `update` pass through `compareAtPrice`/`showComparePrice` |
| `products/dto/create-product.dto.ts` | Added `compareAtPrice? number`, `showComparePrice? boolean`                           |
| `products/dto/update-product.dto.ts` | Same; `compareAtPrice?: number                                                        | null` (null clears it) |

---

### Next.js Web (`apps/web/`)

#### App Router Pages

| File                                        | Purpose                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `app/layout.tsx`                            | Root layout, providers                                                               |
| `app/page.tsx`                              | Homepage                                                                             |
| `app/products/page.tsx`                     | Product listing                                                                      |
| `app/products/[slug]/page.tsx`              | Product detail — **server component**, no PageShell (moved to ProductClientView)     |
| `app/checkout/page.tsx`                     | Checkout — thin shell: `isMobile ? <MobileCheckoutWizard> : <DesktopCheckoutPage>`   |
| `app/order-confirmation/[orderId]/page.tsx` | Post-order confirmation                                                              |
| `app/admin/layout.tsx`                      | Admin nav + auth guard                                                               |
| `app/admin/categories/page.tsx`             | **Rebuilt** — tree view, inline ★ toggle, homepage tiles reorder, form mode          |
| `app/admin/products/page.tsx`               | Product list table                                                                   |
| `app/admin/products/new/page.tsx`           | New product form page                                                                |
| `app/admin/products/[id]/edit/page.tsx`     | Edit product form page                                                               |
| `app/admin/orders/page.tsx`                 | Order list                                                                           |
| `app/admin/orders/[id]/page.tsx`            | Order detail                                                                         |
| `app/gallery/page.tsx`                      | Gallery — RSC, fetches products, expands to per-image tiles, passes to GalleryClient |

#### Components

| File                                           | Purpose                                                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/product/ProductClientView.tsx`     | Owns PageShell for desktop path; mobile returns `<MobileProductDetail>` (no PageShell = full-bleed)                                                                                  |
| `components/product/MobileProductDetail.tsx`   | Full-screen carousel, qty stepper (max 10, no stock cap), accordion sections, sticky action bar (Add to Cart + WhatsApp link)                                                        |
| `components/checkout/MobileCheckoutWizard.tsx` | 3-step wizard: Step1 (cart review), Step2 (contact details), Step3 (review + place order)                                                                                            |
| `components/checkout/DesktopCheckoutPage.tsx`  | All desktop checkout hooks extracted here (fixes Rules of Hooks violation)                                                                                                           |
| `components/cart-drawer.tsx`                   | Cart slide-over; + button has no stock cap (removed)                                                                                                                                 |
| `components/admin/product-form.tsx`            | React Hook Form + Zod; multi-image upload via `apiUpload`                                                                                                                            |
| `components/admin/category-form.tsx`           | **New** — React Hook Form + Zod; parentId dropdown (disabled if has children), bannerImage + homeTileImage upload, description, featuredOnHome toggle + conditional homeDisplayOrder |
| `components/gallery/GalleryClient.tsx`         | Masonry grid (CSS columns), hover tile overlays, GalleryLightbox with product info card                                                                                              |

#### Hooks / Lib

| File                    | Purpose                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `hooks/useIsMobile.ts`  | SSR-safe mobile detection (`window.innerWidth < 768`)                                                                |
| `lib/api.ts`            | `apiFetch(path, opts)` and `apiUpload(file, token)` utilities                                                        |
| `lib/cart-store.ts`     | Zustand cart store with optimistic `updateItem` (immediate local update → silent background PATCH → revert on error) |
| `lib/wishlist-store.ts` | Zustand persist wishlist                                                                                             |

---

## Key Decisions & Conventions

| Decision                                              | Why                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| pnpm workspaces monorepo                              | Shared packages (ui, config) without publishing                                                   |
| Next.js App Router (RSC)                              | Server-side product fetch, no client waterfall                                                    |
| `PageShell` owned by `ProductClientView` not the page | Full-bleed carousel needs no padding on mobile                                                    |
| `maxQty = 10` in cart (not stock-based)               | Stock=1 was blocking quantity increase; resin art not truly limited by stock for display purposes |
| Separate `DesktopCheckoutPage` component              | Rules of Hooks — cannot call hooks after conditional return                                       |
| `CATEGORY_SELECT` const in categories service         | Consistent field projection; avoids accidentally leaking fields                                   |
| `PATCH home-order` before `PATCH :id` in controller   | NestJS resolves routes in registration order; named route must precede param route                |
| Max 2-level category depth enforced in service        | Simple tree; no recursive queries needed                                                          |
| Docker migrations run inside container                | Postgres has no exposed host port                                                                 |
| Git globs with `[slug]` must be quoted                | Shell expands brackets — always `git add 'apps/web/app/products/[slug]/page.tsx'`                 |
| Image uploads auto-compressed to WebP                 | Storage service handles this; `apiUpload` always returns a WebP path                              |

---

## What Is In Progress

Nothing — all planned work is complete and deployed.

---

### Phase 4 — Product Variants (complete — this session)

---

## Recent Changes

### Homepage redesign — brand header + dynamic category tiles (2026-05-31)

**File changed:** `apps/web/app/page.tsx`

**Removed:** Dark hero card ("Resin Art, Delivered"), "Why Resin Dreams" feature list, `Button` + `auth` imports

**Added:**

- Full-width cream (`#FAF8F5`) brand header outside `PageShell` — "Aaska" in `font-serif text-5xl/7xl` + tagline
- "Shop by Category" tiles section — server-fetches `/categories` (flat), filters `featuredOnHome`, sorts by `homeDisplayOrder`
- `tilesGridClass(count)` helper: 2→`sm:grid-cols-2`, 3→`sm:grid-cols-3`, 4+→adaptive
- Each tile: `h-[200px] sm:h-[320px]`, background image or amber→orange gradient, dark gradient overlay, category name + description, link to `/categories/[slug]`; background layer does `group-hover:scale-105`, text stays fixed
- `FeaturedCategory` interface with all needed fields

**Architecture note:** Data loaded server-side in the RSC — no client-side fetch, no new API endpoint needed (flat `/categories` already returns `featuredOnHome`, `homeDisplayOrder`, `homeTileImage`). Revalidates every 60s.

**What is next:** `/categories/[slug]` is now built. Next: could add filtering to the category page (price range, sort order) like the /products page has.

---

### Sale Price section in admin product form (2026-05-31)

**Files changed:**

- `apps/web/components/admin/product-form.tsx` — Schema extended with `showComparePrice` (boolean) + `compareAtPrice` (optional number via `z.preprocess`); `superRefine` validates compareAtPrice > price when toggle is on; `ExistingProduct` interface replaces `FormValues &` intersection (avoids type narrowing issue); `watch` + `setValue` for toggle; sale price section added after price/stock/unit grid
- `apps/web/app/admin/products/[id]/edit/page.tsx` — `Product` interface updated to include `compareAtPrice: string | null` and `showComparePrice: boolean`; both passed to `ProductForm`

**Key decisions:**

- Used `z.preprocess` (not `z.coerce`) for `compareAtPrice` so empty string → `undefined` (not `0`)
- Toggle uses `<button role="switch">` + `setValue` (not `register`) — custom UI, amber when on
- Live preview only shows when `compareAtPrice > sellingPrice > 0` (not on invalid state)
- When toggle is OFF, `compareAtPrice: null` sent in payload (explicitly clears the field)
- `ExistingProduct` interface separate from `FormValues` — avoids TypeScript intersection narrowing `compareAtPrice` to `number | undefined` when API returns `string | null`

### /categories/[slug] page (2026-05-31)

**Files created:**

- `apps/web/app/categories/[slug]/page.tsx` — RSC; fetches `GET /categories/:slug` (category + children + products); for subcategories also fetches flat `/categories` to resolve parent name + build siblings list; reads `?sub=` searchParam and passes as `initialSub`; `generateMetadata` for SEO
- `apps/web/components/category/CategoryPageClient.tsx` — All exported types (`CategoryProduct`, `CategoryDetail`, `CategoryChild`, `FlatCategory`); sub-components: `Banner`, `Breadcrumb`, `SubcategoryPillBar`, `SiblingPillBarResolved`, `DesktopProductCard`, `ProductGrid`; main `CategoryPageClient` export

**Parent category behavior:**

- Full-bleed banner: `bannerImage` or amber→orange gradient, gradient overlay, name + description text
- Scrollable pills: "All [Name]" + one per child subcategory; amber when active
- Client-side filter by `p.category.slug === activeSub`; URL sync via `router.replace` + `?sub=slug`

**Subcategory behavior:**

- Breadcrumb: Home → [Parent] → [Subcategory]
- Sibling pill bar: `← All [Parent]` link + current name (active/amber) + sibling links
- Products shown directly (no filter needed, API already scopes them)

**Product grid:**

- Mobile: 2-col grid using `MobileProductCard` (passes `compareAtPrice` as `originalPrice`)
- Desktop: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` using inline `DesktopProductCard` (SALE badge, wishlist, category label, strikethrough price, AddToCart)

**Decision:** No extra API endpoint needed — flat `/categories` returns all fields; second fetch only fires for subcategory pages.

---

### Product detail page redesign (2026-05-31)

**Files changed:**

- `apps/web/app/products/[slug]/page.tsx` — `Product` interface extended with `compareAtPrice: string | null`, `showComparePrice: boolean`
- `apps/web/components/product/ProductClientView.tsx` — `Lightbox` exported component (keyboard nav, dot strip, body scroll lock); `DesktopGallery` with vertical 76px thumbnail strip + main image + hover zoom icon; `PriceDisplay` with SALE badge, amber selling, gray struck-through original, green savings line; unit active pill; WhatsApp link added; breadcrumb updated to include Home + Category
- `apps/web/components/product/MobileProductDetail.tsx` — Replaced CSS scroll-snap with Swiper v12 (`swiper/react`); `onTap` prop opens `Lightbox` (imported from ProductClientView); `PriceDisplay` with same logic; unit active pill; all existing functionality preserved

**Dependencies added:** `swiper@12.2.0` (pnpm --filter @aaska/web add swiper)

**Note on variants:** Unit selector shows as a single active pill. Multi-variant support requires schema additions (no productUnits/variants in DB yet).

---

### Product variants (2026-06-03)

**Schema changes:**

- `Product`: added `hasVariants Boolean @default(false)`, `variants ProductVariant[]`
- `ProductVariant`: new model — `id`, `productId` (FK cascade), `label`, `price`, `compareAtPrice?`, `showComparePrice`, `stock`, `sku?`, `isDefault`, `displayOrder`, `createdAt`
- `CartItem`: added `variantId String?`, `variant ProductVariant?` (FK set-null)
- Migration file: `prisma/migrations/20260603000000_product_variants/migration.sql`

**API (`apps/api/src/modules/products/`):**

- `dto/create-product-variant.dto.ts` — **New** — all variant fields with class-validator decorators
- `dto/create-product.dto.ts` — added `hasVariants?: boolean`, `variants?: CreateProductVariantDto[]`; price/stock `@ValidateIf(!hasVariants)`
- `dto/update-product.dto.ts` — same additions, all optional
- `products.service.ts` — `findAll`/`findBySlug` include `variants` ordered by `displayOrder`; `findBySlug` now accepts slug OR id (OR query); `create`/`update` handle variants (replace strategy on PATCH); `assertVariants` helper (≥1 variant, exactly 1 isDefault); `deriveFromVariants` sets product price/stock from default variant

**API (`apps/api/src/modules/cart/`):**

- `dto/add-to-cart.dto.ts` — added `variantId?: string`
- `cart.service.ts` — validates variantId required when `hasVariants=true`; `upsertItem` passes variantId; `getCart` includes `variant { id, label, price, stock }`; `PRODUCT_SELECT` includes `hasVariants`

**Frontend (`apps/web/`):**

- `lib/cart-store.ts` — `CartItem` type extended with `variantId`, `variant`; `addItem` signature adds `variantId?: string`; `cartTotal` uses variant price when set
- `components/add-to-cart.tsx` — accepts `variantId?: string` prop, passes to `addItem`
- `components/admin/product-form.tsx` — **Major update**: hasVariants toggle (Zod field); VariantRow state (array outside react-hook-form); `VariantRowEditor` sub-component (label, price, stock, compare price toggle+input, SKU collapsible, ★ default button, ↑↓ reorder, × delete); Quick add presets dropdown (frame sizes/weight/volume); live preview strip; base price/stock fields hidden when hasVariants=ON; unit selector always visible; validation before submit; `ExistingVariant` interface exported
- `app/admin/products/[id]/edit/page.tsx` — updated `Product` interface with `hasVariants`/`variants`; passes variants to `ProductForm`
- `app/products/[slug]/page.tsx` — added `ProductVariant` interface export, added to `Product` interface
- `components/product/ProductClientView.tsx` — `ProductVariant` type exported; `ProductClientViewProps` extended; variant selector pills (outlined→filled on select, strikethrough+sold badge for out-of-stock); `effectivePrice`/`effectiveCompareAt`/`effectiveShowCompare`/`effectiveStock` derived from selected variant; "Select a size" disabled button when hasVariants + no selection; `PriceDisplay` exported; WhatsApp text includes variant label
- `components/product/MobileProductDetail.tsx` — same variant state + selector pills; imports `PriceDisplay` from ProductClientView (deduped); "Select a size" in sticky action bar; stock badge uses effectiveStock; product details accordion shows selected variant label

**Key decisions:**

- `hasVariants=true` → base `price` = default variant price; `stock` = sum of variant stocks (for listing/sorting)
- Replace strategy on PATCH (delete all variants, insert new set) — simplest, avoids partial update bugs
- `findBySlug` accepts slug OR id — fixes admin edit page which links by product.id
- Unique constraints on CartItem unchanged (one product slot per user); variantId stored on the slot and updated when a different variant is added
- Variants managed outside react-hook-form (array state) — avoids nested schema complexity

---

### Gallery page /gallery (2026-05-31)

**Files created:**

- `apps/web/app/gallery/page.tsx` — RSC; fetches `/products`, expands each product's images into individual tiles (`{ key, src, product }`); passes to `GalleryClient`; SEO metadata (title "Gallery | Aaska Resin Art", OG description); `revalidate = 60`
- `apps/web/components/gallery/GalleryClient.tsx` — `'use client'`; CSS columns masonry grid (`columns-2 sm:columns-3 lg:columns-4`); `MasonryTile` with `break-inside-avoid`, hover overlay (category label, product name, price with SALE badge, "View Product →"), image scale on hover; `GalleryLightbox` (fixed inset-0 z-[200], keyboard Esc/arrows, prev/next arrow buttons, product info card with Link, counter "N/M"); `EmptyState` for zero tiles

**Files changed:**

- `apps/web/components/site-header.tsx` — Added `{ href: '/gallery', label: 'Gallery' }` to `navItems` between Products and Contact
- `apps/web/components/layout/BottomTabBar.tsx` — Replaced `wishlist` tab with `gallery` tab; added `GalleryIcon` SVG (photo/image icon); removed `WishlistIcon`, `useWishlistStore`, `useEffect`, `useState` (wishlist count badge gone); `TABS` updated accordingly

**Key decisions:**

- CSS `columns-*` masonry: simplest approach, natural aspect ratios, no JS layout needed
- Tiles expand per-image (not per-product): shows full range of the collection
- Gallery lightbox is self-contained (separate from `Lightbox` in ProductClientView — different UX: product info card below image)
- Wishlist moved out of bottom tab bar; users can access it from the Account section / profile page

---

## What Is Next (potential)

- **Wishlist page link from Account**: Since Wishlist was removed from the tab bar, add a visible "Wishlist" link on the /profile page
- **Search**: Full-text product search
- **Order management**: Mark as shipped, tracking info
- **Analytics dashboard**: Admin home with order stats
- **Category page filtering**: Price range + sort order on /categories/[slug]
