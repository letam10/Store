import { useEffect, useState } from 'react'
import { customerApi } from '../../api/customer'
import { salePrice } from '../../services/catalog'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase()

export default function ReplacementPicker({ items, onChange, disabled }) {
  const [products, setProducts] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    customerApi('/api/storefront/catalog', { signal: controller.signal }).then(data => setProducts(data.products))
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [])
  const available = (products || []).filter(product => product.stockCount > 0
    && normalize(product.name + ' ' + product.category).includes(normalize(query)) && !items.some(item => item.id === product.id))
  function quantity(id, value) {
    onChange(items.map(item => item.id === id ? { ...item, quantity: value === '' ? '' : Number(value) } : item))
  }
  return <fieldset className="replacement-picker" disabled={disabled}>
    <legend>Chọn hàng thay thế cho toàn bộ đơn</legend>
    <p>Gửi lại toàn bộ hàng đang có của đơn. Giá trị đã thanh toán được trừ vào hàng thay thế; bạn xem và đồng ý bảng phí trước khi gửi yêu cầu.</p>
    <label className="field"><span>Tìm sản phẩm thay thế</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nhập tên hoặc danh mục" /></label>
    {!products && !error && <p role="status">Đang tải sản phẩm…</p>}{error && <p role="alert">{error}</p>}
    <div className="replacement-results">{available.slice(0, 10).map(product => <div key={product.id}>
      <span><b>{product.name}</b><small>{money.format(salePrice(product.price, product.discountPercent))} · Còn {product.stockCount}</small></span>
      <button type="button" onClick={() => onChange([...items, { id: product.id, name: product.name, quantity: 1, stockCount: product.stockCount }])}>Chọn</button>
    </div>)}</div>
    {products && !available.length && <p>Không còn sản phẩm phù hợp với tìm kiếm này.</p>}
    {available.length > 10 && <p>Đang hiện 10 kết quả. Nhập thêm tên để tìm chính xác hơn.</p>}
    {items.length > 0 && <div className="replacement-selected"><h4>Hàng đã chọn</h4>{items.map(item => <div key={item.id}>
      <span>{item.name}</span><label>Số lượng<input aria-label={'Số lượng ' + item.name} required type="number" min="1" max={Math.min(999, item.stockCount)} step="1" value={item.quantity} onChange={event => quantity(item.id, event.target.value)} /></label>
      <button type="button" onClick={() => onChange(items.filter(selected => selected.id !== item.id))}>Bỏ</button>
    </div>)}</div>}
  </fieldset>
}
