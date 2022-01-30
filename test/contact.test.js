const test = require('brittle')
const contact = require('../lib/contact')
const crypto = require('../lib/crypto')

test('generates new contact from masterkey', async ({ is, not }) => {
  const masterkey = crypto.generateMasterkey()
  const { address, keyPair, signKeyPair } = contact.contact(masterkey, 0)
  is(address.toString(), crypto.deriveSubkey(masterkey, [0]).toString())
  is(keyPair.seed.toString(), crypto.deriveSubkey(masterkey, [1]).toString())
  is(signKeyPair.seed.toString(), crypto.deriveSubkey(masterkey, [1]).toString())
  not(keyPair.pk, undefined)
  not(keyPair.sk, undefined)
  not(keyPair.pk.toString(), keyPair.sk.toString())
})

test('invitation does not contain any secret key', async ({ is, not }) => {
  const masterkey = crypto.generateMasterkey()
  const newContact = contact.contact(masterkey, 0)
  const invitation = contact.invitation(newContact)
  not(invitation.indexOf(newContact.keyPair.pk.toString('hex')), -1)
  not(invitation.indexOf(newContact.signKeyPair.pk.toString('hex')), -1)
  is(invitation.indexOf(newContact.keyPair.sk.toString('hex')), -1)
  is(invitation.indexOf(newContact.signKeyPair.sk.toString('hex')), -1)
})
