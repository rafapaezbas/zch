const test = require('brittle')
const crypto = require('../lib/crypto')

test('generates master key', async ({ is, not }) => {
  const masterkey = crypto.generateMasterkey()
  not(masterkey, undefined)
  is(masterkey.length, 32)
})

test('subkey 0 is the key itself', async ({ not }) => {
  const key = crypto.generateMasterkey()
  const subkey0 = crypto.deriveSubkey(key, [0])
  const subkey1 = crypto.deriveSubkey(key, [1])
  not(key.toString(), subkey0.toString())
  not(subkey0.toString(), subkey1.toString())
})

test('can derive path', async ({ not }) => {
  const key = crypto.generateMasterkey()
  const subkey0 = crypto.deriveSubkey(key, [0])
  const subkey00 = crypto.deriveSubkey(key, [0, 0])
  const subkey1 = crypto.deriveSubkey(key, [1])
  const subkey10 = crypto.deriveSubkey(key, [1, 0])
  not(subkey0.toString(), subkey00.toString())
  not(subkey1.toString(), subkey00.toString())
  not(subkey1.toString(), subkey10.toString())
  not(subkey00.toString(), subkey10.toString())
})

test('Keypair generation works with/without seed', async ({ is, not }) => {
  const keyPair1 = crypto.keyPair()
  const seed = Buffer.allocUnsafe(32).toString('hex')
  const keyPair2 = crypto.keyPair(Buffer.from(seed, 'hex'))
  not(keyPair1.seed && keyPair1.pk && keyPair1.sk, undefined)
  not(keyPair2.seed && keyPair2.pk && keyPair2.sk, undefined)
  is(seed, keyPair2.seed.toString('hex'))
})

test('encrypt/decrypt message with master key', async ({ is, not }) => {
  const message = 'Hello world!'
  const { pk, sk } = crypto.keyPair()
  const ciphertext = crypto.encrypt(Buffer.from(message), pk)
  const plaintext = crypto.decrypt(ciphertext, pk, sk)
  not(ciphertext, undefined)
  not(plaintext, undefined)
  not(ciphertext, plaintext)
  is(plaintext.toString(), message)
})

test('can create keyPair from masterkey', async ({ is, not }) => {
  const key = crypto.generateMasterkey().toString('hex')
  const { seed, pk, sk } = crypto.keyPair(Buffer.from(key, 'hex'))
  is(key, seed.toString('hex'))
  not(pk, undefined)
  not(sk, undefined)
})

test('creates same keypair from same masterkey', async ({ is, not }) => {
  const key = crypto.generateMasterkey().toString('hex')
  const { seed1, pk1, sk1 } = crypto.keyPair(Buffer.from(key, 'hex'))
  const { seed2, pk2, sk2 } = crypto.keyPair(Buffer.from(key, 'hex'))
  is(seed1, seed2)
  is(pk1, pk2)
  is(sk1, sk2)
})
