import { createContext, useContext } from 'react'

export const categoryMap = {
  'Tất cả': 'All',
  'Trang sức': 'Jewelry',
  'Trang phục': 'Apparel',
  'Laptop': 'Laptops',
  'Điện tử': 'Electronics',
  'Linh kiện': 'Components',
  'Đồ gia dụng': 'Home Appliances',
  'Tự Thiết Kế': 'Custom Designs',
}

export function translateCategory(cat, lang) {
  if (lang !== 'en') return cat
  return categoryMap[cat] || cat
}

export const translations = {
  vi: {
    // Header & Navigation
    navHome: 'Trang chủ',
    navProducts: 'Hàng hóa',
    navFavorites: 'Yêu thích',
    navRewards: 'May mắn',
    navMembership: 'Thành viên',
    navContact: 'Địa chỉ & liên hệ',
    headerSearchPlaceholder: 'Tìm sản phẩm, danh mục…',
    cart: 'Giỏ hàng',
    signIn: 'Đăng nhập',
    yourAccount: 'Tài khoản của bạn',
    register: 'Đăng ký',
    skipNav: 'Bỏ qua điều hướng',

    // Product Card
    viewDetails: 'Xem chi tiết ↗',
    addToCart: 'Thêm',
    outOfStock: 'Hết hàng',
    inStock: 'Sẵn sàng đặt',

    // Common
    viewMore: 'Xem thêm →',
    search: 'Tìm kiếm',
    clearFilters: 'Xóa lọc',
    loadMore: 'Xem Thêm',
  },
  en: {
    // Header & Navigation
    navHome: 'Home',
    navProducts: 'Products',
    navFavorites: 'Favorites',
    navRewards: 'Rewards',
    navMembership: 'Membership',
    navContact: 'Contact',
    headerSearchPlaceholder: 'Search products, categories…',
    cart: 'Cart',
    signIn: 'Sign in',
    yourAccount: 'Your account',
    register: 'Register',
    skipNav: 'Skip navigation',

    // Product Card
    viewDetails: 'View details ↗',
    addToCart: 'Add',
    outOfStock: 'Out of stock',
    inStock: 'In stock',

    // Common
    viewMore: 'View more →',
    search: 'Search',
    clearFilters: 'Clear filters',
    loadMore: 'Load More',
  },
}

export const LanguageContext = createContext({
  language: 'vi',
  english: false,
  setLanguage: () => {},
  translateCategory: (cat) => cat,
})

export function useLanguage() {
  return useContext(LanguageContext)
}
