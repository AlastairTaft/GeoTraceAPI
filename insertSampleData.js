let { getConnection } = require('./server/db/connect')
const Authority = require('./server/db/model/Authority')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

async function insertSampleData() {
  let { db, client } = await getConnection()
  let collection = db.collection('authorities')

  let authorities = [
    Authority({
      name: 'Hospital Regional de Málaga',
      token: '123456789'
    })
  ]

  collection.insertMany(authorities, (err, res) => {
    if (err) throw err
    console.log("Number of documents inserted: " + res.insertedCount)
    client.close()
  });
}

insertSampleData()
  .then(console.log)
  .catch(console.error)
