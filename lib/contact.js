const crypto = require('./crypto')

const contact = (masterkey, seq) => {
  const address = crypto.deriveSubkey(masterkey, [seq * 2])
  const keyPair = crypto.keyPair(crypto.deriveSubkey(masterkey, [(seq * 2) + 1]))
  const signKeyPair = crypto.signKeyPair(crypto.deriveSubkey(masterkey, [(seq * 2) + 1]))
  return { address, keyPair, signKeyPair }
}

const invitation = (contact) => {
  return [contact.address.toString('hex'), contact.keyPair.pk.toString('hex'), contact.signKeyPair.pk.toString('hex')].join('')
}

module.exports = {
  contact,
  invitation
}
