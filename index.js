const command = require('./lib/command')
const { loadConfig, saveConfig } = require('./lib/config')
const { invitationTransform, contact, subaddress } = require('./lib/contact')
const { query } = require('./lib/messages')
const crypto = require('./lib/crypto')
const RelayClient = require('./lib/relay-client')
const Corestore = require('corestore')
const ram = require('random-access-memory') // TODO remove
const gui = require('./lib/gui')
const c = require('compact-encoding')
const loadDB = require('./lib/db')

const store = new Corestore(ram)
const relayClients = new Map()
const messages = new Map()

console.log = gui.appendLogMessage //TODO debug only

const start = async () => {
  // Load configuration and render contacts
  const config = await loadConfig()
  const db = loadDB(config.dbStorage)
  if (config.contacts) {
    config.contacts.filter(c => c.active).forEach(c => {
      gui.addContact(c.alias)
    })

    // Create relay clients
    config.contacts.forEach(async c => {
      const initRelayClient = async (invitation) => {
        const { rootAddress, pk, signPk, relay } = invitationTransform(invitation)
        const relayClient = getRelayClient(relay.toString('hex'))
        await relayClient.init()
        return relayClient
      }
      messages.set(c.alias, { in: [], out: [] })
      const inbox = await initRelayClient(c.inbox)
      await inbox.ready()
      messages.get(c.alias).in = await getMessages(inbox, c.inbox)
      inbox.on('message', console.log) // TODO
      if (c.outbox) { // inbox is always there, but outbox might not be there yet
        const outbox = await initRelayClient(c.outbox)
        await outbox.ready()
        const range = (key) => ({ gt: key, lt: key + '~' })
        console.log("searching messages...")
        for await (message of db.createReadStream(range(c.alias))){
          messages.get(c.alias).out.push({ timestamp:message.key.toString().split('!')[1] , payload: message.value }) // TODO add timestamp
        }
      }
    })
  }

  // Setup gui textarea command input
  gui.textarea.on('submit', async (data) => {
    const isCommand = data[0] === '\\'
    if (isCommand) {
      command(data.substring(1).split(' '))
    } else {
      const currentContact = config.contacts[gui.getSelectedContactIndex()]
      const messagesNum = messages.get(currentContact.alias).out.length
      const { rootAddress, pk, signPk, relay } = invitationTransform(currentContact.outbox)
      const { signKeyPair } = await contact(Buffer.from(config.masterkey, 'hex'), gui.getSelectedContactIndex())
      const message = { timestamp: Buffer.from(Date.now().toString()),
                        address: subaddress(rootAddress, messagesNum),
                        payload: Buffer.from(data),
                        pk,
                        prev: undefined, // TODO add prev signature
                        signSk: signKeyPair.sk
                      }
      relayClients.get(relay.toString('hex')).send(message)
      messages.get(currentContact.alias).out.push(message) // TODO store in levelDB and append to chat
      await db.put(currentContact.alias + '!' + message.timestamp, data)
      gui.appendChatMessage(new Date(parseInt(message.timestamp.toString())).toISOString(), 'user', data)
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

    try{
      messages.push(c.decode(query, message.value))
    }catch(err){
      console.log(err)
    }

  }
  console.log(messages)
  return messages
}

gui.guiEmitter.on('contact-gui-update', async (contactIndex) => {
  const config = await loadConfig()
  const alias = config.contacts.filter(c => c.active)[contactIndex].alias
  const getDecryptedInbox = async (inbox) => {
    const masterkey = Buffer.from(config.masterkey, 'hex')
    const masterKeyIndex = config.contacts.map(c => c.alias).indexOf(alias)
    const { keyPair } = await contact(masterkey, masterKeyIndex)
    return inbox.map(m => ({...m, payload: crypto.decrypt(m.payload, keyPair.pk, keyPair.sk)}))
  }
  const inbox = await getDecryptedInbox(messages.get(alias).in)
  const outbox =  messages.get(alias).out // already decrypted
  gui.renderChat(alias, outbox, inbox)
})

start()
gui.logo()
