
var isUserAtRisk = ({uniqueId, ...otherProps}) => areOneOfUsersAtRisk({
  ...otherProps,
  uniqueIds: [uniqueId],
})

var areOneOfUsersAtRisk = async function({
  uniqueIds,
  getUserHashes,
  getMatchingHashes,
  chainLength = 1,
}){
  var userHashes = await getUserHashes(uniqueIds)
  var matchingHashes = await getMatchingHashes(userHashes.map(dto => dto.hash))
  // Iterate over the hashes and pull out all the users or see if one of them
  // is marked as infected
  var existingUniqueIds = {}
  uniqueIds.forEach(id => existingUniqueIds[id] = true)
  var allUniqueIds = {}
  var infected = matchingHashes.some(dto => {
    // Don't process it again if we already have so that we don't get stuck in
    // in infinite loop
    if (!existingUniqueIds[dto.uniqueId])
      allUniqueIds[dto.uniqueId] = true
    return dto.infected
  })
  if (infected) return true
  if (chainLength == 1) return false
  return areOneOfUsersAtRisk({
    uniqueIds: Object.keys(allUniqueIds),
    getUserHashes,
    getMatchingHashes,
    chainLength: chainLength -1,
  })
}


module.exports = {
  isUserAtRisk,
}


