

/**
 * Create a report code
 * @param {MongoCollection} collection
 * @param {string} details.code
 * @param {string} details.healthAuthorityId
 */
const createCode = async function(collection, details){
  const { code, healthAuthorityId } = details
  var newRecord = {
    code,
    createdAt: (new Date()).valueOf(),
    healthAuthorityId,
  }
  var result = await collection.insertOne(newRecord)
  return {
    ...newRecord,
    _id: result.insertedId,
  }
}

module.exports = {
  createCode,
}
