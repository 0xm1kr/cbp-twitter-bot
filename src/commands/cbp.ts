import { log, logError, logDetail } from '../utils/log'
import { CBPService, CBPParams } from '../services/CBP'

import * as yargs from 'yargs' // eslint-disable-line no-unused-vars

/**
 * The Hello CLI command name
 */
export const command = [ 'cbp <action> [product]' ]

/**
 * The Hello CLI command description
 */
export const desc = `Coinbase Pro related commands`

/**
 * CBP Command Builder
 */
export const builder: { [key: string]: yargs.Options } = {
    action: { type: 'string', required: true, description: 'CBP action: <viewBalances, viewBook, watchTicker, watchBook>' },
    product: { type: 'string', required: false, description: 'Pass in a product for this action' }
}

/**
 * CBP Command Handler
 * @param param0 
 */
export async function handler({ action, product }: CBPParams): Promise<void> {

    // get some env vars
    const {
        CBP_KEY,
        CBP_SECRET,
        CBP_PASSPHRASE
    } = process.env
    
    // init service
    const cbpService = new CBPService({
        auth: {
            apiKey: CBP_KEY,
            apiSecret: CBP_SECRET,
            passphrase: CBP_PASSPHRASE,
            useSandbox: false
        }
    })

    try {
        await cbpService[action](product)
    } catch (error) {
        logError(`:x: action failed! ${action}`)
        logDetail(error.message)
        log('')
    }
    
}