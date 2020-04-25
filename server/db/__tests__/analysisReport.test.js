const { getConnection } = require('../connect')
const analysisReportsDB = require('../analysisReports')

/*
 * ///////////////////////////////////////////////////////
 *  Check the sample data is in Database to run the test!
 * ///////////////////////////////////////////////////////
 */

// TODO: Tests disabled: Database is not mocked, it is needed properly run
xdescribe('AnalysisReport collection in database', () => {
  let db, client

  beforeAll(async () => {
    const connection = await getConnection()
    db = connection.db
    client = connection.client
  })

  afterAll(() => {
    if (client) {
      client.close()
    }
  })

  it('saves a report', async () => {
    const date = new Date()
    const uuid = await analysisReportsDB.saveReport(db, date)

    expect(uuid).toBeDefined()
  })

  it('gets a report', async () => {
    const uuid = await analysisReportsDB.saveReport(db, new Date())
    const result = await analysisReportsDB.getReport(db, uuid)

    expect(result.uuid).toBe(uuid) // not mocked
    expect(result.used).toBe(false) // not mocked
  })

  it('checks if a report is used', async () => {
    const uuid = await analysisReportsDB.saveReport(db, new Date())
    const used = await analysisReportsDB.isUsed(db, uuid)

    expect(used).toBeFalsy()
  })

  it('set a report as used', async () => {
    const uuid = await analysisReportsDB.saveReport(db, new Date())
    const usedNew = await analysisReportsDB.isUsed(db, uuid)
    expect(usedNew).toBeFalsy()

    const result = await analysisReportsDB.setUsed(db, uuid)
    expect(result).toBeTruthy()

    const usedUpdated = await analysisReportsDB.isUsed(db, uuid)
    expect(usedUpdated).toBeTruthy()
  })
})
