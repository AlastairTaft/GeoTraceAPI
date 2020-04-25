const { getConnection } = require('../connect')
const authoritiesDB = require('../authorities')

/*
 * ///////////////////////////////////////////////////////
 *  Check the sample data is in Database to run the test!
 * ///////////////////////////////////////////////////////
 */

// TODO: Tests disabled: Database is not mocked, it is needed properly run
xdescribe('Authority collection in database', () => {
  let db, client
  const token = '123456789'

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

  it('returns the authorities', async () => {
    const authorities = await authoritiesDB.getAuthority(db, token)

    expect(authorities.length).toBeGreaterThan(0)
    expect(authorities[0].token).toBe(token)
  })

  it('checks if public key is valid', async () => {
    const valid = await authoritiesDB.validToken(db, token)

    expect(valid).toBeTruthy()
  })
})
