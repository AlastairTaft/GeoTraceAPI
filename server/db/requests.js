

/**
 * Get the last request for a certain IP.
 * @param {MongoCollection} collection
 * @param {string} ip
 */
const getRequest = async function(collection, ip){
  var record = await collection
    .findOne(
      { ip },
      { 
        sort: { timestamp: -1},
      }
    )
  return record
}

/**
 * Mark when an IP last made a request.
 * @param {MongoCollection} collection
 * @param {string} ip
 */
const markRequest = async function(collection, ip, timestamp){
  await collection.updateOne(
    { ip },
    { $set: { ip, timestamp, } },
    { upsert: true }
  )
}

module.exports = {
  getRequest,
  markRequest,
}
