const crypto = require('./crypto')

const contact = (masterkey, seq) => {
  const address = crypto.deriveSubkey(masterkey, [seq * 2])
  const { seed, pk, sk } = crypto.keyPair(crypto.deriveSubkey(masterkey, [(seq * 2) + 1]))
  return { address, seed, pk, sk }
}

module.exports = {
  contact
}
