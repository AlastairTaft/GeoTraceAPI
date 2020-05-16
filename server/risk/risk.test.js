var methods = require('./risk')

/**
 *  \    / \    /    
 *  A\ B/  C\ D/
 *    \/     \/   
 *    1      2  
 *    /\     /\
 *  A/ B\  C/ D\
 *  /    \ /    \
 * 3      4      5
 */
var timeline1 = []


describe('#risk', () => {
  describe('#getAtRiskUsers', () => {

    it(`A is infected and A has interacted with B. After which B interacted 
      with C so when we want to know who's at risk 2 levels deep we should
      get B and C.
        \    / \    /    
        A\ B/  C\ D/
          \/     \/   
          1      2  
          /\     /\
        A/ B\  C/ D\
        /    \ /    \
       3      4      5
    `, async () => {
      
      var dataPoints = [
        { hash: '1', uniqueId: 'A', infected: true },
        { hash: '1', uniqueId: 'B' },
        { hash: '2', uniqueId: 'C' },
        { hash: '2', uniqueId: 'D' },
        { hash: '3', uniqueId: 'A', prevHash: '1', infected: true },
        { hash: '4', uniqueId: 'B', prevHash: '1' },
        { hash: '4', uniqueId: 'C', prevHash: '2' },
        { hash: '5', uniqueId: 'D', prevHash: '2' },
      ]
      const getUserHashes = uniqueIds => {
        if (uniqueIds instanceof Array == false)
          throw new Error('Expected array for \'uniqueIds\'.')
        return dataPoints
          .filter(dto => uniqueIds.includes(dto.uniqueId))
      }
      const getMatchingHashes = hashes => {
        return dataPoints
          .filter(dto => hashes.some(hash => hash == dto.hash))
      }
      var isBAtRisk = await methods.isUserAtRisk({
        uniqueId: 'B',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isBAtRisk).toBe(true)
      var isCAtRisk = await methods.isUserAtRisk({
        uniqueId: 'C',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isCAtRisk).toBe(true)
      var isDAtRisk = await methods.isUserAtRisk({
        uniqueId: 'D',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isDAtRisk).toBe(false)

    })

    it(`#foobar A should not be at risk because B interacted with the infected C after
      A interacted with B.
        \    / \   
        A\ B/  C\
          \/     \    
          1      2 
          /\     /
        A/ B\  C/
        /    \ /    
       3      4      
    `, async () => {
      var dataPoints = [
        { hash: '1', uniqueId: 'A', timestamp: 1 },
        { hash: '1', uniqueId: 'B', timestamp: 1 },
        { hash: '2', uniqueId: 'C', timestamp: 1, infected: true },
        { hash: '3', uniqueId: 'A', timestamp: 2 },
        { hash: '4', uniqueId: 'B', timestamp: 2 },
        { hash: '4', uniqueId: 'C', timestamp: 2, infected: true },
      ]
      const getUserHashes = (uniqueIds, opt_beforeTimestamp) => {
        if (uniqueIds instanceof Array == false)
          throw new Error('Expected array for \'uniqueIds\'.')
        return dataPoints
          .filter(dto => uniqueIds.includes(dto.uniqueId))
          .filter(dto => {
            if (opt_beforeTimestamp) 
              return dto.timestamp < opt_beforeTimestamp
            return true
          })
      }
      const getMatchingHashes = hashes => {
        return dataPoints
          .filter(dto => hashes.some(hash => hash == dto.hash))
      }
      var isAAtRisk = await methods.isUserAtRisk({
        uniqueId: 'B',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isAAtRisk).toBe(false)
      var isBAtRisk = await methods.isUserAtRisk({
        uniqueId: 'B',
        getUserHashes,
        getMatchingHashes,
        chainLength: 2,
      })
      expect(isBAtRisk).toBe(true)
    })



    it('should mark the 1st connection of users at risk', async () => {
      
      var dataPoints = [
        { hash: 'At the pub', uniqueId: 'Sam', infected: true },
        { hash: 'At the pub', uniqueId: 'Geoff' },
        { hash: 'At the supermarket', uniqueId: 'Geoff' },
        { hash: 'At the supermarket', uniqueId: 'Sally' },
      ]
       const getUserHashes = uniqueIds => {
        if (uniqueIds instanceof Array == false)
          throw new Error('Expected array for \'uniqueIds\'.')
        return dataPoints
          .filter(dto => uniqueIds.includes(dto.uniqueId))
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

    it(`should mark the 1st and 2nd in the chain of users as at risk.
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
      const getUserHashes = uniqueIds => {
        if (uniqueIds instanceof Array == false)
          throw new Error('Expected array for \'uniqueIds\'.')
        return dataPoints
          .filter(dto => uniqueIds.includes(dto.uniqueId))
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