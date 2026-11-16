import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterAll } from 'vitest'

// Starts an in-memory MongoDB before the test file runs and sets MONGO_URL
// so the app's getDb() connects to it. Runs per test file (isolated env).
let mem

beforeAll(async () => {
  mem = await MongoMemoryServer.create()
  process.env.MONGO_URL = mem.getUri()
  process.env.DB_NAME = 'solocrm_test'
}, 60_000)

afterAll(async () => {
  if (mem) await mem.stop()
})
