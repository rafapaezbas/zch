const gui = require('./gui')
const { getConfig, setConfig } = require('./config')
const contact = require('./contact')
const subcommand = require('subcommand')
const { getState, getRelayClient } = require('./state')
const { loadDB } = require('../lib/db')

const commands = [
  {
    name: 'add-contact',
    command: async (args) => {
      // TODO add watch
      if (args.alias) { // TODO check if alias already used
        const config = await getConfig()
        const db = await loadDB()
        const masterkey = Buffer.from(config.masterkey, 'hex')
        const inbox = contact.invitation(await contact.contact(masterkey, config.contacts.length))
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

module.exports = (command) => {
  const match = subcommand(commands)
  const matched = match(command)
  if (!matched) {
    gui.appendLogMessage('help')
  }
}
