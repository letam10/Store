/**
 * @codex-vn-doc
 * Tệp: src/pages/Catalog.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Catalog.
 * Liên kết trực tiếp: react, ../components/ui/ProductCard, ../storefront/state, ../storefront/catalog.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import DropdownMenu from '../components/ui/DropdownMenu'
import { closeDropdownMenus } from '../components/ui/dropdownEvents'
import ProductCard from '../components/ui/ProductCard'
import { filterProducts } from '../storefront/state'
import { useLanguage, translateCategory } from '../storefront/i18n'
import { CATALOG_PAGE_SIZE, generatePaginationItems as makePaginationItems } from '../storefront/catalog'
import './Storefront.css'

const PAGE_SIZE = CATALOG_PAGE_SIZE
const generatePaginationItems = makePaginationItems

// Chức năng Catalog: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Catalog({ products, search, onAddToCart, favoriteIds = [], onToggleFavorite, language = 'vi' }) {
  const langContext = useLanguage()
  const activeLang = language || langContext.language || 'vi'
  const english = activeLang === 'en'
  const localizedMaxPriceOptions = [
    { value: 0, label: english ? 'Unlimited' : 'Không giới hạn' },
    { value: 500000, label: '500.000 ₫' },
    { value: 1000000, label: '1.000.000 ₫' },
    { value: 5000000, label: '5.000.000 ₫' },
    { value: 10000000, label: '10.000.000 ₫' },
    { value: 25000000, label: '25.000.000 ₫' },
  ]
  const localizedSortOptions = [
    { value: 'featured', label: english ? 'Default' : 'Mặc định' },
    { value: 'popular', label: english ? 'Most viewed' : 'Xem nhiều nhất' },
    { value: 'favorite', label: english ? 'Most favorited' : 'Yêu thích nhiều nhất' },
    { value: 'discount', label: english ? 'Highest discount' : 'Giảm giá cao nhất' },
    { value: 'price-asc', label: english ? 'Price: Low → High' : 'Giá thấp → cao' },
    { value: 'price-desc', label: english ? 'Price: High → Low' : 'Giá cao → thấp' },
  ]
  const params = new URLSearchParams(search)
  const [category, setCategory] = useState(params.get('category') || 'Tất cả')
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const [query, setQuery] = useState(params.get('q') || '')
  const [sort, setSort] = useState(params.get('sort') || 'featured')
  const [popularityOnly, setPopularityOnly] = useState(params.get('sort') === 'popular')
  const [favoriteSort, setFavoriteSort] = useState(params.get('sort') === 'favorite')
  const [maxPrice, setMaxPrice] = useState(0)
  const [discountOnly, setDiscountOnly] = useState(params.get('discount') === '1')
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(params.get('page'), 10)
    return Number.isFinite(p) && p > 0 ? p : 1
  })
  const filtersMounted = useRef(false)
  const pageRef = useRef(null)
  const headingRef = useRef(null)
  const sidebarRef = useRef(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Đo tiêu đề và bộ lọc để các lớp sticky không đè nhau khi đổi kích thước màn hình.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    const measure = () => {
      pageRef.current?.style.setProperty('--catalog-heading-height', `${headingRef.current?.getBoundingClientRect().height || 0}px`)
      pageRef.current?.style.setProperty('--catalog-filter-height', `${sidebarRef.current?.getBoundingClientRect().height || 0}px`)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(headingRef.current)
    observer.observe(sidebarRef.current)
    measure()
    return () => observer.disconnect()
  }, [])
  const categories = ['Tất cả', ...new Set(products.map((item) => item.category))]
  const visible = useMemo(() => {
    // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
    const list = filterProducts(products, { category, query, maxPrice }).filter((item) =>
      !discountOnly || item.discountPercent > 0)
    if (popularityOnly) return [...list].sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0))
    if (favoriteSort) return [...list].sort((a, b) => Number(b.favoriteCount || 0) - Number(a.favoriteCount || 0) || Number(b.viewCount || 0) - Number(a.viewCount || 0))
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'popular') return [...list].sort((a, b) => b.viewCount - a.viewCount)
    if (sort === 'discount') return [...list].sort((a, b) => b.discountPercent - a.discountPercent)
    return list
  }, [products, category, query, maxPrice, sort, popularityOnly, favoriteSort, discountOnly])
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const filtersActive = query.trim() || category !== 'Tất cả' || Number(maxPrice) > 0 || sort !== 'featured' || popularityOnly || favoriteSort || discountOnly

  useEffect(() => {
    // Mỗi lần đổi bộ lọc/danh mục, đưa người dùng về đầu danh sách và trang 1.
    if (!filtersMounted.current) {
      filtersMounted.current = true
      return
    }
    setCurrentPage(1)
    window.scrollTo?.(0, 0)
  }, [category, query, maxPrice, sort, popularityOnly, favoriteSort, discountOnly])

  // Chức năng resetFilters: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function resetFilters() {
    closeDropdownMenus()
    setQuery('')
    setCategory('Tất cả')
    setMaxPrice(0)
    setSort('featured')
    setPopularityOnly(false)
    setFavoriteSort(false)
    setDiscountOnly(false)
    setCurrentPage(1)
  }

  const totalCount = visible.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount)
  const pagedProducts = visible.slice(startIndex, endIndex)

  function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages || newPage === safePage) return
    setCurrentPage(newPage)
    headingRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  return <div className="container page-shell catalog-page" ref={pageRef}>
    <header ref={headingRef} className="page-head catalog-page-head">
      <div>
        <p className="eyebrow">{english ? 'Product Catalog' : 'Danh sách hàng hóa'}</p>
        <h1>{english ? 'Choose what suits you best.' : 'Chọn món phù hợp với bạn.'}</h1>
      </div>
      <p className="muted">{english ? `Showing ${totalCount === 0 ? 0 : `${startIndex + 1}–${endIndex}`} of ${totalCount} products` : `Hiển thị ${totalCount === 0 ? 0 : `${startIndex + 1}–${endIndex}`}/${totalCount} sản phẩm`}</p>
    </header>
    <div className="catalog-layout">
      <aside ref={sidebarRef} className={'catalog-sidebar surface' + (filtersOpen ? ' is-open' : '')} aria-label="Bộ lọc sản phẩm">
        <div className="catalog-sidebar__head"><h2>{english ? 'Filter & Search' : 'Tìm & lọc'}</h2>{filtersActive && <button type="button" onClick={resetFilters}>{english ? 'Clear filters' : 'Xóa lọc'}</button>}<button className="catalog-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? (english ? 'Collapse' : 'Thu gọn') : (english ? 'Open filters' : 'Mở bộ lọc')}</button></div><div className="catalog-filters" id="catalog-filters">
        <label className="field"><span>{english ? 'Search' : 'Tìm kiếm'}</span><input type="search" value={query} onChange={(event) => { closeDropdownMenus(); setQuery(event.target.value); setCurrentPage(1) }} placeholder={english ? 'Product name or category…' : 'Tên hoặc nhóm hàng…'} /></label>
        <fieldset className="catalog-category-list">
          <legend>{english ? 'Product categories' : 'Danh mục sản phẩm'}</legend>
          <div className="catalog-category-list__items" role="listbox" aria-label="Danh mục sản phẩm">
            {categories.map((item) => <button key={item} type="button" role="option" aria-selected={category === item} className={category === item ? 'is-active' : ''} onClick={() => { closeDropdownMenus(); setCategory(item); setCurrentPage(1) }}>{translateCategory(item, activeLang)}</button>)}
          </div>
        </fieldset>
        <label className="catalog-checkbox"><input type="checkbox" checked={discountOnly} onChange={(event) => { closeDropdownMenus(); setDiscountOnly(event.target.checked); setCurrentPage(1) }} />{english ? 'Discounted products only' : 'Lọc sản phẩm giảm giá'}</label>
        <label className="catalog-checkbox"><input type="checkbox" checked={popularityOnly} onChange={(event) => { const checked = event.target.checked; closeDropdownMenus(); setPopularityOnly(checked); setFavoriteSort(false); setSort(checked ? 'popular' : 'featured'); setCurrentPage(1) }} />{english ? 'Popular products only' : 'Chỉ sản phẩm phổ biến'}</label>
        <label className="catalog-checkbox"><input type="checkbox" checked={favoriteSort} onChange={(event) => { const checked = event.target.checked; closeDropdownMenus(); setFavoriteSort(checked); setPopularityOnly(false); setSort(checked ? 'favorite' : 'featured'); setCurrentPage(1) }} />{english ? 'Favorited products only' : 'Chỉ sản phẩm yêu thích'}</label>
        <label className="field"><span>{english ? 'Max price' : 'Giá tối đa'}</span><DropdownMenu value={maxPrice} options={localizedMaxPriceOptions} ariaLabel={english ? 'Max price' : 'Giá tối đa'} onChange={(nextPrice) => { closeDropdownMenus(); setMaxPrice(Number(nextPrice)); setCurrentPage(1) }} /></label>
        <label className="field"><span>{english ? 'Sort by' : 'Sắp xếp'}</span><DropdownMenu value={sort} options={localizedSortOptions} ariaLabel={english ? 'Sort products' : 'Sắp xếp sản phẩm'} onChange={(nextSort) => { closeDropdownMenus(); setSort(nextSort); setPopularityOnly(nextSort === 'popular'); setFavoriteSort(nextSort === 'favorite'); setCurrentPage(1) }} /></label>
        <p className="catalog-sidebar__hint">{english ? 'Filters stay handy as you browse.' : 'Bộ lọc luôn ở bên cạnh khi bạn cuộn danh sách.'}</p>
      </div></aside>
      <div className="catalog-results">
        <div className="catalog-results__head">
          <div>
            <p className="eyebrow">{english ? 'CURRENT LIST' : 'DANH SÁCH HIỆN TẠI'}</p>
            <h2>{english ? 'Displaying Products' : 'Các sản phẩm đang hiển thị'}</h2>
          </div>
          <span>{totalCount > 0 ? (english ? `Page ${safePage}/${totalPages} · ${totalCount} items` : `Trang ${safePage}/${totalPages} · ${totalCount} sản phẩm`) : (english ? '0 items' : '0 sản phẩm')}</span>
        </div>
        <div className="product-grid catalog-grid">{pagedProducts.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(product.id))} onToggleFavorite={onToggleFavorite} />)}</div>
        {totalPages > 1 && (
          <nav className="catalog-pagination" aria-label={english ? 'Product pagination' : 'Phân trang sản phẩm'}>
            <button
              type="button"
              className="catalog-pagination__btn catalog-pagination__btn--nav"
              disabled={safePage === 1}
              onClick={() => changePage(1)}
              aria-label={english ? 'First page' : 'Trang đầu'}
              title={english ? 'First page' : 'Trang đầu'}
            >
              «
            </button>
            <button
              type="button"
              className="catalog-pagination__btn catalog-pagination__btn--nav"
              disabled={safePage === 1}
              onClick={() => changePage(safePage - 1)}
              aria-label={english ? 'Previous page' : 'Trang trước'}
              title={english ? 'Previous page' : 'Trang trước'}
            >
              ‹ {english ? 'Prev' : 'Trước'}
            </button>
            <div className="catalog-pagination__pages">
              {generatePaginationItems(safePage, totalPages).map((item, index) =>
                item === '...' ? (
                  <span key={`ellipsis-${index}`} className="catalog-pagination__ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    type="button"
                    className={`catalog-pagination__btn catalog-pagination__page${safePage === item ? ' is-active' : ''}`}
                    aria-current={safePage === item ? 'page' : undefined}
                    aria-label={english ? `Page ${item}` : `Trang ${item}`}
                    onClick={() => changePage(item)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="catalog-pagination__btn catalog-pagination__btn--nav"
              disabled={safePage === totalPages}
              onClick={() => changePage(safePage + 1)}
              aria-label={english ? 'Next page' : 'Trang sau'}
              title={english ? 'Next page' : 'Trang sau'}
            >
              {english ? 'Next' : 'Sau'} ›
            </button>
            <button
              type="button"
              className="catalog-pagination__btn catalog-pagination__btn--nav"
              disabled={safePage === totalPages}
              onClick={() => changePage(totalPages)}
              aria-label={english ? 'Last page' : 'Trang cuối'}
              title={english ? 'Last page' : 'Trang cuối'}
            >
              »
            </button>
          </nav>
        )}
        {visible.length === 0 && <div className="surface empty-panel"><h2>{english ? 'No products found' : 'Không tìm thấy sản phẩm'}</h2><p className="muted">{english ? 'Try different keywords or clear filters.' : 'Thử từ khóa khác hoặc bỏ bộ lọc.'}</p><button className="button button--soft" type="button" onClick={resetFilters}>{english ? 'Clear filters' : 'Xóa bộ lọc'}</button></div>}
        <p className="muted catalog-attribution">{english ? 'Product images and information from' : 'Ảnh và thông tin sản phẩm từ'} <a href="https://amazon-berkeley-objects.s3.amazonaws.com/index.html" target="_blank" rel="noopener noreferrer">Amazon Berkeley Objects</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>) {english ? 'and' : 'và'} <a href="https://dummyjson.com/docs/products" target="_blank" rel="noopener noreferrer">DummyJSON</a>. {english ? 'Prices and stock confirmed at order time.' : 'Giá và tồn kho được xác nhận khi đặt hàng.'}</p>
      </div>
    </div>
  </div>
}
