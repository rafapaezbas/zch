const gui = require('./gui')
const { getConfig, setConfig } = require('./config')
const contact = require('./contact')
const subcommand = require('subcommand')
const { getState, getRelayClient } = require('./state')
const { loadDB } = require('../lib/db')
const { query } = require('../lib/messages')
const { decode } = require('compact-encoding')
const crypto = require('../lib/crypto')

const commands = [
  {
    name: 'add-contact',
    command: async (args) => {
      // TODO add watch
      if (args.alias) { // TODO check if alias already used
        const config = await getConfig()
        const db = await loadDB()
        const newContact = await contact.contact(Buffer.from(config.masterkey, 'hex'), config.contacts.length)
        const inbox = contact.invitation(newContact)
        await initInboxRelay(inbox, args.alias)
        config.contacts.push({ alias: args.alias, inbox, outbox: args.invitation, active: true })
        getState().messages.set(args.alias, { in: [], out: [] })
        await setConfig(config)
        gui.addContact(args.alias, inbox)
        if (args.invitation) {
          const relayClient = await initRelayClient(args.invitation)
          await relayClient.ready()
          const message = await sendInvitation(args.invitation, inbox, relayClient)
          await db.put(args.alias + '!' + message.timestamp, message.payload)
          getState().messages.get(args.alias).out.push(message)
        }
      } else {
        gui.appendLogMessage('add-contact needs --alias parameter')
      }
    },
    options: [
      {
        name: 'alias',
        abbr: 'a'
      },
      {
        name: 'invitation',
        abbr: 'i'
      }
    ]
  }
]

const initRelayClient = async (invitation) => {
  const { relay } = contact.invitationTransform(invitation)
  const relayClient = getRelayClient(relay.toString('hex'))
  await relayClient.init()
  return relayClient
}

const sendInvitation = async (invitation, inbox, relayClient) => {
  const { rootAddress, pk } = contact.invitationTransform(invitation)
  const message = {
    timestamp: Buffer.from(Date.now().toString()),
    address: contact.subaddress(rootAddress, 0),
    payload: Buffer.from(inbox),
    pk
  }
  await relayClient.send(message, { invitation: true })
  return message
}

const initInboxRelay = async (inbox, alias) => {
  const inboxRelay = await initRelayClient(inbox)
  await inboxRelay.ready()
  inboxRelay.watch(contact.invitationTransform(inbox).rootAddress, 0, alias)
  inboxRelay.on('message', async m => {
    if (m.alias === alias) { // TODO covert to static method, see index:39
      const decodedMessage = decode(query, m.value)
      if (getState().messages.get(alias).in.length === 0 && !(await getConfig()).contacts.find(c => c.alias === alias).outbox) {
        const config = await getConfig()
        const masterkey = Buffer.from(config.masterkey, 'hex')
        const masterKeyIndex = config.contacts.map(c => c.alias).indexOf(alias)
        const { keyPair } = await contact.contact(masterkey, masterKeyIndex)
        config.contacts.find(c => c.alias === alias).outbox = crypto.decrypt(decodedMessage.payload, keyPair.pk, keyPair.sk).toString()
        await setConfig(config)
      }
      getState().messages.get(alias).in.push(decodedMessage)
      // TODO if checking different chat, add * to contact
    }
  })
}

module.exports = (command) => {
  const match = subcommand(commands)
  const matched = match(command)
  if (!matched) {
    gui.appendLogMessage('help')
  }
}
