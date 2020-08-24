import * as yargs from 'yargs' // eslint-disable-line no-unused-vars
import { MovingAverageAlgorithm, AlgorithmParams } from '../algorithms/MovingAverage'
import { log, logError, logDetail } from '../utils/log'
/**
 * The command name
 */
export const command = [ 'algo <product> <track>' ]

/**
 * The command description
 */
export const desc = `Algorithm related commands`

/**
 * Command builder
 */
export const builder: { [key: string]: yargs.Options } = {
    product: { type: 'string', required: true, description: 'Product to perform algorithm on' },
    track: { type: 'string', required: false, description: 'Twitter keyword to track' },
}

/**
 * Command handler
 * @param params 
 */
export async function handler({ product, track }: AlgorithmParams): Promise<void> {

    // init service
    const mAA = new MovingAverageAlgorithm()

    try {
        await mAA.run(product, track)
    } catch (error) {
        logError(`:x: action failed! ${product} ${track}`)
        logDetail(error.stack)
        log('')
    }
    
}