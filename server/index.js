var memoize = require("memoizee")
var { getConnection } = require('./db/connect')
var { handleServerResponse } = require('./server/server')
var { ServerError } = require('./server/errors')
var FeatureCollection = require('./geojson/FeatureCollection')
var dbFeatures = require('./db/features')
var dbUsers = require('./db/users')
var serverValidation = require('./server/validation')

var getUserInfected = memoize(
  dbUsers.getUserInfected,
  {
    normalizer: (db, uniqueId) => uniqueId
  },
)

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
  await Promise.all(featureCollection.features.map(async f => {
    serverValidation.validateFeature(f)
    // If the user is infected, mark it as such
    var infected = await getUserInfected(db, f.properties['uniqueId'])
    f.properties['infected'] = infected
  }))
  await dbFeatures.bulkInsertFeatures(db, featureCollection.features, requesterInfo)

  // If any location features are marked as infected need to do the contact
  // tracing
  var infectionPoints = featureCollection.features.map(f => f.properties.infected)
  await Promise.all(infectionPoints.map(async feature => {
    return dbFeatures.markAtRisk(feature)
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
  serverValidation.validateGetLocationInput(event.queryStringParameters)
  var { db, client } = await getConnection()
  var features = await dbFeatures.searchFeatures(
    db, 
    serverValidation.normaliseGetLocationInput(event.queryStringParameters),
  )
  await client.close()
  return {
    // Return a feature collection
    "type": "FeatureCollection",
    features,
  }
}

/**
 * Mark user has been diagnosed with COVID-19.
 */
const reportInfected = async event => {
  serverValidation.validateReportInfectedInput(event)
  var { uniqueId, timestampShowingSymptoms } = JSON.parse(event.body)
  var { db, client } = await getConnection()
  await dbUsers.setUserInfected(db, uniqueId, timestampShowingSymptoms)
  // TODO Mark all relevant records as atRisk
  client.close()
  return { 'ok': true }
}

/**
 * Get the status for the user.
 */
const getStatus = async event => {
  if (!event.queryStringParameters['unique-id'])
    throw new Error('Missing \'unique-id\' prop.')
  var { db, client } = await getConnection()
  var infected = await dbUsers.getUserInfected(
    db,
    event.queryStringParameters['unique-id']
  )
  client.close()
  return {
    infected,
  }
}

module.exports = {
  submitLocationHistory: handleServerResponse(submitLocationHistory),
  getLocationHistory: handleServerResponse(getLocationHistory),
  reportInfected: handleServerResponse(reportInfected),
  getStatus: handleServerResponse(getStatus),
}
