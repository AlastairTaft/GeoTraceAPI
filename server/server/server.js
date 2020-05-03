var { ServerError } = require('./errors')
var { getRequest, markRequest } = require('./../db/requests')
var { getConnection } = require('./../db/connect')

/**
 * Do boiler plate server response handling.
 * @param {Function} handler
 * @return {Function}
 */
const handleServerResponse = handler => async (...args) => {
  try {
    var result = await handler(...args)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Content-Encoding',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result, null, 2),
    }
  } catch (err) {
    console.error(err)
    var statusCode = err instanceof ServerError ? err.statusCode : 500
    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Content-Encoding',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          message: err.message,
          stack: process.env.NODE_ENV === 'dev' ? err.stack : undefined,
          code: err.errorCode,
        },
        null,
        2,
      ),
    }
  }
}

/**
 * Rate limit that an IP can only make one request per time interval.
 */
const rateLimit = (handler, timeInterval) => async (...args) => {
  // Ensure each IP can only call once per time interval
  var { requestTimeEpoch, requestId, identity } = args[0].requestContext
  var { sourceIp, userAgent } = identity
  var { db, client } = await getConnection()
  var collection = db.collection('requests')
  var lastRequest = await getRequest(collection, sourceIp)
  if (lastRequest && 
    ((requestTimeEpoch - lastRequest.timestamp) < timeInterval)
  ){
    await client.close()
    return {
      statusCode:  429,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Content-Encoding',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'To many request.' }),
    }
  }
  await markRequest(collection, sourceIp, requestTimeEpoch)
  await client.close()
  return handler(...args)
}

module.exports = {
  handleServerResponse,
  rateLimit,
}
