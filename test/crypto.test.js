const test = require('brittle')
const crypto = require('../lib/crypto')

test('generates master key', async ({ is, not }) => {
  const masterkey = crypto.generateMasterkey()
  not(masterkey, undefined)
  is(masterkey.length, 32)
})

test('generates subkeys', async ({ is, not }) => {
  const key = crypto.generateMasterkey()
  const subkey = crypto.deriveSubkey(key, 0)
  const subkey1 = crypto.deriveSubkey(key, 1)
  not(subkey.toString(), subkey1.toString())
})

test('encrypt/decrypt message with master key', async ({ is, not }) => {
  const message = 'Hello world!'
  const key = crypto.generateMasterkey()
  const ciphertext = crypto.encrypt(Buffer.from(message), key)
  const plaintext = crypto.decrypt(ciphertext, key)
  not(ciphertext, undefined)
  not(plaintext, undefined)
  is(ciphertext.length, message.length + 16) // sodium.crypto_secretbox_MACBYTES
  is(plaintext.toString(), message)
})
