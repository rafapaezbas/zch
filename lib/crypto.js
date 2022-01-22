const sodium = require('sodium-native')

const id = () => {
  const address = Buffer.alloc(32)
  const chainCode = Buffer.alloc(32)
  sodium.randombytes_buf(address)
  sodium.randombytes_buf(chainCode)
  return { address, chainCode }
}

const derive = (id, depth) => {
  let address = id.address
  let chainCode = id.chainCode
  for (let i = -1; i < Math.abs(depth); i++) {
    const out = Buffer.alloc(sodium.crypto_hash_BYTES)
    sodium.crypto_hash(out, Buffer.concat([address, chainCode]))
    const IR = out.slice(0, 32)
    const IL = out.slice(32)
    address = IL
    chainCode = IR
  }
  return { address, chainCode }
}

const keyPair = (seed_) => {
  const pk = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES)
  const sk = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES)
  const seed = seed_ || Buffer.alloc(sodium.crypto_box_SEEDBYTES)
  if (!seed_) sodium.randombytes_buf(seed)
  sodium.crypto_box_seed_keypair(pk, sk, seed_ || seed)
  return { seed, pk, sk }
}

module.exports = {
  id,
  derive,
  keyPair
}
