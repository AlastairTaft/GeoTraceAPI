const { getConnection } = require('../../db/connect')
const { searchFeatures } = require('../../db/features')

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
