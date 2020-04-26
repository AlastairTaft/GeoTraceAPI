
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

var markUsersAtRisk = function(db){

  var dbInfected = db.collection('infected')
  var infectedCursor = dbInfected.find({})
  for await (const infectedRec of infectedCursor) {
    var { uniqueId } = infectedRec
    
  }


  var getAtRiskHashRecords = async function(uniqueId){
    collection.find
  }

  var hashes = await getAtRiskHashes(uniqueId)
  var atRiskHashesObj = {}
  hashes.forEach(hash => {
    atRiskHashesObj[hash] = true
  })
}

module.exports = { 
  bulkInsert,
  markInfectedHashes,
}
