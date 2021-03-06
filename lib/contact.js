const crypto = require('./crypto')
const { getConfig } = require('./config')

const contact = async (masterkey, seq) => {
  const address = crypto.deriveSubkey(masterkey, [seq * 2])
  const keyPair = crypto.keyPair(crypto.deriveSubkey(masterkey, [(seq * 2) + 1]))
  const signKeyPair = crypto.signKeyPair(crypto.deriveSubkey(masterkey, [(seq * 2) + 1]))
  const relay = (await getConfig()).relay
  return { address, keyPair, signKeyPair, relay }
}

const invitation = (contact) => {
  return [contact.address.toString('hex'), contact.keyPair.pk.toString('hex'), contact.signKeyPair.pk.toString('hex'), contact.relay].join('')
}

const invitationTransform = (invitation) => {
  return {
    rootAddress: Buffer.from(invitation.slice(0, 64), 'hex'), // string representation of 32 bytes hexadecimal key is 64 bytes
    pk: Buffer.from(invitation.slice(64, 128), 'hex'),
    signPk: Buffer.from(invitation.slice(128, 192), 'hex'),
    relay: Buffer.from(invitation.slice(192, 256), 'hex')
  }
}

const subaddress = (address, n) => {
  return crypto.deriveSubkey(address, [n])
}

module.exports = {
  contact,
  invitation,
  subaddress,
  invitationTransform
}
