const test = require('brittle')
const crypto = require('../lib/crypto')

test('should derive new id', async ({ teardown, is, not }) => {
  const id = crypto.id()
  const address1 = id.address
  const address2 = crypto.derive(id, 0).address
  not(address1.toString(), address2.toString())
})

test('address and chainCode are 32 bytes', async ({ teardown, is, not }) => {
  const id = crypto.id()
  const derivated = crypto.derive(id, 1000)
  is(derivated.address.length, 32)
  is(derivated.chainCode.length, 32)
  not(derivated.address.toString(), derivated.chainCode.toString())
})

test('negative/positive depth derives the same', async ({ teardown, is, not }) => {
  const id = crypto.id()
  const address1 = crypto.derive(id, -5).address
  const address2 = crypto.derive(id, 5).address
  is(address1.toString(), address2.toString())
})
