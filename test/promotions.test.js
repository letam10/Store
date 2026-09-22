import assert from 'node:assert/strict'
import test from 'node:test'
import { availableVouchers, evaluateVoucher, getMembershipPlan } from '../src/storefront/promotions.js'

test('voucher engine enforces subtotal and membership tier',()=>{
 assert.equal(evaluateVoucher('STORE50',499000,'standard').valid,false)
 assert.equal(evaluateVoucher('STORE50',500000,'standard').discount,50000)
 assert.equal(evaluateVoucher('VIP100',1200000,'standard').valid,false)
 assert.equal(evaluateVoucher('VIP100',1200000,'vip').discount,100000)
 assert.equal(evaluateVoucher('ELITE15',2000000,'elite').discount,200000)
})

test('available vouchers only returns currently eligible demo offers',()=>{
 const standard=availableVouchers(1200000,'standard').map((item)=>item.code)
 const elite=availableVouchers(1200000,'elite').map((item)=>item.code)
 assert.deepEqual(standard,['STORE50','EVERYDAY10'])
 assert.equal(elite.includes('VIP100'),true)
 assert.equal(elite.includes('ELITE15'),true)
})

test('membership falls back safely',()=>{
 assert.equal(getMembershipPlan('vip').name,'VIP')
 assert.equal(getMembershipPlan('missing').id,'standard')
})
