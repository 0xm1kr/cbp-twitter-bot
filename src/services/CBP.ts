import { 
    CoinbasePro, 
    Account,
    WebSocketEvent, 
    WebSocketChannelName, 
    OrderSide,
    WebSocketResponse,
    WebSocketTickerMessage,
    WebSocketChannel,
    WebSocketResponseType,
    OrderBookLevel2,
    OrderBookLevel
} from 'coinbase-pro-node'
import { logInfo } from '../utils/log'
import * as chalk from 'chalk'

//
// The CBPService handles  
// all interactions with  
// the Coinbase Pro API.
// 
// Built on top of:
// [coinbase-pro-node](https://github.com/bennyn/coinbase-pro-node)
//
// API Keys are needed for any secure 
// functionality and can be created here:
// https://pro.coinbase.com/profile/api
// https://public.sandbox.pro.coinbase.com/profile/api
//

export type CBPParams = {
    action: string
    product?: string
}

export type BookSnapshot = {
    type: WebSocketResponseType
    product_id: string
} & OrderBookLevel2

export type BookUpdate = {
    type: WebSocketResponseType
    product_id: string
    // [
    //     "buy|sell",  // buy/sell
    //     "11602.18",  // price level
    //     "0.00000000" // size: size of zero means this price level can be removed
    // ]
    changes: string[][]
}

export type CBPServiceParams = {
    
    auth: {
        apiKey: string
        apiSecret: string
        passphrase: string
        // https://docs.pro.coinbase.com/#sandbox
        useSandbox: boolean
    }
}

export class CBPService {

    protected client!: CoinbasePro
    protected connection: boolean

    constructor(params: CBPServiceParams) {
        this.client = new CoinbasePro(params.auth)
    }

    /**
     * get accounts
     */
    public async getAccounts(): Promise<Account[]> {
        return this.client.rest.account.listAccounts()
    }

    /**
     * getBook
     * 
     * @param product_id 
     */
    public async getBook(productId = 'BTC-USD'): Promise<OrderBookLevel2> {
        return this.client.rest.product.getProductOrderBook(productId, {
            level: OrderBookLevel.TOP_50_BIDS_AND_ASKS
        })
    }

    /**
     * subscribe to websocket channels
     * 
     * @param channels 
     * @param handler 
     */
    public subscribe(
        channels: WebSocketChannel[],
        handlers?: {
            message?: (message: WebSocketResponse) => unknown,
            ticker?: (message: WebSocketTickerMessage) => unknown
        }
    ): void  {
        // on open, subscribe
        this.client.ws.on(WebSocketEvent.ON_OPEN, () => {
            this.client.ws.subscribe(channels)
        })

        // changes to subscriptions
        this.client.ws.on(WebSocketEvent.ON_SUBSCRIPTION_UPDATE, subscriptions => {
            // disconnect if no more subscriptions?
            if (subscriptions.channels.length === 0) {
                this.client.ws.disconnect()
            }
        })

        // message handler
        if (handlers.message) {
            this.client.ws.on(WebSocketEvent.ON_MESSAGE, handlers.message)
        }

        // ticker handler
        if (handlers.ticker) {
            this.client.ws.on(WebSocketEvent.ON_MESSAGE_TICKER, handlers.ticker)
        }

        // connect to WebSocket
        this.client.ws.connect({ 
            // debug: true 
        })
    }

    // ----- intended for CLI output ----- //

    /**
     * list available accounts
     */
    public async viewBalances(): Promise<void> {
        const accounts = await this.getAccounts()
        const info = accounts.map(
            (a: Account) => `${a.currency.replace(',', '')}: ${chalk.green(a.available)}`
        )
        logInfo(`${chalk.white('Available Funds:')}\n----------------\n${info.join('\n')}`)
        logInfo('')
    }

    /**
     * view book
     * 
     * @param product
     */
    public async viewBook(product = 'BTC-USD'): Promise<void> {
        const book = await this.getBook(product)
        logInfo(`${chalk.white(`${product} Order Book:`)}\n-------------------\n${JSON.stringify(book, null, 2)}`)
        logInfo('')
    }

    /**
     * watch ticker
     * 
     * @param product
     */
    public async watchTicker(product = 'BTC-USD'): Promise<void> {
        this.subscribe([{
            name: WebSocketChannelName.TICKER,
            product_ids: [product],
        }], {
            ticker(message) {
                const color = message.side === OrderSide.BUY ? chalk.green : chalk.red
                logInfo(color(`${product}: ${message.side} ${message.last_size} @ ${message.price}`))
                logInfo('')
            }
        })
    }

    /**
     * watch book
     * 
     * @param product
     */
    public async watchBook(product = 'BTC-USD'): Promise<void> {
        this.subscribe([{
            name: WebSocketChannelName.LEVEL2,
            product_ids: [product],
        }], {
            message(message) {
                if (message.type === WebSocketResponseType.LEVEL2_SNAPSHOT) {
                    logInfo(JSON.stringify(message, null, 2))
                }
                if (message.type === WebSocketResponseType.LEVEL2_UPDATE) {
                    logInfo(JSON.stringify(message, null, 2))
                }
                logInfo('')
            }
        })
    }


}
