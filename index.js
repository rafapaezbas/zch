const command = require('./lib/command')
const configuration = require('./lib/config')
const { invitationTransform, contact, subaddress } = require('./lib/contact')
const RelayClient = require('./lib/relay-client')
const Corestore = require('corestore')
const ram = require('random-access-memory') // TODO remove
const gui = require('./lib/gui')

const store = new Corestore(ram)
const relayClients = new Map()
const messages = new Map()

console.log = gui.appendLogMessage //TODO debug only

const start = async () => {
  // Load configuration and render contacts
  const config = await configuration.loadConfig()
  if (config.contacts) {
    config.contacts.filter(c => c.active).forEach(c => {
      gui.addContact(c.alias)
    })

    // Create relay clients for local invitations
    config.contacts.forEach(async c => {
      const initRelayClient = async (invitation) => {
        const { rootAddress, pk, signPk, relay } = invitationTransform(invitation)
        const relayClient = getRelayClient(relay.toString('hex'))
        await relayClient.init()
        return relayClient
      }
      messages.set(c.alias, { local: [], remote: [] })
      const local = await initRelayClient(c.localInvitation)
      await local.ready()
      messages.get(c.alias).local = await getMessages(local, c.localInvitation)
      local.on('message', console.log) // TODO
      if (c.remoteInvitation) { // local invitation is always there, but remote might not be there yet
        const remote = await initRelayClient(c.remoteInvitation)
        await remote.ready()
        messages.get(c.alias).remote = await getMessages(local, c.remoteInvitation)
        remote.on('message', console.log) // TODO
      }
    })
  }

  // Setup gui textarea command input
  gui.textarea.on('submit', async (data) => {
    const isCommand = data[0] === '\\'
    if (isCommand) {
      command(data.substring(1).split(' '))
    } else {
      const { rootAddress, pk, signPk, relay } = invitationTransform(config.contacts[gui.getSelectedContactIndex()].remoteInvitation)
      const { signKeyPair } = await contact(Buffer.from((await configuration.loadConfig()).masterkey, 'hex'), gui.getSelectedContactIndex())
      relayClients.get(relay.toString('hex')).send(subaddress(rootAddress, 0), Buffer.from(data), pk, undefined, signKeyPair.sk)
    }
  })
}

const getRelayClient = (relay) => {
  if (relayClients.has(relay)) return relayClients.get(relay)
  const relayClient = new RelayClient(Buffer.from(relay, 'hex'), store)
  relayClients.set(relay, relayClient)
  return relayClient
}

const getMessages = async (relayClient, invitation) => {
  const { rootAddress } = invitationTransform(invitation)
  const messages = []
  for (var i = 0; true; i++) {
    const message = await relayClient.db.get(Buffer.from(subaddress(rootAddress, i)))
    if (!message || !message.value) break
    else messages.push(message)
  }
  return messages
}

start()

module.exports = {
  start,
  getRelayClient
}
