/**
 * @param cardRefs
 * @param groupRef
 */
export function animateDeal(cardRefs, groupRef, targetPositions = null) {
  const origin = groupRef.current.position
  const total = cardRefs.length
  const duration = 600
  const delayEach = 200

  function tween(from, to, dur, onUpdate) {
    const start = performance.now()
    function frame(now) {
      const t = Math.min((now - start) / dur, 1)
      onUpdate(from + (to - from) * t)
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  cardRefs.forEach((ref, i) => {
    const m = ref.current
    if (!m) return

    m.position.set(origin.x, origin.y, origin.z)
    m.rotation.set(0, Math.PI, 0)

    let xEnd, yEnd, zEnd, rotY
    
    if (targetPositions && targetPositions[i]) {
      [xEnd, yEnd, zEnd] = targetPositions[i]
      
      // NO rotation for mobile (< 768)
      if (window.innerWidth >= 768) {
        rotY = (i - (total - 1) / 2) * 0.1 
      } else {
        rotY = 0 // Flat cards for mobile
      }
    } else {
      if (window.innerWidth >= 768) {
        const spacingX = 1.5
        const separationZ = 0.3
        xEnd = -((total - 1) / 2) * spacingX + i * spacingX
        yEnd = -1
        zEnd = 0.5 + i * separationZ
        rotY = (i - (total - 1) / 2) * 0.1
      } else {
        const spacingX = 2.0
        xEnd = -((total - 1) / 2) * spacingX + i * spacingX
        yEnd = 0.2  
        zEnd = 0    
        rotY = 0    // No rotation
      }
    }

    setTimeout(() => {
      tween(m.position.x, xEnd, duration, v => (m.position.x = v))
      tween(m.position.y, yEnd, duration, v => (m.position.y = v))
      tween(m.position.z, zEnd, duration, v => (m.position.z = v))
      tween(m.rotation.y, rotY, duration, r => (m.rotation.y = r))
    }, i * delayEach)
  })
}