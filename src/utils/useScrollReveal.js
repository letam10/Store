/**
 * Hook useScrollReveal
 * Mục đích: Tự động gắn class 'is-revealed' cho các phần tử mang class '.reveal-on-scroll'
 * khi cuộn vào khung nhìn màn hình qua IntersectionObserver native, kích hoạt 1 lần.
 * An toàn, nhẹ, không layout reflow, tự dọn dẹp khi unmount.
 */
import { useEffect } from 'react'

export function useScrollReveal(containerRef, selector = '.reveal-on-scroll', options = {}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

    const container = containerRef?.current || document.body
    if (!container) return
    container.classList.add('js-reveal')

    const targets = container.querySelectorAll ? container.querySelectorAll(selector) : []
    if (!targets.length) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        }
      })
    }, {
      rootMargin: options.rootMargin || '0px 0px -40px 0px',
      threshold: options.threshold || 0.08
    })

    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [containerRef, selector, options.rootMargin, options.threshold])
}
