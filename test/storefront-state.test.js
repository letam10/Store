import assert from 'node:assert/strict'
import test from 'node:test'
import { addCartItem, cartCount, cartTotal, productMatches, routeName, setCartQuantity } from '../src/storefront/state.js'

const product={id:1,name:'A',price:100}
test('cart helpers add, increment, total and remove deterministically',()=>{
 let cart=[]
 cart=addCartItem(cart,product)
 cart=addCartItem(cart,product)
 assert.equal(cart.length,1)
 assert.equal(cart[0].quantity,2)
 assert.equal(cartCount(cart),2)
 assert.equal(cartTotal(cart),200)
 cart=setCartQuantity(cart,1,0)
 assert.deepEqual(cart,[])
})
test('routeName covers storefront and admin routes',()=>{
 assert.equal(routeName('/'),'home')
 assert.equal(routeName('/products/'),'products')
 assert.equal(routeName('/checkout'),'checkout')
 assert.equal(routeName('/admin/settings'),'admin')
 assert.equal(routeName('/missing'),'not-found')
})

test('product search matches accents, category and label',()=>{
 const item={name:'Túi Everyday Tote',category:'Phụ kiện',label:'Mới'}
 assert.equal(productMatches(item,'tui'),true)
 assert.equal(productMatches(item,'phu kien'),true)
 assert.equal(productMatches(item,'moi'),true)
 assert.equal(productMatches(item,'tai nghe'),false)
})
