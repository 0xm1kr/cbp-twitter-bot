import { log, logError, logDetail } from '../utils/log'

import * as yargs from 'yargs' // eslint-disable-line no-unused-vars
import { TwitterService, TwitterParams } from '../services/Twitter'

/**
 * The command name
 */
export const command = [ 'twitter <action> [param]' ]

/**
 * The command description
 */
export const desc = `Twitter related commands`

/**
 * Command builder
 */
export const builder: { [key: string]: yargs.Options } = {
    action: { type: 'string', required: true, description: 'Actions: stream' },
    param: { type: 'string', required: false, description: 'Additional parameter for this action' },
}

/**
 * Command handler
 * @param params 
 */
export async function handler({ action, param }: TwitterParams): Promise<void> {
    // get some env vars
    const {
        TWITTER_KEY,
        TWITTER_SECRET,
        TWITTER_TOKEN_KEY,
        TWITTER_TOKEN_SECRET
    } = process.env
    
    // init service
    const twitterService = new TwitterService({
        auth: {
            consumer_key: TWITTER_KEY,
            consumer_secret: TWITTER_SECRET,
            access_token_key: TWITTER_TOKEN_KEY,
            access_token_secret: TWITTER_TOKEN_SECRET
        }
    })

    try {
        await twitterService[action](param)
    } catch (error) {
        logError(`:x: action failed! ${action}`)
        logDetail(error.stack)
        log('')
    }
    
}