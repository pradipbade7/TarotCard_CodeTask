import React, { useState, useMemo, useEffect } from 'react'
import { animateShuffle } from '../src/animations/shuffle'
import Card from './Card'

export default function Deck({ baseDeck, onDeal, onDeckChange, onShuffle, groupRef }) {

  const [deck, setDeck] = useState(baseDeck || []) 

  const getDeckSizeFromCSS = () => {
    const styles = getComputedStyle(document.documentElement)
    const width =  1
    const height = parseFloat(styles.getPropertyValue('--card-height')) || 4.5
    const thickness = parseFloat(styles.getPropertyValue('--card-thickness')) || 0.05
    
    return [width * 0.8, height * 0.8, thickness * 2] 
  }


    const getResponsiveDeckPosition = () => {
      const width = window.innerWidth
      
      if (width < 640) { 
        return [width/150, 4, 1]
      } else if (width < 768) { 
        return [width/140, 3.5, 1]
      } else if (width < 1024) { 
        return [width/140, 3.2, 1]
      } else if (width < 1400) { 
        return [width/150, 3.2, 1]
      } else { 
        return [8, 3, 1]
      }
    }


  const [deckSize, setDeckSize] = useState(getDeckSizeFromCSS())
  const [deckPosition, setDeckPosition] = useState(getResponsiveDeckPosition())

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        setDeckSize(getDeckSizeFromCSS())
        setDeckPosition(getResponsiveDeckPosition())
      }, 10)
    }

    window.addEventListener('resize', handleResize)
    
    setDeckSize(getDeckSizeFromCSS())
    setDeckPosition(getResponsiveDeckPosition())
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  useEffect(() => {
    if (baseDeck) {
      setDeck(baseDeck)
      onDeckChange?.(baseDeck.length)
    }
  }, [baseDeck, onDeckChange])

  const shuffleDeck = () => {
    animateShuffle(
      groupRef,
      {
        liftAmount: 2,
        liftTime: 0.3,
        scatterTime: 0.5,
        restackTime: 0.7,
        staggerAmount: 0.02,
      },
      () => {
        const shuffledDeck = [...deck]
        for (let i = shuffledDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]]
        }
        setDeck(shuffledDeck)
        onShuffle(shuffledDeck) // Update global base deck
        onDeal([]) // Clear dealt cards
      }
    )
  }


  const handlePointerDown = (e) => {
    e.stopPropagation()
    shuffleDeck()
  }

  return (
    <group
      ref={groupRef}
      rotation={[0.1, Math.PI, 0]}
      position={deckPosition} 
    >
      {deck && deck.map((code, idx) => ( 
        <Card
          key={`${code}-${idx}`}
          code={code}
          rotation={[0.5, 0, 0]}
          position={[0, -idx * 0.01, idx * 0.01]}
        />
      ))}

      {deck && deck.length > 0 && (
        <mesh
          visible={false}
          position={[0, 0, deck.length * 0.001 + 0.01]}
          onPointerDown={handlePointerDown}
        >
          <boxGeometry args={deckSize} /> 
        </mesh>
      )}
    </group>
  )
}
