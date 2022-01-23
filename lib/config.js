const path = require('path')
const os = require('os')
const fs = require('fs')

const configFolder = path.join(os.homedir(), '.zch')

const loadConfig = async () => {
  if (!fs.existsSync(configFolder)) {
    const defaultConfig = { contacts: [] }
    fs.mkdirSync(configFolder)
    saveConfig(defaultConfig)
    return defaultConfig
  } else {
    try {
      const configFile = path.join(configFolder, 'config.json')
      return JSON.parse(fs.readFileSync(configFile))
    } catch (err) {
      return {}
    }
  }
}

const saveConfig = async (obj) => {
  const configFile = path.join(configFolder, 'config.json')
  return fs.writeFileSync(configFile, JSON.stringify(obj))
}

module.exports = {
  loadConfig,
  saveConfig
}
