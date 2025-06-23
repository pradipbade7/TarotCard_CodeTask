export function animateCardHover(cardRef, isHovering) {
    const card = cardRef.current
    if (!card) return
  
    const duration = 200
    
    function tween(from, to, dur, onUpdate, onComplete) {
      const start = performance.now()
      function frame(now) {
        const t = Math.min((now - start) / dur, 1)
        const eased = t * t * (3 - 2 * t) // Smooth easing
        onUpdate(from + (to - from) * eased)
        if (t >= 1 && onComplete) onComplete()
        else if (t < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }
  
    if (!card.userData.originalStored) {
      card.userData.originalY = card.position.y
      card.userData.originalZ = card.position.z
      card.scale.setScalar(1) 
      card.userData.originalScaleX = 1
      card.userData.originalScaleY = 1
      card.userData.originalStored = true
    }
  
    if (isHovering) {
      // Move card forward and up slightly, scale up
      tween(card.scale.x, 1.1, duration, v => (card.scale.x = v))
      tween(card.scale.y, 1.1, duration, v => (card.scale.y = v))
    } else {
      // Return to exact original values (always 1 for scale)
      tween(card.scale.x, 1, duration, v => (card.scale.x = v)) 
      tween(card.scale.y, 1, duration, v => (card.scale.y = v)) 
    }
  }
  
  export function resetCardHover(cardRef) {
    const card = cardRef.current
    if (!card) return
  
    card.position.y = card.userData.originalY || card.position.y
    card.position.z = card.userData.originalZ || card.position.z
    card.scale.setScalar(1) // Force scale back to normal
  }