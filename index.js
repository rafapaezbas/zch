const gui = require('./lib/gui')
const command = require('./lib/command')
const configuration = require('./lib/config')
const { invitationTransform, contact } = require('./lib/contact')
const RelayClient = require('./lib/relay-client')
const Corestore = require('corestore')
const ram = require('random-access-memory') // TODO remove

const store = new Corestore(ram)
const relayClients = new Map()

const start = async () => {

  // Load configuration and render contacts
  const config = await configuration.loadConfig()
  if(config.contacts) {
    config.contacts.filter(c => c.active).forEach(c => {
      gui.addContact(c.alias)
    })

    // Create relay clients
    config.contacts.filter(c => c.invitation).forEach(async c => {
      const { rootAddress, pk, signPk, relay }  = invitationTransform(c.invitation)
      const relayClient = newRelayClient(relay)
      await relayClient.init()
    })
  }

  // Setup gui textarea command input
  gui.textarea.on('submit', async (data) => {
    const isCommand = data[0] === '\\'
    if (isCommand) {
      command(data.substring(1).split(' '))
    } else {
      const { rootAddress, pk, signPk, relay } = invitationTransform(config.contacts[gui.getSelectedContactIndex()].invitation)
      const { signKeyPair } = await contact(Buffer.from((await configuration.loadConfig()).masterkey, 'hex'), gui.getSelectedContactIndex())
      relayClients.get(relay.toString('hex')).send(rootAddress, Buffer.from(data), pk, undefined, signKeyPair.sk)
    }
  })
}

const newRelayClient = (relay) =>  {
  const relayClient = new RelayClient(relay, store)
  relayClients.set(relay.toString('hex'), relayClient)
  return relayClient
}

start()

module.exports = {
  start,
  newRelayClient
}
