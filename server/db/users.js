/**
 * Mark a user as diagnosed with COVID-19
 * @param {MongoCollection} db
 * @param {string} uniqueId
 * @param {object} updateProps
 * @returns {Promise}
 */
const updateUser = async function (
  collection,
  uniqueId,
  updateProps,
) {
  
  return collection.update(
    { uniqueId },
    { $set: updateProps },
    { upsert: true },
  )
}

/**
 * Get a user, if the user doesn't exist, it creates a record
 * @param {MongoDB} db
 * @param {string} uniqueId
 * @returns {Promise<boolean>}
 */
const getCreateUser = async function (collection, uniqueId) {
  // TODO Update when user has recovered
  var record = await collection.findOne({ uniqueId })
  return record
}

module.exports = {
  updateUser,
  getCreateUser,
}
