const sodium = require('sodium-native')

const generateMasterkey = () => {
  const key = Buffer.alloc(sodium.crypto_kdf_KEYBYTES)
  sodium.crypto_kdf_keygen(key)
  return key
}

const deriveSubkey = (key, subkeyId) => {
  const subkey = Buffer.alloc(sodium.crypto_kdf_BYTES_MIN)
  sodium.crypto_kdf_derive_from_key(subkey, subkeyId, Buffer.from('context_'), key)
  return subkey
}

const keyPair = (seed_) => {
  const pk = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES)
  const sk = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES)
  const seed = seed_ || Buffer.alloc(sodium.crypto_box_SEEDBYTES)
  if (!seed_) sodium.randombytes_buf(seed)
  sodium.crypto_box_seed_keypair(pk, sk, seed_ || seed)
  return { seed, pk, sk }
}

const encrypt = (message, pk) => {
  const ciphertext = Buffer.alloc(message.length + sodium.crypto_box_SEALBYTES)
  sodium.crypto_box_seal(ciphertext, message, pk)
  return ciphertext
}

const decrypt = (ciphertext, pk, sk) => {
  const plainText = Buffer.alloc(ciphertext.length - sodium.crypto_box_SEALBYTES)
  sodium.crypto_box_seal_open(plainText, ciphertext, pk, sk)
  return plainText
}

module.exports = {
  generateMasterkey,
  deriveSubkey,
  encrypt,
  decrypt,
  keyPair
}
