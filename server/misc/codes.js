

const generateCode = function(bits = 512){
  var alphabet = "012345678910abcdefghijklmnopqrstuvwxyz" + 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ$-_+!*"
  var expectedEntroy = Math.pow(2, bits)
  var key = ''
  while(Math.pow(alphabet.length, key.length) < expectedEntroy){
    key += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return key
}

module.exports = {
  generateCode,
}

