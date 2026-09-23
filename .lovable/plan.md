# Large storefront update

## Scope
- Replace all bridal positioning with premium women’s lingerie clearance messaging for Spain.
- Add a parent “Ropa interior” category with five nested subcategory URLs and future-ready navigation.
- Verify and complete the supplied 21-SKU catalog with exact stock, cost kept private, translated color codes, and official images.
- Display FR/ES sizing while retaining manufacturer sizes internally; add a complete size guide.
- Restrict GLS delivery to mainland Spain before payment and clarify hygiene-seal return conditions.
- Add unique Spanish SEO fields and metadata for the home page, parent category, subcategories, and every product.

## Technical approach
- Preserve the existing Lovable Cloud catalog schema where possible; add only the fields and hierarchy needed for parent categories and localized SEO.
- Keep product color/type identifiers language-neutral and translate visible labels through the existing dictionary.
- Add new TanStack route files matching `/$lang/ropa-interior`, `/$lang/ropa-interior/$category`, and product detail beneath the category; update every typed link in the same change.
- Keep stock checks and decrements server-side and map displayed FR/ES sizes back to stored manufacturer variants.
- Validate excluded provinces and postal ranges in both the checkout page and order creation.
- Define route-specific head metadata, canonical URLs, Open Graph metadata, and structured data using localized product/category fields.

## Validation
- Confirm 21 active products and total stock of 432 units in Lovable Cloud.
- Exercise nested navigation, filters, FR/ES selectors, size guide, cart, and blocked mainland-exclusion addresses in the browser.
- Search rendered/source text for forbidden bridal terms and check metadata on representative routes.
