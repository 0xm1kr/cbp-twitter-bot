import { sma, ema } from 'moving-averages'
import { WebSocketChannelName, OrderSide } from 'coinbase-pro-node'
import { TwitterService } from '../services/Twitter'
import { CBPService } from '../services/CBP'
import { logInfo, logFile } from '../utils/log'
import bn from 'big.js'
import * as chalk from 'chalk'

// 
// use moving averages (momentum) of
// Twitter and an ema 12/26 to trade 
// the market.
//

export type AlgorithmParams = {
    product: string
    keyword: string
}

// env vars
const {
    ENVIRONMENT,
    TWITTER_KEY,
    TWITTER_SECRET,
    TWITTER_TOKEN_KEY,
    TWITTER_TOKEN_SECRET,
    CBP_KEY,
    CBP_SECRET,
    CBP_PASSPHRASE
} = process.env

export class TwitterMovingAverageAlgorithm {

    // moving average config
    private period!: number

    private ts: TwitterService
    private twitterPeriods = []
    private twitterSMA = []
    private cbp: CBPService
    private pricePeriods = []
    private ema12 = []
    private ema26 = []

    constructor(config: { 
        period: number
    } = {
        // defaults to 1 min
        period: 60 * 1000
    }) {
        this.period = config.period
        
        // init CBPService
        this.cbp = new CBPService({
            auth: {
                apiKey: CBP_KEY,
                apiSecret: CBP_SECRET,
                passphrase: CBP_PASSPHRASE,
                useSandbox: (ENVIRONMENT === 'DEV') ? true : false
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
     * calculate moving average
     * 
     * @param start     start time in ms
     * @param productId product id e.g. BTC-USD
     * @param track     track twitter e.g. "#bitcoin"
     */
    private async calcMovingAverage(start: number, productId: string, track: string): Promise<void> {
        // subscribe to twitter
        let sentimentArr = []
        this.ts.stream(track, (event) => {
            const sentiment = this.ts.getSentiment(event.text) * event.user.followers_count
            sentimentArr.push(sentiment)
        })

        // subscribe to trades
        let priceArr = []
        this.cbp.subscribe([{
            name: WebSocketChannelName.TICKER,
            product_ids: [productId],
        }], {
            ticker: (message) => priceArr.push(Number(message.price))
        })
        
        // --- calculate moving averages ---

        setInterval(() => {
            // calculate periods
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
            if (tPeriods >= 26) {
                this.twitterSMA = sma(this.twitterPeriods, 12)
                this.ema12 = ema(this.pricePeriods, 12)
                this.ema26 = ema(this.pricePeriods, 26)
                // logInfo('twitter sma:')
                // logDetail(JSON.stringify(this.twitterSMA))
                // logInfo('price ema:')
                // logDetail(JSON.stringify(this.ema26))
            }
        }, this.period)
    }

    /**
     * run the algo
     * 
     * @param productId 
     * @param track 
     */
    async run(productId: string, track: string): Promise<void> {
        const start = new Date().getTime()
        logInfo(chalk.white(`Twitter Moving Average Algo: ${new Date(start).toISOString()}`))

        // calculate moving averages
        this.calcMovingAverage(start, productId, track)

        // sync book
        this.cbp.syncBook(productId)

        // trading time
        let lastBuy: {
            price: string
            time: number
        } 
        let lastSell: {
            price: string
            time: number
        } 
        setInterval(() => {

            if (this.ema26.length && this.twitterSMA.length) {
                const bestAsk = this.cbp.asks.min()
                const bestBid = this.cbp.bids.max()
                const sLen = this.twitterSMA.length
                const sSlope = this.twitterSMA[sLen-3] - this.twitterSMA[0]
                const ema12 = bn(this.ema12[this.ema12.length-1])
                const ema26 = bn(this.ema26[this.ema26.length-1])
                const ema12Slope = bn(this.ema12[this.ema12.length-1]).minus(bn(this.ema12[this.ema12.length-3]))
                const ema26Slope = bn(this.ema26[this.ema26.length-1]).minus(bn(this.ema26[this.ema26.length-3]))

                logInfo('-------------------------')
                logInfo(chalk.red(`best ask: ${bestAsk}`))
                logInfo(chalk.green(`best bid: ${bestBid}`))
                logInfo(chalk.blue(`sentiment ${sSlope}`))
                logInfo(chalk.white(`ema12 ${ema12}, ${ema12Slope}`))
                logInfo(chalk.white(`ema26 ${ema26}, ${ema26Slope}`))
                logInfo('-------------------------')

                // if the sentiment is trending 
                // negative and the ema12 < ema26 
                // and the price is > last buy+fee
                // == short position (sell)
                if (sSlope < 100 
                    && bn(ema12).lt(ema26)
                    && ema12Slope.lt(0)
                    && ema26Slope.lt(0)
                    && !lastSell
                ) {
                    if (!lastSell && (!lastBuy || bn(lastBuy.price).lt(bestAsk[0]))) {
                        const order = {
                            size: '10',
                            side: OrderSide.SELL,
                            price: bestAsk[0]
                        }
                        logFile(order)
                        // this.cbp.limitOrder(productId, order)
                        lastSell = {
                            price: order.price,
                            time: new Date().getTime()
                        }
                        lastBuy = null
                    }
                }

                // if the sentiment is trending 
                // positive and the ema12 > ema26
                // and the price is < last sell-fee
                // == long position (buy)
                if (sSlope > 100 
                    && bn(ema12).gt(ema26)
                    && ema12Slope.gt(0)
                    && ema26Slope.gt(0)
                    && !lastBuy
                ) {
                    if (!lastBuy && (!lastSell || bn(lastSell.price).gt(bestBid[0]))) {
                        const order = {
                            size: '10',
                            side: OrderSide.BUY,
                            price: bestBid[0]
                        }
                        logFile(order)
                        // this.cbp.limitOrder(productId, order)
                        lastBuy = {
                            price: order.price,
                            time: new Date().getTime()
                        }
                        lastSell = null
                    }
                }
            }
            
        }, 5000)
    }

}