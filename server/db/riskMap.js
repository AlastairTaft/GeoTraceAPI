
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

module.exports = { 
  bulkInsert,
}
