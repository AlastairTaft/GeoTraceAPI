const AnalysisReport = require('./model/AnalysisReport')

const randomNumbers = (size) => Math.random().toString().substring(2, size + 2)

const generateUuid = async (db) => {
  const uuid = `${randomNumbers(4)}-${randomNumbers(4)}-${randomNumbers(2)}`
  let unique
  do {
    unique = await db.collection('analysisReports').find({ uuid }).count() === 0
  } while(!unique)
  return uuid
}

/**
 * Get the report with the specified id
 * @param {MongoDB} db
 * @param {string} uuid
 * @returns {Promise<object>} Information about the report
 */
const getReport = async (
  db,
  uuid
) => {
  let collection = db.collection('analysisReports')
  const reports = await collection.find({ uuid }).toArray()
  if(reports.length === 0) return

  return AnalysisReport(reports[0])
}

/**
 * Save a report
 * @param {MongoDB} db
 * @param {Date} date
 * @returns {Promise<string>} UUID of the report inserted in database
 */
const saveReport = async (
  db,
  date
) => {
  const uuid = await generateUuid(db)
  const analysisReport = AnalysisReport({uuid, date, used: false})

  let collection = db.collection('analysisReports')
  const result = await collection.insertOne(analysisReport)
  return result && result.insertedCount === 1 ? uuid : undefined
}

/**
 * Check if the analysis report is used
 * @param {MongoDB} db
 * @param {string} uuid
 * @returns {Promise<boolean | undefined>} the report has been used or not (undefined if could not get value)
 */
const isUsed = async (
  db,
  uuid
) => {
  let collection = db.collection('analysisReports')
  const reports = await collection.find({ uuid }).toArray()
  if(reports.length === 0) return

  return reports[0].used
}

/**
 * Set an analysis report as used
 * @param {MongoDB} db
 * @param {string} uuid
 * @returns {Promise<boolean>} it was success or not
 */
const setUsed = async (
  db,
  uuid
) => {
  let collection = db.collection('analysisReports')
  const { result } = await collection.updateOne({ uuid }, { $set: { used: true } })
  return result && result.ok === 1
}



module.exports = {
  getReport,
  saveReport,
  isUsed,
  setUsed
}
