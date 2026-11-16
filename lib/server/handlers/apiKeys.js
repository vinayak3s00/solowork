import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json, HttpError } from '../http'
import { createApiKeySchema } from '../schemas'
import { encrypt, mask } from '../crypto'
import { requireAuth } from '../auth/session'

// Presents a stored key document safely: never returns ciphertext or plaintext,
// only a masked hint derived from the last 4 chars kept at write time.
/** @param {Record<string, any>} doc */
const present = ({ _id, ownerId, apiKeyEnc, apiKeyLast4, apiKey, ...rest }) => ({
  ...rest,
  apiKey: '***' + (apiKeyLast4 || ''),
})

export async function createApiKey(request) {
  const { sub: ownerId } = requireAuth(request)
  const data = createApiKeySchema.parse(await request.json())

  const doc = {
    id: uuidv4(),
    ownerId,
    name: data.name,
    provider: data.provider,
    baseUrl: data.baseUrl,
    // Encrypt secret at rest; keep only a last-4 hint for display.
    apiKeyEnc: encrypt(data.apiKey),
    apiKeyLast4: data.apiKey.slice(-4),
    createdAt: new Date(),
  }

  const db = await getDb()
  await db.collection('api_keys').insertOne(doc)
  return json(present(doc), { status: 201 })
}

export async function listApiKeys(request) {
  const { sub: ownerId } = requireAuth(request)
  const db = await getDb()
  const keys = await db
    .collection('api_keys')
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  return json(keys.map(present))
}

export async function deleteApiKey(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const db = await getDb()
  const result = await db.collection('api_keys').deleteOne({ id, ownerId })
  if (result.deletedCount === 0) throw new HttpError(404, 'API key not found')
  return json({ message: 'API key deleted' })
}

// Exported for future server-side use (e.g. calling AI providers).
export { mask }
