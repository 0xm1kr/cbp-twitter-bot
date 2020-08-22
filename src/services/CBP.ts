import { CoinbasePro, Account } from 'coinbase-pro-node'

export type CBPParams = {
    type: string
}

export type CBPServiceParams = {
    // API Keys can be generated here:
    // https://pro.coinbase.com/profile/api
    // https://public.sandbox.pro.coinbase.com/profile/api
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

    constructor(params: CBPServiceParams) {
        this.client = new CoinbasePro(params.auth)
    }

    /**
     * list available accounts
     */
    public async listAccounts(): Promise<Account[]> {
        return this.client.rest.account.listAccounts()
    }
}
