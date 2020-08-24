import { sma } from 'moving-averages'
import { TwitterService } from '../services/Twitter'
import { CBPService } from '../services/CBP'
import { logInfo } from '../utils/log'
import { WebSocketChannelName } from 'coinbase-pro-node'

// 
// use moving averages (momentum)
// of Twitter/Close price to trade 
// a market.
//

export type AlgorithmParams = {
    product: string
    track: string
}

// env vars
const {
    TWITTER_KEY,
    TWITTER_SECRET,
    TWITTER_TOKEN_KEY,
    TWITTER_TOKEN_SECRET,
    CBP_KEY,
    CBP_SECRET,
    CBP_PASSPHRASE
} = process.env

export class MovingAverageAlgorithm {

    // moving average config
    private period = 10 * 1000
    private size = 6

    private ts: TwitterService
    private twitterPeriods = []
    private cbp: CBPService
    private pricePeriods = []

    constructor(config: { 
        period: number, size: number 
    } = {
        period: 15 * 60 * 1000,
        size: 4
    }) {

        this.period = config.period
        this.size = config.size
        
        // init CBPService
        this.cbp = new CBPService({
            auth: {
                apiKey: CBP_KEY,
                apiSecret: CBP_SECRET,
                passphrase: CBP_PASSPHRASE,
                useSandbox: false
            }
        })

        // init TwitterService
        this.ts = new TwitterService({
            auth: {
                consumer_key: TWITTER_KEY,
                consumer_secret: TWITTER_SECRET,
                access_token_key: TWITTER_TOKEN_KEY,
                access_token_secret: TWITTER_TOKEN_SECRET
            }
        })

    }

    /**
     * run the algo
     * 
     * @param productId 
     * @param track 
     */
    async run(productId: string, track: string): Promise<void> {
        const start = new Date().getTime()
        logInfo(`Starting Moving Average Algo: ${new Date(start).toISOString()}`)

        // twitter
        let sentimentArr = []
        this.ts.stream(track, (event) => {
            const sentiment = this.ts.getSentiment(event.text) * event.user.followers_count
            sentimentArr.push(sentiment)
        })

        // trades
        let priceArr = []
        this.cbp.subscribe([{
            name: WebSocketChannelName.TICKER,
            product_ids: [productId],
        }], {
            ticker: (message) => priceArr.push(Number(message.price))
        })

        // calculate periods
        setInterval(() => {
            const tPeriods = Math.round((new Date().getTime() - start) / this.period)
            logInfo(`calculating period: ${tPeriods}`)

            // twitter
            if (sentimentArr.length) {
                this.twitterPeriods.push(
                    (sentimentArr.reduce((sum, s) => {
                        return sum += (s || 0)
                    }) / sentimentArr.length)
                )
                // logInfo('Twitter: ' + JSON.stringify(this.twitterPeriods))
            } else {
                // no change
                this.twitterPeriods.push(0)
            }
            sentimentArr = []

            // prices
            if (priceArr.length) {
                this.pricePeriods.push(
                    (priceArr.reduce((sum, s) => {
                        return sum += (s || 0)
                    }) / priceArr.length)
                )
                // logInfo('Prices: ' + JSON.stringify(this.pricePeriods))
            }
            priceArr = []

            // calculate moving averages
            if ((tPeriods % this.size) === 0) {
                console.log('twitter sma:', sma(this.twitterPeriods, this.size))
                console.log('price sma:', sma(this.pricePeriods, this.size))
            }
            
        }, this.period)

    }

}
