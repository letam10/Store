import importedProducts from './imported-products.json' with { type: 'json' }
import { products as featuredProducts, productDataMeta } from '../../shared/products.js'

export const products = [...featuredProducts, ...importedProducts]
export { productDataMeta }
