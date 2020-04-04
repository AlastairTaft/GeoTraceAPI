
var { assert } = require('./../misc/test')

/**
 * Validate a feature is suitable for our database.
 * @param {GeoJSONFeature} feature
 */
const validateFeature = function(feature){
  assert(feature['properties'], 
    'Expected feature to have a \'properties\' value.')
  assert(feature['properties']['timestamp'],
    'Expected feature to have a \'timestamp\' value in properties.')
  assert(feature['properties']['uniqueId'],
    'Expected feature to have a \'uniqueId\' value in properties.')
  if ('infected' in feature['properties'])
    assert(typeof feature['properties']['infected'] == 'boolean',
      'Expected feature properties \'infected\' prop to be boolean.')
}

const validateGetLocationInput = function(queryStringParameters){
  assert(queryStringParameters['unique-id'], '\'unique-id\' is required.')
  if ('geo-within' in queryStringParameters){
    try {
      JSON.parse(queryStringParameters['geo-within'])
    } catch (e){
      throw new Error('Invalid JSON for \'geo-within\'.')
    }
  }
  if ('limit' in queryStringParameters){
    var limit = Number(queryStringParameters['limit'])
    assert(Number.isInteger(limit), 'Expected \'limit\' to be an integer.')
  }
  if ('skip' in queryStringParameters){
    var skip = Number(queryStringParameters['skip'])
    assert(Number.isInteger(skip), 'Expected \'skip\' to be an integer.')
  }
  if ('from' in queryStringParameters){
    var from = Number(queryStringParameters['from'])
    assert(Number.isInteger(from), 'Expected \'from\' to be an integer.')
  }
  if ('to' in queryStringParameters){
    var to = Number(queryStringParameters['to'])
    assert(Number.isInteger(to), 'Expected \'to\' to be an integer.')
  }
}

const normaliseGetLocationInput = function(queryStringParameters){
  var newVals = {}
  newVals.uniqueId = queryStringParameters['unique-id']
  if ('geo-within' in queryStringParameters)
    newVals.geoWithin = JSON.parse(queryStringParameters['geo-within'])
  if ('skip' in queryStringParameters)
    newVals.skip = Number(queryStringParameters['skip'])
  if ('limit' in queryStringParameters)
    newVals.limit = Number(queryStringParameters['limit'])
  if ('from' in queryStringParameters)
    newVals.from = Number(queryStringParameters['from'])
  if ('to' in queryStringParameters)
    newVals.to = Number(queryStringParameters['to'])
  return newVals
}

module.exports = {
  validateFeature,
  validateGetLocationInput,
  normaliseGetLocationInput,
}
