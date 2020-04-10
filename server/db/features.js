/**
 * Bulk insert feature records.
 * @param {MongoDB} db
 * @param {Array<GeoJSONFeature>} features
 * @param {object} requesterInfo Stored along side the feature, used as a
 * retroactive protection against abuse, can remove records added by the
 * same IP, etc.
 * @returns {Promise}
 */
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
        update: {
          $set: {
            feature,
            requesterInfo,
            updatedAt: new Date().valueOf(),
          },
        },
        upsert: true,
      },
    }
  })
  return collection.bulkWrite(operations)
}

/**
 * Search features.
 * @param {MongoDb} db
 * @param {GeoJSONGeometry} options.geoWithin Search a specific area.
 * @param {number} skip Skip n records
 * @param {number} limit Limit searched records, upperlimit is 500
 * @param {number} from EPOCH of from and includings
 * @param {number} to EPOCH of records before
 * @param {string} uniqueId The unique user ids
 * @param {boolean} atRisk If true only search for records marked as 'at risk'
 * @returns {Promise<Array<GeoJSONFeature>>}
 */
const searchFeatures = async function (db, options) {
  var {
    geoWithin,
    centerSphere,
    skip = 0,
    limit = 500,
    from,
    to,
    uniqueId,
    atRisk,
  } = options
  limit = Math.min(limit, 500)
  var collection = db.collection('features')
  var filter = {
    'feature.properties.uniqueId': uniqueId,
  }
  if (geoWithin)
    filter['feature.geometry'] = {
      $geoWithin: { $geometry: geoWithin },
    }
  if (from) filter['feature.properties.timestamp'] = { $gte: from }
  if (to) filter['feature.properties.timestamp'] = { $lt: to }
  if (atRisk) filter['feature.properties.atRisk'] = true
  if (centerSphere)
    filter['feature.geometry'] = {
      $geoWithin: { $centerSphere: centerSphere },
    }
  var features = await collection
    .find(filter, { projection: { _id: 0 } })
    .sort({ 'feature.properties.timestamp': -1 })
    .skip(skip)
    .limit(limit)
  var features = await features.toArray()
  return features.map(f => f.feature)
}

/**
 * Find all other location points that would have been at the same place and
 * time and mark them as at risk.
 */
const markAtRisk = async (db, feature) => {
  // Options to get all features in the 10 meters radius of the infected feature
  const options = {
    centerSphere: [feature.geometry.coordinates, 10 / 6378100],
  }

  // Query features that could be at rist
  const features = await searchFeatures(db, options)

  // Set infected: true for them
  const markedAsInfectedFeatures = features.map(feature => ({
    ...feature,
    properties: {
      ...feature.properties,
      infected: true,
    },
  }))

  // Update all infected features
  await bulkInsertFeatures(db, markedAsInfectedFeatures, requesterInfo)

  // Notify all touched users
  await notifyRelatedUsersAboutRiskByFeatures(markedAsInfectedFeatures)
}

module.exports = {
  searchFeatures,
  bulkInsertFeatures,
  markAtRisk,
}
