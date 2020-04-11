const { getConnection } = require('../../db/connect')
const { searchFeatures } = require('../../db/features')

/**
 * Checks if the user visited an infected location (or been somewhere near)
 * and if yes and it was at the time when the virus is still active then mark a user as at risk
 */
const figureIfPersonIsAtRisk = async userId => {
  const { db } = await getConnection()
  const options = {
    uniqueId: userId,
  }
  const locationHistory = await searchFeatures(db, options)

  // To do check if user's location history overlapped with feature marked "atRisk"
  return {
    approachedVirus: {
      date: '',
      location: '',
    },
  }
}
