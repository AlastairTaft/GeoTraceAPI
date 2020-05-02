

/**
 * @param {MongoCollection} collection
 */
const getAccessKey = async function (collection, accessKey) {
  return collection.findOne({ accessKey })
}

module.exports = {
  getAccessKey,
}
