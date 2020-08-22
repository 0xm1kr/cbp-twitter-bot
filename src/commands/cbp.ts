import { logInfo, logError } from '../utils/log'
import { CBPService, CBPParams } from '../services/CBP'

import * as yargs from 'yargs' // eslint-disable-line no-unused-vars

/**
 * The Hello CLI command name
 */
export const command = 'cbp'

/**
 * The Hello CLI command description
 */
export const desc = `Coinbase Pro related commands`

/**
 * CBP Command Builder
 */
export const builder: { [key: string]: yargs.Options } = {
    type: { type: 'string', required: false, description: 'type of CBP action: [listAccounts]' }
}

/**
 * CBP Command Handler
 * @param param0 
 */
export async function handler({ type }: CBPParams): Promise<void> {

    // get some env vars
    const {
        CBP_KEY,
        CBP_SECRET,
        CBP_PASSPHRASE
    } = process.env
    
    const cbpService = new CBPService({
        auth: {
            apiKey: CBP_KEY,
            apiSecret: CBP_SECRET,
            passphrase: CBP_PASSPHRASE,
            useSandbox: true
        }
    })

    try {
        const result = await cbpService[type]()
        logInfo(JSON.stringify(result, null, 2))
    } catch (error) {
        logError(error.stack)
    }
    
}