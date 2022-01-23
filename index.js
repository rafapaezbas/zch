const gui = require('./lib/gui')
const command = require('./lib/command')
const configuration = require('./lib/config')

// TODO remove lorem ipsum
// TODO add date format
gui.appendChatMessage(new Date().toISOString(), 'userA', 'In id erat non orci commodo lobortis.  ')
gui.appendChatMessage(new Date().toISOString(), 'userB', 'Donec vitae dolor.  ')
gui.appendChatMessage(new Date().toISOString(), 'userA', 'Etiam laoreet quam sed arcu.  ')
gui.appendChatMessage(new Date().toISOString(), 'userB', 'Proin quam nisl, tincidunt et, mattis eget, convallis nec, purus.  ')
gui.appendChatMessage(new Date().toISOString(), 'userA', 'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.  ')

const start = async () => {
  (await configuration.loadConfig()).contacts.filter(c => c.active).forEach(c => {
    gui.addContact(c.alias)
  })

  gui.textarea.on('submit', (data) => {
    const isCommand = data[0] === '\\'
    if (isCommand) {
      command(data.substring(1).split(' '))
    } else {
      // sendMessageToRelay
    }
  })
}

start()

module.exports = {
  start
}
