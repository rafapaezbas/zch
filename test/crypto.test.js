const test = require('brittle')
const crypto = require('../lib/crypto')

test('should derive new id', async ({ not }) => {
  const id = crypto.id()
  const address1 = id.address
  const address2 = crypto.derive(id, 0).address
  not(address1.toString(), address2.toString())
})

test('address and chainCode are 32 bytes', async ({ is, not }) => {
  const id = crypto.id()
  const derivated = crypto.derive(id, 1000)
  is(derivated.address.length, 32)
  is(derivated.chainCode.length, 32)
  not(derivated.address.toString(), derivated.chainCode.toString())
})

test('negative/positive depth derives the same', async ({ is }) => {
  const id = crypto.id()
  const address1 = crypto.derive(id, -5).address
  const address2 = crypto.derive(id, 5).address
  is(address1.toString(), address2.toString())
})

test('Keypair generation works with/without seed', async ({ is, not }) => {
  const keyPair1 = crypto.keyPair()
  const seed = Buffer.allocUnsafe(32).toString()
  const keyPair2 = crypto.keyPair(Buffer.from(seed))
  not(keyPair1.seed && keyPair1.pk && keyPair1.sk, undefined)
  not(keyPair2.seed && keyPair2.pk && keyPair2.sk, undefined)
  is(seed, keyPair2.seed.toString())
})
