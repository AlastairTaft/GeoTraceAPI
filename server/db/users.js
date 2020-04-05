

const STATE_ENUM = {
  OK: 'Ok',
  INFECTED: 'Infected',
  // Means removed from the pool of being able to infect anyone.
  REMOVED: 'Removed',
}

const setUserInfected = async function(db, uniqueId, timestampShowingSymptoms){
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
const getUserInfected = async function(db, uniqueId){
  var collection = db.collection('infected')
  // TODO Update when user has recovered
  var total = await collection.find({ uniqueId }).count()
  console.log('getUserInfected#total', total)
  return total > 0
}

module.exports = {
  setUserInfected,
  getUserInfected,
}
