#!/usr/bin/env node
process.title = 'zch'

const Relay = require('../lib/relay')
const subcommand = require('subcommand')
const { getConfig } = require('../lib/config')
const crypto = require('crypto')

const help = 'To be implemented' // TODO implement

const commands = [
  {
    name: 'start-relay',
    command: async (args) => {
      const seed = args.seed ? Buffer.from(crypto.createHash('sha256').update(args.seed).digest()) : undefined
      const relay = new Relay({ storage: (await getConfig()).relayConfigFolder, keyPairSeed: Buffer.from(seed) })
      relay.on('open', (pk) => {
        console.log('Relay listening on:', pk.toString('hex'))
      })
      await relay.init()
    },
    options: [
      {
        name: 'seed',
        abbr: 's'
      }
    ]
  }
]

const args = process.argv.slice(2)
const match = subcommand(commands)
const matched = match(args)
if (!matched) {
  console.log(help)
  process.exit(0)
}
