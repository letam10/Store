import importedProducts from './imported-products.json'
import { products as featuredProducts, productDataMeta } from '../../shared/products.js'

export const products = [...featuredProducts, ...importedProducts]
export { productDataMeta }
