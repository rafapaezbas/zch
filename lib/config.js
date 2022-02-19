const path = require('path')
const os = require('os')
const fs = require('fs')
const crypto = require('./crypto')

const configFolder = path.join(os.homedir(), '.zch')
const relayConfigFolder = path.join(os.homedir(), '.zch', 'relay')

const loadConfig = async () => {
  if (!fs.existsSync(configFolder)) {
    const defaultConfig = { masterkey: crypto.generateMasterkey().toString('hex'), relay: 'd4da8228d79358da2cff782daddb4cd40ee4d5fb1186e4e07a19623ab618a145', contacts: [] }
    fs.mkdirSync(configFolder)
    saveConfig(defaultConfig)
    return defaultConfig
  } else {
    try {
      const configFile = path.join(configFolder, 'config.json')
      return JSON.parse((await fs.promises.readFile(configFile)).toString())
    } catch (err) {
      return {}
    }
  }
}

const saveConfig = async (obj) => {
  const configFile = path.join(configFolder, 'config.json')
  return await fs.promises.writeFile(configFile, JSON.stringify(obj))
}

module.exports = {
  loadConfig,
  saveConfig,
  configFolder,
  relayConfigFolder
}
