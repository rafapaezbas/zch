const sodium = require('sodium-native')

const generateMasterkey = () => {
  const key = Buffer.alloc(sodium.crypto_kdf_KEYBYTES)
  sodium.crypto_kdf_keygen(key)
  return key
}

const deriveSubkey = (key_, sequence) => {
  let key = key_
  const subkey = Buffer.alloc(sodium.crypto_kdf_KEYBYTES)
  sequence.forEach(e => {
    sodium.crypto_kdf_derive_from_key(subkey, e, Buffer.from('context_'), key)
    key = subkey
  })
  return key
}

const keyPair = (seed_) => {
  const pk = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES)
  const sk = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES)
  const seed = seed_ || Buffer.alloc(sodium.crypto_box_SEEDBYTES)
  if (!seed_) sodium.randombytes_buf(seed)
  sodium.crypto_box_seed_keypair(pk, sk, seed_ || seed)
  return { seed, pk, sk }
}

const signKeyPair = (seed_) => {
  const pk = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  const sk = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
  const seed = seed_ || Buffer.alloc(sodium.crypto_sign_SEEDBYTES)
  if (!seed_) sodium.randombytes_buf(seed)
  sodium.crypto_sign_seed_keypair(pk, sk, seed)
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

const sign = (message, sk) => {
  const signature = Buffer.alloc(sodium.crypto_sign_BYTES)
  sodium.crypto_sign_detached(signature, message, sk)
  return signature
}

const verify = (signature, message, pk) => {
  return sodium.crypto_sign_verify_detached(signature, message, pk)
}

module.exports = {
  generateMasterkey,
  deriveSubkey,
  encrypt,
  decrypt,
  keyPair,
  signKeyPair,
  sign,
  verify
}
