
/**
 * @param {MongoDb} db
 * @param {Feature} feature
 * @param {object} extraProperties 
 */
const insertFeature = async function(db, feature, requesterInfo){
  var collection = db.collection('features')
  var record = await collection.findOne({ feature })
  if (record) return record
  return collection.insertOne(
    {
      feature,
      requesterInfo,
      createdAt: (new Date()).valueOf(),
    },
  )
}

const bulkInsertFeatures = (db, features, requesterInfo) => {
  var collection = db.collection('features')
  var operations = features.map(feature => {
    
    var filter = {
      'feature.properties.uniqueId': feature.properties.uniqueId,
      'feature.properties.timestamp': feature.properties.timestamp,
    }
    
    return { 
      updateOne: { 
        filter,
        update: {$set: {
          feature,
          requesterInfo,
          updatedAt: (new Date()).valueOf(),
        }}, 
        upsert: true 
      } 
    }
  })
  return collection.bulkWrite(operations)
}

/**
 * Search features.
 * @param {MongoDb} db
 */
const searchFeatures = async function(db, options){
  var { 
    geoWithin, 
    skip = 0, 
    limit = 500, 
    from,
    to, 
    uniqueId
  } = options
  var collection = db.collection('features')
  var filter = {
    'feature.properties.uniqueId': uniqueId,
  }
  if (geoWithin)
    filter['feature.geometry'] = { 
      $geoWithin: { $geometry: geoWithin } 
    } 
  if (from)
    filter['feature.properties.timestamp'] = { $gte: from }
  if (to)
    filter['feature.properties.timestamp'] = { $lt: to }
  var features = await collection.find(
    filter,
    {projection:{_id:0}},
  )
  .sort({'feature.properties.timestamp': -1}).skip(skip).limit(limit) 
  var features = await features.toArray()
  return features.map(f => f.feature)
}

/**
 * Find all other location points that would have been at the same place and
 * time and mark them as at risk.
 */
const markAtRisk = async function(db, feature){
  // TODO
}

module.exports = {
  insertFeature,
  searchFeatures,
  bulkInsertFeatures,
  markAtRisk,
}
