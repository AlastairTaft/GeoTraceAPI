var memoize = require('memoizee')
var { getConnection } = require('./db/connect')
var { handleServerResponse, rateLimit } = require('./server/server')
var { ServerError } = require('./server/errors')
var dbUsers = require('./db/users')
var serverValidation = require('./server/validation')
var { hashString } = require('./misc/crypto')
var dbRiskMap = require('./db/riskMap')

/**
 * Submit risk hashes
 */
const submitRiskMap = async event => {
  if (!event.body) throw new ServerError('Missing body content.', 400)
  var { uniqueId, hashes } = JSON.parse(event.body)
  var { db, client } = await getConnection()
  var riskMapCollection = db.collection('riskMap')
  var user = await dbUsers.getCreateUser(db.collection('users'), uniqueId)
  await dbRiskMap.bulkInsert(
    riskMapCollection,
    hashes.map(({ hash, timePassedSinceExposure }) => ({
      uniqueId,
      hash,
      timePassedSinceExposure,
      infected: user.infected,
    }))
  )
  client.close()
  // TODO Return user status
  return {
    // As a convenience return some valid JSON so that client's don't
    // fall over trying to parse the response.
    'all good': '👌',
  }
}


/**
 * Mark user has been diagnosed with COVID-19.
 */
const reportInfected = async event => {
  serverValidation.validateReportInfectedInput(event)
  var { uniqueId, code } = JSON.parse(event.body)
  var { db, client } = await getConnection()
  // TODO Validate it is a real code but for testing will allow it through
  await dbUsers.updateUser(db.collection('users'), uniqueId, { infected: true })
  await dbRiskMap.markInfectedHashes(db, uniqueId)
  await client.close()
  return { 'ok': true }
}

/**
 * Get the status for the user.
 */
const getStatus = async event => {
  if (!event.queryStringParameters['unique-id'])
    throw new Error("Missing 'unique-id' prop.")
  var { db, client } = await getConnection()
  var collection = db.collection('users')
  var user = await dbUsers.getCreateUser(
    collection,
    event.queryStringParameters['unique-id'],
  )
  await client.close()
  return {
    infected: user.infected,
  }
}

/**
 * Get a salt to further encrypt data.
 */
const getSalt = async event => {
  var { seeds } = JSON.parse(event.body)

  var results = seeds.map(({ seed, timestamp }) => {
    try {
      if (typeof timestamp !== 'number')
        throw new Error('Invalid timestamp.')
      var cutOffTime = (1000 * 60 * 60) * 1.5
      var now = (new Date()).valueOf()
      // We log areas at risk for up to 9 hours in the future
      if (timestamp > (now + (1000 * 60 * 60 * 9)))
        throw new Error('Invalid timestamp.')
      if ((now - timestamp) > cutOffTime)
        throw new Error('Expired timestamp.')
    } catch (error){
      return {
        success: false,
        error: {
          message: error.message, 
        },
      }
    }
    var hash = hashString(seed + '-' + timestamp)
    return {
      success: true,
      hash,
    }
  })
  return { hashes: results }
}

/**
 * Analyse risk. To be called periodially on the server
 */
var analyseRisk = async event => {

}

module.exports = {
  submitRiskMap: handleServerResponse(submitRiskMap),
  reportInfected: handleServerResponse(reportInfected),
  getStatus: handleServerResponse(getStatus),
  getSalt: rateLimit(
    handleServerResponse(getSalt), 
    Number(process.env.RATE_LIMIT_INTERVAL)
  ),
  analyseRisk,
}
//1000 * 60 * 60 * 1.5