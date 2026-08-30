import { MongoClient } from 'mongodb'

// Cache the client promise on globalThis so that hot-reloads in development
// and lambda re-invocations in serverless do not open a new connection on
// every request (which leads to connection storms / pool exhaustion).
const globalForMongo = globalThis

let clientPromise = globalForMongo.__soloworkMongoClientPromise

function getClientPromise() {
  if (clientPromise) return clientPromise

  const uri = process.env.MONGO_URL
  if (!uri) {
    throw new Error('MONGO_URL environment variable is not set')
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  })

  clientPromise = client.connect()
  globalForMongo.__soloworkMongoClientPromise = clientPromise
  return clientPromise
}

/**
 * Returns a connected Db instance, reusing a cached connection when possible.
 */
export async function getDb() {
  const dbName = process.env.DB_NAME
  if (!dbName) {
    throw new Error('DB_NAME environment variable is not set')
  }
  const client = await getClientPromise()
  return client.db(dbName)
}
