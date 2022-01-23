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

const encrypt = (message, key) => {
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  const ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)
  sodium.crypto_secretbox_easy(ciphertext, message, nonce, key)
  return ciphertext
}

const decrypt = (ciphertext, key) => {
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  const plainText = Buffer.alloc(ciphertext.length - sodium.crypto_secretbox_MACBYTES)
  sodium.crypto_secretbox_open_easy(plainText, ciphertext, nonce, key)
  return plainText
}

module.exports = {
  generateMasterkey,
  deriveSubkey,
  encrypt,
  decrypt
}
