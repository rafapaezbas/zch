const path = require('path')
const os = require('os')
const crypto = require('./crypto')

const configFolder = path.join(os.homedir(), '.zch')
const relayConfigFolder = path.join(os.homedir(), '.zch', 'relay')
const defaultConfig = { masterkey: crypto.generateMasterkey().toString('hex'), relay: 'd4da8228d79358da2cff782daddb4cd40ee4d5fb1186e4e07a19623ab618a145', relayConfigFolder, contacts: [] }
const { loadConfig, saveConfig } = require('simple-config')(configFolder, defaultConfig)

module.exports = {
  loadConfig,
  saveConfig
}
