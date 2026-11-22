/*
  FILE NOTE
  - Mục đích: Service & Hook quản lý chính sách thẻ thành viên động (/api/storefront/membership), hỗ trợ tính hạng theo điểm, chiết khấu và quyền lợi hiển thị đồng bộ với cài đặt Admin.
  - Liên kết trực tiếp: src/services/promotions.js, src/pages/Membership.jsx, src/pages/Rewards.jsx, src/pages/Account.jsx, src/pages/Checkout.jsx
  - Vùng ảnh hưởng khi sửa: Quyền lợi, mốc điểm, chiết khấu và lượt quay may mắn hiển thị trên toàn bộ trang Store.
*/
import { useEffect, useState } from 'react'

export const DEFAULT_MEMBERSHIP_POLICY = Object.freeze({
  schemaVersion: 1,
  goodsPerBasePoint: 1000,
  goodsPerSpin: 100000,
  footerNote: 'Chỉ tính tiền hàng đã thanh toán sau giảm giá, không gồm phí vận chuyển và phí dịch vụ. Mỗi 1.000 đ tròn nhận 1 điểm cơ bản; 999 đ không cộng điểm. Sau đó nhân quyền lợi hạng tại lúc đặt đơn và bỏ phần lẻ điểm. Đổi/trả hàng sẽ điều chỉnh điểm của đơn tương ứng.',
  tiers: Object.freeze([
    Object.freeze({
      id: 'bronze',
      englishLabel: 'BRONZE',
      name: 'Đồng',
      subtitle: 'Hạng mặc định, miễn phí.',
      minPoints: 0,
      discountPercent: 0,
      multiplier: 1.0,
      benefits: Object.freeze([
        'Tích 1 điểm cho mỗi 1.000 đ hàng hóa đã thanh toán',
        'Mỗi 100.000 đ đã thanh toán nhận 1 lượt quay'
      ])
    }),
    Object.freeze({
      id: 'silver',
      englishLabel: 'SILVER',
      name: 'Bạc',
      subtitle: 'Mở khóa khi tích đủ 100 điểm.',
      minPoints: 100,
      discountPercent: 1,
      multiplier: 1.0,
      benefits: Object.freeze([
        'Tự động giảm thêm 1% khi thanh toán',
        'Giữ quyền lợi hạng Đồng'
      ])
    }),
    Object.freeze({
      id: 'gold',
      englishLabel: 'GOLD',
      name: 'Vàng',
      subtitle: 'Mở khóa khi tích đủ 1.000 điểm.',
      minPoints: 1000,
      discountPercent: 2,
      multiplier: 1.2,
      benefits: Object.freeze([
        'Giữ nguyên lợi ích hạng Bạc và hạng Đồng',
        'Tự động giảm thêm 2% khi thanh toán',
        'Tích điểm x1,2',
        'Phí giao hàng nội thành theo mức chung 30.000 đ'
      ])
    }),
    Object.freeze({
      id: 'diamond',
      englishLabel: 'DIAMOND',
      name: 'Kim Cương',
      subtitle: 'Mở khóa khi tích đủ 10.000 điểm.',
      minPoints: 10000,
      discountPercent: 5,
      multiplier: 1.5,
      benefits: Object.freeze([
        'Giữ nguyên lợi ích hạng Vàng, Bạc và hạng Đồng',
        'Tự động giảm thêm 5% khi thanh toán',
        'Tích điểm x1,5',
        'Phí giao hàng theo khu vực áp dụng chung'
      ])
    })
  ])
})

export function normalizeMembershipPolicy(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_MEMBERSHIP_POLICY
  const tiers = Array.isArray(raw.tiers) && raw.tiers.length === 4
    ? raw.tiers.map((t, idx) => {
        const fallback = DEFAULT_MEMBERSHIP_POLICY.tiers[idx] || DEFAULT_MEMBERSHIP_POLICY.tiers[0]
        return {
          id: String(t.id || fallback.id).toLowerCase(),
          englishLabel: String(t.englishLabel || fallback.englishLabel).toUpperCase(),
          name: String(t.name || fallback.name),
          subtitle: String(t.subtitle || fallback.subtitle),
          minPoints: typeof t.minPoints === 'number' ? Math.max(0, t.minPoints) : fallback.minPoints,
          discountPercent: typeof t.discountPercent === 'number' ? Math.max(0, Math.min(50, t.discountPercent)) : fallback.discountPercent,
          multiplier: typeof t.multiplier === 'number' ? Math.max(1, t.multiplier) : fallback.multiplier,
          benefits: Array.isArray(t.benefits) && t.benefits.length ? t.benefits.map(String) : fallback.benefits
        }
      })
    : DEFAULT_MEMBERSHIP_POLICY.tiers

  return {
    schemaVersion: Number(raw.schemaVersion) || 1,
    goodsPerBasePoint: Number(raw.goodsPerBasePoint) || DEFAULT_MEMBERSHIP_POLICY.goodsPerBasePoint,
    goodsPerSpin: Number(raw.goodsPerSpin) || DEFAULT_MEMBERSHIP_POLICY.goodsPerSpin,
    footerNote: String(raw.footerNote || DEFAULT_MEMBERSHIP_POLICY.footerNote),
    updatedAt: raw.updatedAt || null,
    tiers
  }
}

export function resolveTierFromPolicy(points = 0, policy = DEFAULT_MEMBERSHIP_POLICY) {
  const pts = Math.max(0, Number(points || 0))
  const tiers = policy?.tiers || DEFAULT_MEMBERSHIP_POLICY.tiers
  let current = tiers[0]
  for (const tier of tiers) {
    if (pts >= tier.minPoints) current = tier
  }
  return current
}

export function getTierDiscountPercent(tierId = 'bronze', policy = DEFAULT_MEMBERSHIP_POLICY) {
  const key = String(tierId || 'bronze').toLowerCase()
  const found = (policy?.tiers || DEFAULT_MEMBERSHIP_POLICY.tiers).find((t) => t.id === key)
  return found?.discountPercent ?? 0
}

export function getTierDisplayName(tierId = 'bronze', policy = DEFAULT_MEMBERSHIP_POLICY) {
  const key = String(tierId || 'bronze').toLowerCase()
  const found = (policy?.tiers || DEFAULT_MEMBERSHIP_POLICY.tiers).find((t) => t.id === key)
  return found?.name || 'Đồng'
}

export function formatPoints(n, locale = 'vi-VN') {
  return new Intl.NumberFormat(locale).format(Number(n || 0))
}

let cachedPolicy = null
const listeners = new Set()

export async function fetchMembershipPolicy(signal = null) {
  try {
    const res = await fetch('/api/storefront/membership', {
      method: 'GET',
      credentials: 'same-origin',
      signal
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.policy) {
        cachedPolicy = normalizeMembershipPolicy(data.policy)
        listeners.forEach((fn) => fn(cachedPolicy))
        return cachedPolicy
      }
    }
  } catch (_) {}
  return cachedPolicy || DEFAULT_MEMBERSHIP_POLICY
}

export function useMembershipPolicy() {
  const [policy, setPolicy] = useState(() => cachedPolicy || DEFAULT_MEMBERSHIP_POLICY)
  const [loading, setLoading] = useState(!cachedPolicy)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const onPolicyChange = (next) => {
      if (active) setPolicy(next)
    }
    listeners.add(onPolicyChange)

    fetchMembershipPolicy(controller.signal)
      .then((p) => {
        if (active) {
          setPolicy(p)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMembershipPolicy().then((p) => { if (active) setPolicy(p) })
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)

    return () => {
      active = false
      controller.abort()
      listeners.delete(onPolicyChange)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
    }
  }, [])

  return { policy, loading, refresh: fetchMembershipPolicy }
}
