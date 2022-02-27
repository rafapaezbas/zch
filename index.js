const command = require('./lib/command')
const { getConfig, setConfig } = require('./lib/config')
const { invitationTransform, contact, subaddress } = require('./lib/contact')
const { query } = require('./lib/messages')
const crypto = require('./lib/crypto')
const gui = require('./lib/gui')
const { decode } = require('compact-encoding')
const { loadDB } = require('./lib/db')
const { getState, getRelayClient } = require('./lib/state')

console.log = gui.appendLogMessage // TODO debug only

const start = async () => {
  // Load configuration and render contacts
  const config = await getConfig()
  const db = await loadDB()

  if (config.contacts) {
    config.contacts.filter(c => c.active).forEach(c => {
      gui.addContact(c.alias)
    })

    // Create relay clients
    config.contacts.forEach(async c => {
      const initRelayClient = async (invitation) => {
        const { relay } = invitationTransform(invitation)
        const relayClient = getRelayClient(relay.toString('hex'))
        await relayClient.init()
        return relayClient
      }
      getState().messages.set(c.alias, { in: [], out: [] })

      // Get inbox messages
      const inbox = await initRelayClient(c.inbox)
      await inbox.ready()
      getState().messages.get(c.alias).in = await getMessages(inbox, c.inbox)
      const { rootAddress } = invitationTransform(c.inbox)
      inbox.watch(rootAddress, getState().messages.get(c.alias).in.length, c.alias)
      inbox.on('message',async m => { // TODO transform in relay-client static method
        if (m.alias === c.alias) {
          const decodedMessage = decode(query,m.value)
          if(getState().messages.get(c.alias).in.length === 0 && !c.outbox){
            c.outbox = decodedMessage.payload
            await setConfig(config)
          }
          getState().messages.get(c.alias).in.push(decodedMessage)
          // TODO if checking different chat, add * to contact
        }
      })

      // Get outbox messages
      if (c.outbox) { // inbox is always there, but outbox might not be there yet
        const outbox = await initRelayClient(c.outbox)
        await outbox.ready()
        const range = (key) => ({ gt: key, lt: key + '~' })
        console.log('searching messages...')
        for await (const message of db.createReadStream(range(c.alias))) {
          getState().messages.get(c.alias).out.push({ timestamp: message.key.toString().split('!')[1], payload: message.value })
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
      const currentContact = (await getConfig()).contacts[gui.getSelectedContactIndex()]
      const messagesNum = getState().messages.get(currentContact.alias).out.length
      const { rootAddress, pk, relay } = invitationTransform(currentContact.outbox)
      const { signKeyPair } = await contact(Buffer.from(config.masterkey, 'hex'), gui.getSelectedContactIndex())
      const message = {
        timestamp: Buffer.from(Date.now().toString()),
        address: subaddress(rootAddress, messagesNum),
        payload: Buffer.from(data),
        pk,
        prev: undefined, // TODO add prev signature
        signSk: signKeyPair.sk
      }
      getState().relayClients.get(relay.toString('hex')).send(message)
      getState().messages.get(currentContact.alias).out.push(message)
      await db.put(currentContact.alias + '!' + message.timestamp, data)
      gui.appendChatMessage(new Date(parseInt(message.timestamp.toString())).toISOString(), 'user', data)
    }
  })
}

const getMessages = async (relayClient, invitation) => {
  const { rootAddress } = invitationTransform(invitation)
  const messages = []
  for (let i = 0; true; i++) {
    const message = await relayClient.db.get(Buffer.from(subaddress(rootAddress, i)))
    if (!message || !message.value) break

    try {
      messages.push(decode(query, message.value))
    } catch (err) {
      console.log(err)
    }
  }
  console.log(messages)
  return messages
}

gui.guiEmitter.on('contact-gui-update', async (contactIndex) => {
  const config = await getConfig()
  const alias = config.contacts.filter(c => c.active)[contactIndex].alias
  const getDecryptedInbox = async (inbox) => {
    console.log(inbox.length)
    const masterkey = Buffer.from(config.masterkey, 'hex')
    const masterKeyIndex = config.contacts.map(c => c.alias).indexOf(alias)
    const { keyPair } = await contact(masterkey, masterKeyIndex)
    return inbox.map(m => ({ ...m, payload: crypto.decrypt(m.payload, keyPair.pk, keyPair.sk) }))
  }
  const inbox = await getDecryptedInbox(getState().messages.get(alias).in)
  const outbox = getState().messages.get(alias).out // already decrypted
  gui.renderChat(alias, outbox, inbox)
})

start()
gui.logo()
