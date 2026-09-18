import assert from 'node:assert/strict'
import test from 'node:test'
import { addCartItem, cartCount, cartTotal, createDemoOrder, filterProducts, orderMatches, productIdFromPath, productMatches, routeName, setCartQuantity } from '../src/storefront/state.js'

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
test('routeName covers storefront, product detail and admin routes',()=>{
 assert.equal(routeName('/'),'home')
 assert.equal(routeName('/products/'),'products')
 assert.equal(routeName('/products/3'),'product')
 assert.equal(productIdFromPath('/products/3'),'3')
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
test('product filters combine category query and maximum price',()=>{
 const list=[
  {name:'Tai nghe',category:'Công nghệ',label:'Mới',price:900000},
  {name:'Túi Tote',category:'Phụ kiện',label:'Mới',price:250000},
 ]
 assert.equal(filterProducts(list,{category:'Phụ kiện',maxPrice:300000}).length,1)
 assert.equal(filterProducts(list,{query:'moi',maxPrice:300000})[0].name,'Túi Tote')
 assert.equal(filterProducts(list,{query:'tai nghe',maxPrice:300000}).length,0)
})
test('demo order stores only non-sensitive summary fields',()=>{
 const order=createDemoOrder([{id:1,price:100,quantity:2}],{owner:' Andy ',fulfillment:'pickup',now:1})
 assert.equal(order.owner,'andy')
 assert.equal(order.total,200)
 assert.equal(order.itemCount,2)
 assert.equal(order.fulfillment,'pickup')
 assert.equal('address' in order,false)
 assert.equal('phone' in order,false)
})
test('order search matches code status and fulfillment without accents',()=>{
 const order={id:'DEMO-ABC',status:'Đơn demo · chưa gửi backend',fulfillment:'pickup',itemCount:2}
 assert.equal(orderMatches(order,'abc'),true)
 assert.equal(orderMatches(order,'chua gui'),true)
 assert.equal(orderMatches(order,'pickup'),true)
 assert.equal(orderMatches(order,'delivery'),false)
})
