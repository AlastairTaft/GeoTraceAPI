var memoize = require('memoizee')
var { getConnection } = require('./db/connect')
var { handleServerResponse, rateLimit } = require('./server/server')
var { ServerError } = require('./server/errors')
var dbUsers = require('./db/users')
var serverValidation = require('./server/validation')
var { hashString } = require('./misc/crypto')
var dbRiskMap = require('./db/riskMap')
var riskUtil = require('./risk/risk')
var dbHealthAuthorities = require('./db/healthAuthorityAccessKeys')
var dbCodes = require('./db/reportCodes')
var miscCodes = require('./misc/codes')

/**
 * Submit risk hashes
 */
const submitRiskMap = async event => {
  if (!event.body) throw new ServerError('Missing body content.', 400)
  var { uniqueId, hashes } = JSON.parse(event.body)
  var { db, client } = await getConnection()
  var riskMapCollection = db.collection('riskMap')
  var user = await dbUsers.getCreateUser(db.collection('users'), uniqueId)
  if (hashes.length)
    await dbRiskMap.bulkInsert(
      riskMapCollection,
      hashes.map(({ hash, timePassedSinceExposure }) => ({
        uniqueId,
        hash,
        timePassedSinceExposure,
        infected: user.infected,
      }))
    )
  var collection = db.collection('users')
  var user = await dbUsers.getCreateUser(
    collection,
    uniqueId,
  )
  await client.close()
  return {
    infected: user.infected,
    atRisk: user.atRisk,
  }
}


/**
 * Mark user has been diagnosed with COVID-19.
 */
const reportInfected = async event => {
  serverValidation.validateReportInfectedInput(event)
  var { uniqueId, code } = JSON.parse(event.body)
  var { db, client } = await getConnection()

  // Validate it is a real code but for testing will allow it through
  var reportCollection = db.collection('reportCodes')
  var record = await reportCollection.findOne({ code })
  if (!record)
    throw new ServerError('Invalid code.', 400, 'INVALID_CODE')
  if (record.usedBy){
    if (record.usedBy != uniqueId)
      throw new ServerError('Invalid code.', 400, 'INVALID_CODE')
    // Record is already used so don't do anything but keep this operation 
    // indempotent
  } else {
    var collection = db.collection('users')
    var user = await dbUsers.getCreateUser(
      collection,
      uniqueId,
    )
    if(user.infected)
      throw new ServerError('Already reported as infected.', 400) 

    await reportCollection.updateOne(
      { code }, 
      { $set: { usedBy: uniqueId, usedAt: (new Date()).valueOf() }}
    )
    await dbUsers.updateUser(db.collection('users'), uniqueId, { infected: true })
    await dbRiskMap.markInfectedHashes(db, uniqueId)
  }
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
    atRisk: user.atRisk,
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
  var { db, client } = await getConnection()
  var collection = db.collection('users')
  var total = await collection.find({}).count()
  var query = collection.find({})
  var tally = 0
  for await (user of query) {
    tally++
    console.log(`Processing user ${tally} of ${total}.`)
    var atRisk = await riskUtil.isUserAtRisk({
      uniqueId: user.uniqueId,
      getUserHashes: dbRiskMap.getUserHashes.bind(this, db.collection('riskMap')),
      getMatchingHashes: dbRiskMap.getMatchingHashes.bind(this, db.collection('riskMap')),
      chainLength: 1,
    })
    await dbUsers.updateUser(db.collection('users'), user.uniqueId, { atRisk })
  }
  await client.close()
}

const generateCode = async event => {
  var { accessKey } = JSON.parse(event.body)
  if (!accessKey)
    throw new ServerError('Missing \'accessKey\'.', 400)

  
  var { db, client } = await getConnection()
  var authoritiesCollection = db.collection('healthAuthorityAccessKeys')

  var accessKeyRecord = await dbHealthAuthorities.getAccessKey(
    authoritiesCollection, accessKey)
  if (!accessKeyRecord)
    throw new ServerError('Not authorised.', 401)

  var reportCollection = db.collection('reportCodes')
  var code = await dbCodes.createCode(reportCollection, {
    code: miscCodes.generateCode(),
    healthAuthorityId: accessKeyRecord._id,
  })
  await client.close()

  return {
    code: code.code,
  }
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
  generateCode: handleServerResponse(generateCode),
}
//1000 * 60 * 60 * 1.5