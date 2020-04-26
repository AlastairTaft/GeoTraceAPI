var methods = require('./risk')

describe('#risk', () => {
  describe('#getAtRiskUsers', () => {
    it('should mark the 1st connection of users at risk', async () => {
      
      var dataPoints = [
        { hash: 'At the pub', uniqueId: 'Sam', infected: true },
        { hash: 'At the pub', uniqueId: 'Geoff' },
        { hash: 'At the supermarket', uniqueId: 'Geoff' },
        { hash: 'At the supermarket', uniqueId: 'Sally' },
      ]
      const getUserHashes = uniqueId => {
        return dataPoints
          .filter(dto => dto.uniqueId == uniqueId)
      }
      const getMatchingHashes = hashes => {
        return dataPoints
          .filter(dto => hashes.some(hash => hash == dto.hash))
      }
      var isGeoffInfected = await methods.isUserAtRisk({
        uniqueId: 'Geoff',
        getUserHashes,
        getMatchingHashes,
        chainLength: 1,
      })
      expect(isGeoffInfected).toBe(true)
      var isSallyInfected = await methods.isUserAtRisk({
        uniqueId: 'Sally',
        getUserHashes,
        getMatchingHashes,
        chainLength: 1,
      })
      expect(isSallyInfected).toBe(false)
    })

    it(`#foobar should mark the 1st and 2nd in the chain of users as at risk.
      Note we don't have any timestamp information so we don't know if
      Sally met Geoff after or before Geoff met Sally. So half the time here
      we may be incorrectly marking Geoff at risk, the more chains we go
      the wider the net we cast`.replace(/\s+/g, ' '), async () => {
      var dataPoints = [
        { hash: 'At the pub', uniqueId: 'Sam', infected: true },
        { hash: 'At the pub', uniqueId: 'Geoff' },
        { hash: 'At the supermarket', uniqueId: 'Geoff' },
        { hash: 'At the supermarket', uniqueId: 'Sally' },
      ]
      const getUserHashes = uniqueId => {
        return dataPoints
          .filter(dto => dto.uniqueId == uniqueId)
      }
      const getMatchingHashes = hashes => {
        return dataPoints
          .filter(dto => hashes.some(hash => hash == dto.hash))
      }
      var isGeoffInfected = await methods.isUserAtRisk({
        uniqueId: 'Geoff',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isGeoffInfected).toBe(true)
      var isSallyInfected = await methods.isUserAtRisk({
        uniqueId: 'Sally',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isSallyInfected).toBe(true)

    })
  })
})