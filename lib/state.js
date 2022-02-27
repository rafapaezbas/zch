const RelayClient = require('./relay-client')
const Corestore = require('corestore')
const ram = require('random-access-memory') // TODO remove

const store = new Corestore(ram)

const state = {
  relayClients: new Map(),
  messages: new Map()
}

const getState = () => state

const getRelayClient = (relay) => {
  if (state.relayClients.has(relay)) return state.relayClients.get(relay)
  const relayClient = new RelayClient(Buffer.from(relay, 'hex'), store)
  state.relayClients.set(relay, relayClient)
  return relayClient
}

module.exports = {
  getState,
  getRelayClient
}
