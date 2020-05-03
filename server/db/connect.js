const MongoClient = require('mongodb').MongoClient

/**
 * Convience function for connecting to the Mongo DB.
 */
const getConnection = async function () {
  const url = process.env.MONGO_URL
  const client = new MongoClient(url, { useUnifiedTopology: true })
  await client.connect()
  const db = client.db()
  return { client, db }
}

module.exports = {
  getConnection,
}
