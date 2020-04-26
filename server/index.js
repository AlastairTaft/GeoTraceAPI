var memoize = require('memoizee')
var { getConnection } = require('./db/connect')
var { handleServerResponse, rateLimit } = require('./server/server')
var { ServerError } = require('./server/errors')
var riskMap = require('./db/riskMap')
var dbUsers = require('./db/users')
var dbAuthorities = require('./db/authorities')
var dbAnalysisReports = require('./db/analysisReports')
var serverValidation = require('./server/validation')
var { hashString } = require('./misc/crypto')

require('dotenv').config()

var getUserInfected = memoize(dbUsers.getUserInfected, {
  normalizer: (db, uniqueId) => uniqueId,
})

/**
 * Submit risk hashes
 */
const submitRiskMap = async event => {
  if (!event.body) throw new ServerError('Missing body content.', 400)

  var { uniqueId, hashes } = JSON.parse(event.body)

  var { db, client } = await getConnection()


  var riskMapCollection = db.collection('riskMap')
  
  await riskMap.bulkInsert(
    riskMapCollection,
    hashes.map(({ hash, timePassedSinceExposure }) => ({
      uniqueId,
      hash,
      timePassedSinceExposure,
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
    throw new Error("Missing 'unique-id' prop.")
  var { db, client } = await getConnection()
  var infected = await dbUsers.getUserInfected(
    db,
    event.queryStringParameters['unique-id'],
  )
  client.close()
  return {
    infected,
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
 * Allows an authority to report an analysis
 * @return {Promise<string>} Id of the report
 */
const reportAnalysis = async event => {
  let authorization = event.headers['authorization']
  if (!authorization) throw new ServerError("Missing header 'authorization'", 400)

  let { date } = JSON.parse(event.body)
  if (!date || isNaN(new Date(date).getTime())) {
    throw new ServerError("Missing or invalid 'date' prop.", 400)
  } else {
    date = new Date(date)
  }

  const { db, client } = await getConnection()

  // TODO: Improve authorization mechanism. Current weak implementation is for hackathon demo purposes
  const valid = await dbAuthorities.validToken(db, authorization)
  if(!valid) throw new ServerError("The authority is not valid'", 400)

  const reportUuid = await dbAnalysisReports.saveReport(db, date)
    .catch((e) => {
      console.error(e)
      throw new ServerError("Something went wrong reporting the analysis", 500)
    })

  client.close()

  return reportUuid
}

/**
 * Check the analysis report
 * @return {Promise<string>} Analysis report
 */
const checkAnalysisReport = async event => {
  const uuid = event.queryStringParameters && event.queryStringParameters['uuid']
  if (!uuid) throw new ServerError("Missing 'uuid' prop.", 400)

  const { db, client } = await getConnection()

  const reportId = await dbAnalysisReports.getReport(db, uuid)
    .catch((e) => {
      console.error(e)
      throw new ServerError("Something went wrong getting the analysis report", 500)
    })

  client.close()

  return reportId
}

module.exports = {
  submitRiskMap: handleServerResponse(submitRiskMap),
  reportInfected: handleServerResponse(reportInfected),
  getStatus: handleServerResponse(getStatus),
  getSalt: rateLimit(
    handleServerResponse(getSalt), 
    Number(process.env.RATE_LIMIT_INTERVAL)
  ),
  reportAnalysis: handleServerResponse(reportAnalysis),
  checkAnalysisReport: handleServerResponse(checkAnalysisReport),
}
//1000 * 60 * 60 * 1.5
