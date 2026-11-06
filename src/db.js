import 'dotenv/config'
import pkg from 'pg'

export const consul = new pkg.Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'ActiGest',
    port: process.env.DB_PORT || 5432
})
