const Authority = require('./model/Authority')

/**
 * Get the authorities with the specified private key
 * @param {MongoDB} db
 * @param {string} token
 * @returns {Promise}
 */
const getAuthority = async (
  db,
  token
) => {
  let collection = db.collection('authorities')
  return await collection.find({ token }).toArray()
    .map(data => Authority(data))
}

/**
 * Check if there is any authority with the provided public key
 * @param {MongoDB} db
 * @param {string} token
 * @returns {Promise}
 */
const validToken = async (
  db,
  token
) => {
  let collection = db.collection('authorities')
  return await collection.find({ token }).count() > 0
}



module.exports = {
  getAuthority,
  validToken
}
