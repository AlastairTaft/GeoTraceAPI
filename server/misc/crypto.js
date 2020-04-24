const crypto = require('crypto')

const hashString = function(seed){
  if (!process.env.SECRET)
    throw new Error('SECRET is not specified.')
  return crypto.createHmac('sha512', process.env.SECRET)
    .update(seed)
    .digest('base64')
}



module.exports = {
  hashString,
}
