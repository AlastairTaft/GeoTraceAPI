
/**
 * @typedef HashDto
 * @property {string} hash
 * @property {number} timestamp The timestamp this occured, doesn't have to be
 * a real timestamp just needs to preserve order of events. If ommitted then
 * will on average warn double the amount of people when a depth search of 2 
 * or more is used, because there's no way to determine a tree of events if it
 * happened in the past or future.
 * @property {string} uniqueId Identifies a specific user's contact chain.
 * @property {boolean} infected If true the user was infected at this point of
 * contact.
 *  
 * @typedef IsUserAtRiskProps
 * @property {string} uniqueId
 * @property {Function} getUserHashes A method to get all hashes for an array
 * of unique ids. The first argument is an array of unique ids and the second
 * argument is an optional timestamp to only get hashes that occured before
 * this point. Must return a promise that resolves to an array of type HashDto
 * @property {Function} getMatchingHashes Gets all hashes the match the provided
 * hashes. The first argument will be an array of strings which are hashes.
 * Returns a promise which resolves to an array of objects of type HashDto
 * 
 * Is the user at risk
 * @param {IsUserAtRiskProps} props
 * @returns {Promise<boolean>}
 */
var isUserAtRisk = async function(props){
  const {
    uniqueId,
    getUserHashes,
    getMatchingHashes,
    chainLength = 1,
  } = props

  var userHashes = await getUserHashes([uniqueId])
  var matchingHashes = await getMatchingHashes(userHashes.map(dto => dto.hash))
  // Iterate over the hashes and pull out all the users or see if one of them
  // is marked as infected
  var existingUniqueIds = {}
  existingUniqueIds[uniqueId] = true
  var allUniqueIds = {}
  var allUniqueIdsTimeOfInteraction = {}
  var infected = matchingHashes.some(dto => {
    // Don't process it again if we already have so that we don't get stuck in
    // in infinite loop
    if (!existingUniqueIds[dto.uniqueId]){
      allUniqueIds[dto.uniqueId] = true
      // Time of interactions
      allUniqueIdsTimeOfInteraction[dto.uniqueId] = dto.timestamp
    }
    return dto.infected
  })
  if (infected) return true
  if (chainLength == 1) return false
  var results = await Promise.all(Object.keys(allUniqueIds).map(uniqueId => isUserAtRisk({
    uniqueId,
    getUserHashes: (uniqueIds) => getUserHashes(uniqueIds, allUniqueIdsTimeOfInteraction[uniqueId]),
    getMatchingHashes,
    chainLength: chainLength -1,
  })))
  return results.some(r => r)
}


module.exports = {
  isUserAtRisk,
}


