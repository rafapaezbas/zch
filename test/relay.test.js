const { once } = require('events')
const test = require('brittle')
const Relay = require('../lib/relay')
const RelayClient = require('../lib/relay-client')
const { types, messageTypeOffset, query, ack } = require('../lib/messages')
const c = require('compact-encoding')
const ram = require('random-access-memory')
const Corestore = require('corestore')
const contact = require('../lib/contact')
const crypto = require('../lib/crypto')

test('relay answers with handshake to connection', async ({ is, plan, teardown }) => {
  plan(4)

  const store = new Corestore(ram)
  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey, store)

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
    await relayClient.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()

  relayClient.on('data', data => {
    is(data[messageTypeOffset], types.HANDSHAKE)
    is(relayClient.handshake.pk.toString(), relay.signatureKeys.pk.toString())
    is(relayClient.handshake.core.toString(), relay.core.key.toString())
    is(relayClient.session.state.name, 'idle')
  })
})

test('relay client can send message', async ({ is, not, plan, ok, teardown }) => {
  plan(6)

  const store = new Corestore(ram)
  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey, store)
  const message = Buffer.from('random message')
  const address = Buffer.allocUnsafe(32).toString()
  const pk = Buffer.allocUnsafe(32, 'hex')
  const signSk = Buffer.allocUnsafe(64, 'hex')

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
    await relayClient.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message, pk, undefined, signSk)

  relay.on('data', data => {
    const data_ = c.decode(query, data)
    is(data[messageTypeOffset], types.QUERY)
    not(data_.signature, undefined)
    not(data_.prev, undefined)
    not(data_.timestamp, undefined)
    ok(parseInt(data_.timestamp) > 0)
    is(relayClient.session.state.name, 'waiting_ack')
  })
})

test('relay returns ack for well-formed message', async ({ is, not, plan, ok, teardown }) => {
  plan(3)

  const store = new Corestore(ram)
  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey, store)
  const message = Buffer.from('random message')
  const address = Buffer.allocUnsafe(32).toString()
  const pk = Buffer.allocUnsafe(32, 'hex')
  const signSk = Buffer.allocUnsafe(64, 'hex')

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
    await relayClient.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message, pk, undefined, signSk)
  is(relayClient.session.state.name, 'waiting_ack')
  await once(relay, 'data') // message received by relay
  relayClient.on('data', data => {
    const ack_ = c.decode(ack, data)
    not(ack_.signature, undefined)
    is(relayClient.session.state.name, 'idle')
  })
})

test('Query is persisted', async ({ is, not, plan, ok, teardown }) => {
  plan(3)

  const store = new Corestore(ram)
  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey, store)
  const message = Buffer.from('random message')
  const address = Buffer.allocUnsafe(32)
  const pk = Buffer.allocUnsafe(32, 'hex')
  const signSk = Buffer.allocUnsafe(64, 'hex')

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
    await relayClient.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message, pk, undefined, signSk)
  await once(relay, 'data') // message received by relay
  await once(relayClient, 'data') // acknowledge received
  const persistedQueryRelay = await relay.db.get(Buffer.from(address))

  not(persistedQueryRelay, null)
  is(persistedQueryRelay.key.toString(), address.toString())
  not(persistedQueryRelay.value, undefined)
})

test('Shouldnt write twice in same address', async ({ is, not, plan, ok, teardown }) => {
  plan(3)

  const store = new Corestore(ram)
  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey, store)
  const message = Buffer.from('random message')
  const message2 = Buffer.allocUnsafe(32)
  const address = Buffer.allocUnsafe(32)
  const pk = Buffer.allocUnsafe(32, 'hex')
  const signSk = Buffer.allocUnsafe(64, 'hex')

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
    await relayClient.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message, pk, undefined, signSk)
  await once(relay, 'data') // message received by relay
  await once(relayClient, 'data') // acknowledge received
  await relayClient.send(address, message2, pk, undefined, signSk)
  await once(relay, 'data') // message received by relay
  await once(relayClient, 'data') // acknowledge received

  const persistedQueryRelay = await relay.db.get(Buffer.from(address))
  not(persistedQueryRelay, null)
  is(persistedQueryRelay.key.toString(), address.toString())
  not(persistedQueryRelay.value.toString(), undefined)
})

test('Relay client encrypts with invitation pk and signs message with contact sk', async ({ is, not, plan, ok, teardown }) => {
  plan(2)

  const masterkey1 = crypto.generateMasterkey()
  const masterkey2 = crypto.generateMasterkey()
  const contact1 = await contact.contact(masterkey1, 0)
  const contact2 = await contact.contact(masterkey2, 0)
  const invitation1 = contact.invitation(contact1)
  const invitation2 = contact.invitation(contact2)

  const store = new Corestore(ram)
  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey, store)
  const message = Buffer.from('Hello world!')
  const address = contact.subaddress(contact.invitationTransform(invitation1).rootAddress, 0)
  const pk = contact.invitationTransform(invitation1).pk
  const signSk = contact2.signKeyPair.sk

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
    await relayClient.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message, pk, undefined, signSk)
  await once(relay, 'data') // message received by relay
  await once(relayClient, 'data') // acknowledge received

  const result = c.decode(query, (await relay.db.get(Buffer.from(address))).value)

  is(Buffer.compare(message, crypto.decrypt(result.payload, contact1.keyPair.pk, contact1.keyPair.sk)), 0)
  ok(crypto.verify(result.signature, message, contact.invitationTransform(invitation2).signPk))
})
