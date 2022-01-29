const c = require('compact-encoding')
const { compile, constant } = require('compact-encoding-struct')

const handshake = compile({
  type: constant(c.uint, 0),
  pk: c.buffer, // signature pk
  core: c.buffer // hypercore
})

module.exports = {
  handshake
}
