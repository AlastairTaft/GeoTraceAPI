require('./types')
var { getConnection } = require('./db/connect')
var { handleServerResponse } = require('./server/server')
var { ServerError } = require('./server/errors')
var FeatureCollection = require('./geojson/FeatureCollection')
var { bulkInsertFeatures, searchFeatures, markAtRisk } = require('./db/features')
var { validateFeature, validateGetLocationInput, normaliseGetLocationInput } = require('./server/validation')

/**
 * Accept a Geo JSON FeatureCollection as the request body
 * e.g.
 * ```
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *    {
 *      "type": "Feature",
 *      "geometry": {
 *        "type": "Point",
 *        "coordinates": [
 *          50.123,
 *          51.321,
 *          0
 *        ]
 *      }
 *    }
 *   ]
 * }
 * ```
 * 
 * Find the number of households in a polygon area.
 */
const submitLocationHistory = async event => {
  if (!event.body)
    throw new ServerError('Missing body content.', 400)

  var { requestTimeEpoch, requestId, identity } = event.requestContext
  var { sourceIp, userAgent } = identity

  // We can use this info to debug API abuse and to remove bad data.
  var requesterInfo = {
    requestTimeEpoch,
    requestId,
    sourceIp,
    userAgent,
  }
  
  var featureCollection = new FeatureCollection()
  featureCollection.parse(JSON.parse(event.body))
  var { db, client } = await getConnection()

  // Validate features
  featureCollection.features.forEach(f => validateFeature(f))
  await bulkInsertFeatures(db, featureCollection.features, requesterInfo)

  // If any location features are marked as infected need to do the contact
  // tracing
  var infectionPoints = featureCollection.features.map(f => f.properties.infected)
  await Promise.all(infectionPoints.map(async feature => {
    return markAtRisk(feature)
  }))

  client.close()

  return {
    // As a convenience return some valid JSON so that client's don't 
    // fall over trying to parse the response.
    "all good": "👌"
  }
}

/**
 * Get location history
 */
const getLocationHistory = async event => {
  validateGetLocationInput(event.queryStringParameters)
  var { db, client } = await getConnection()
  var features = await searchFeatures(
    db, 
    normaliseGetLocationInput(event.queryStringParameters),
  )
  client.close()
  return {
    // Return a feature collection
    "type": "FeatureCollection",
    features,
  }
}

module.exports = {
  submitLocationHistory: handleServerResponse(submitLocationHistory),
  getLocationHistory: handleServerResponse(getLocationHistory),
}
