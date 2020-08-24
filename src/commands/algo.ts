import * as yargs from 'yargs' // eslint-disable-line no-unused-vars
import { TwitterMovingAverageAlgorithm, AlgorithmParams } from '../algorithms/TwitterMovingAverage'
import { log, logError, logDetail } from '../utils/log'
/**
 * The command name
 */
export const command = 'run [product] [keyword]'

/**
 * The command description
 */
export const desc = `Run the trading algorithm`

/**
 * Command builder
 */
export const builder: { [key: string]: yargs.Options } = {
    product: { type: 'string', required: true, description: 'Product to trade' },
    keyword: { type: 'string', required: true, description: 'Twitter keyword to track' },
}

/**
 * Command handler
 * @param params 
 */
export async function handler({ product, keyword }: AlgorithmParams): Promise<void> {

    // init algo
    const tMAA = new TwitterMovingAverageAlgorithm({
        period: 1 * 1000 // 1 second for testing
    })

    try {
        await tMAA.run(product, keyword)
    } catch (error) {
        logError(`:x: action failed! ${product} ${keyword}`)
        logDetail(error.stack)
        log('')
    }
    
}