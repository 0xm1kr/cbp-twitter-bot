import * as Twitter from 'twitter'
import * as Sentiment from 'sentiment'
import * as chalk from 'chalk'
import { logInfo, logDetail } from '../utils/log'

export type TwitterParams = {
    action: string
    param?: string
}

export type TwitterServiceParams = {
    auth: {
        consumer_key: string
        consumer_secret: string
        access_token_key: string
        access_token_secret: string
    }
}

export class TwitterService {
    
    protected client!: Twitter
    protected sentiment: Sentiment
    protected connected: boolean

    constructor(params: TwitterServiceParams) {
        this.client = new Twitter(params.auth)
        this.sentiment = new Sentiment()
    }

    /**
     * get a tweets sentiment
     * 
     * @param tweet 
     */
    protected getSentiment(tweet: string): number {
        const result = this.sentiment.analyze(tweet)
        return (result.score / 10)
    }

    /**
     * stream tweets  
     * based on a filter
     * 
     * @param track 
     */
    public async stream(track: string, handler: (event: any) => void): Promise<void> {
        await new Promise((res, rej) => {
            const stream = this.client.stream('statuses/filter', { track })
            stream.on('data', handler)
            stream.on('error', (error) => {
                rej(error)
            })
        })
    }

    /**
     * stream tweet sentiment
     * 
     * @param track 
     */
    public async streamSentiment(track: string): Promise<void> {
        await this.stream(track, (event) => {
            const sentiment = this.getSentiment(event.text) * event.user.followers_count
            const color = sentiment >= 0 ? chalk.green : chalk.red
            logInfo(color(`@${event.user.name}, sentiment ${sentiment}:`))
            logDetail(event.text)
            logInfo('')
        })
    }
}
