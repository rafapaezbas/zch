#!/usr/bin/env node
process.title = 'zch'

const Relay = require('../lib/relay')
const subcommand = require('subcommand')

const help = 'To be implemented' // TODO implement

const commands = [
  {
    name: 'start-relay',
    command: async (args) => {
      const relay = new Relay()
      relay.on('open', (pk) => {
        console.log('Relay listening on:', pk.toString('hex'))
      })
      await relay.init()
    }
  }
]

const args = process.argv.slice(2)
const match = subcommand(commands)
const matched = match(args)
if (!matched) {
  console.log(help)
  process.exit(0)
}
