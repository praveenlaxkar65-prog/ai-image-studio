import { defineConfig } from 'prisma/config'
import 'dotenv/config' // Ye line zaroori hai

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  },
})