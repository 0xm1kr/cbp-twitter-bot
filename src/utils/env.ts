// load .env
import { resolve } from 'path'
import { config } from 'dotenv'

if (!process.env.ENVIRONMENT) {
    config({ path: resolve(__dirname, '../.env') })
}
