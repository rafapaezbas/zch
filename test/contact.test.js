const test = require('brittle')
const contact = require('../lib/contact')
const crypto = require('../lib/crypto')

test('generates new contact from masterkey', async ({ is, not }) => {
  const masterkey = crypto.generateMasterkey()
  const { address, seed, pk, sk } = contact.contact(masterkey, 0)
  is(address.toString(), crypto.deriveSubkey(masterkey, [0]).toString())
  is(seed.toString(), crypto.deriveSubkey(masterkey, [1]).toString())
  not(pk, undefined)
  not(sk, undefined)
  not(pk.toString(), sk.toString())
})
