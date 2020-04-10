/**
 * Mark a user as diagnosed with COVID-19
 * @param {MongoDB} db
 * @param {string} uniqueId
 * @param {number} timestampShowingSymptoms
 * @returns {Promise}
 */
const setUserInfected = async function (
  db,
  uniqueId,
  timestampShowingSymptoms,
) {
  var collection = db.collection('infected')
  return collection.update(
    { uniqueId },
    { $set: { uniqueId, timestampShowingSymptoms } },
    { upsert: true },
  )
}

/**
 * Check whether user is infected or not.
 * @param {MongoDB} db
 * @param {string} uniqueId
 * @returns {Promise<boolean>}
 */
const getUserInfected = async function (db, uniqueId) {
  var collection = db.collection('infected')
  // TODO Update when user has recovered
  var total = await collection.find({ uniqueId }).count()
  console.log('getUserInfected#total', total)
  return total > 0
}

const notifyRelatedUsersAboutRiskByFeatures = async features => {
  // For each received feature but only 1 per user
  // Generate message that will contain date and readable location when user encountered virus
}

module.exports = {
  setUserInfected,
  getUserInfected,
  notifyRelatedUsersAboutRisk,
}
