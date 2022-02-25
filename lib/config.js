const path = require('path')
const os = require('os')
const crypto = require('./crypto')

const configFolder = path.join(os.homedir(), '.zch')
const relayConfigFolder = path.join(os.homedir(), '.zch', 'relay')
const dbStorage = path.join(os.homedir(), '.zch', 'db')

const defaultConfig = {
  masterkey: crypto.generateMasterkey().toString('hex'),
  relay: 'dd261c8dcf49ebd5cd33410781bbf9a2e23b4aa05748c821d253c82d1fe97b09',
  relayConfigFolder,
  dbStorage,
  contacts: []
}
const { loadConfig, saveConfig } = require('simple-config')(configFolder, defaultConfig)

module.exports = {
  loadConfig,
  saveConfig
}
