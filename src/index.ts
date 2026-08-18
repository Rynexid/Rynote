import { Manager } from './manager.js'
import { ConfigDataService } from './services/ConfigDataService.js'

const configData = new ConfigDataService().data
const rynote = new Manager(configData, configData.utilities.MESSAGE_CONTENT.enable)
// Anti crash handling
process
  .on('unhandledRejection', (error) => rynote.logger.unhandled('AntiCrash', error))
  .on('uncaughtException', (error) => rynote.logger.unhandled('AntiCrash', error))
  .on('uncaughtExceptionMonitor', (error) => rynote.logger.unhandled('AntiCrash', error))
  .on('exit', () =>
    rynote.logger.info('ClientManager', `Successfully Powered Off Rynote, Good Bye!`)
  )
  .on('SIGINT', () => {
    rynote.logger.info('ClientManager', `Powering Down Rynote...`)
    process.exit(0)
  })
rynote.start()
