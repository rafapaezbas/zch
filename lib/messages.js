const c = require('compact-encoding')
const { compile, constant } = require('compact-encoding-struct')

const messageTypeOffset = 3

const types = {
  HANDSHAKE: 0,
  QUERY: 1,
  ACK: 2
}

const handshake = compile({
  type: constant(c.uint8, types.HANDSHAKE),
  pk: c.buffer,
  core: c.buffer
})

const query = compile({
  type: constant(c.uint8, types.QUERY),
  timestamp: c.buffer,
  payload: c.buffer,
  signature: c.buffer,
  prev: c.buffer
})

const ack = compile({
  type: constant(c.uint8, types.ACK),
  timestamp: c.buffer,
  signature: c.buffer
})

module.exports = {
  messageTypeOffset,
  types,
  handshake,
  query,
  ack
}
