
/**
 * Bulk insert feature records.
 * @param {MongoCollection} collection
 * @param {Array<object>} hashes
 * @param {string} hashes[0].hash
 * @param {number} hashes[0].timePassedSinceExposure
 * @param {string} hashes[0].uniqueId
 * @returns {Promise}
 */
const bulkInsert = (collection, hashes) => {
  var operations = hashes.map(({ hash, timePassedSinceExposure, uniqueId }) => {
    return {
      updateOne: {
        filter: { hash, uniqueId },
        update: {
          $set: {
            hash,
            uniqueId,
            timePassedSinceExposure,
            updatedAt: (new Date()).valueOf(),
          },
        },
        upsert: true,
      },
    }
  })
  return collection.bulkWrite(operations)
}

/**
 * Mark hashes as infected.
 */
const markInfectedHashes = function(collection, uniqueId){
  return collection.updateMany(
    { 
      uniqueId, 
      // Mark an area as at risk for up to 2 hours after the infected user 
      // visits it
      // This can be tweaked at a later date
      timePassedSinceExposure: {$lte: 1000 * 60 * 60 * 2 },
    },
    { infected: true },
  )
}

/**
 * Get all the user's hashes.
 */
const getUserHashes = function(collection, uniqueId){
  return collection.find(
    { uniqueId }
  ).toArray()
}

/**
 * Get all the recors that have matching hash strings
 */
const getMatchingHashes = function(collection, hashStrings){
  return collection.find(
    { uniqueId, hash: { $in: hashStrings }}
  ).toArray()
}

module.exports = { 
  bulkInsert,
  markInfectedHashes,
  getUserHashes,
  getMatchingHashes
}
