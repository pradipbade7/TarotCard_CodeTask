import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import Deck from '../components/Deck'
import Card from '../components/Card'
import { animateDeal } from './animations/dealcards'
import { cardCodes } from '../utils/cardList'

import './App.css' 
export default function App() {
  // Create initial shuffled deck at app level
  const initialDeck = useMemo(() => {
    const deck = [...cardCodes]
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }, [])

  const [baseDeck, setBaseDeck] = useState(initialDeck)
  const [completeDeck, setCompleteDeck] = useState(initialDeck)
  const [dealtCards, setDealtCards] = useState([])
  const [deckCount, setDeckCount] = useState(initialDeck.length)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth) // Add window width tracking

  // Track window width changes
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleShuffle = (newShuffledDeck) => {
    setCompleteDeck(newShuffledDeck)
    setBaseDeck(newShuffledDeck)
  }

  const resetDeck = () => {
    setBaseDeck(completeDeck)
    setDealtCards([])
    setDeckCount(completeDeck.length)
  }

  const requestDeal = (n) => {
    const dealt = baseDeck.slice(0, n)
    const remaining = baseDeck.slice(n)

    setBaseDeck(remaining)
    handleDeal(dealt)
    setDeckCount(remaining.length)
  }

  const dealtRefs = useRef([])
  const deckGroupRef = useRef()
  const handleDeckChange = (count) => setDeckCount(count)
  const handleDeal = (cards) => {
    dealtRefs.current = cards.map(() => React.createRef())
    setDealtCards(cards)
  }

  const calculateTargetPositions = (cards, width) => {
    return cards.map((code, idx) => {
      const count = cards.length

      const breakpoints = {
        xs: width < 480,    
        sm: width < 640,    
        md: width < 768,    
        lg: width < 1024,   
        xl: width >= 1024   
      }

      if (breakpoints.xs || breakpoints.sm || breakpoints.md) {

        const config = {
          cardsPerRow: breakpoints.xs ? 4 : breakpoints.sm ? 4 : 4, 
          cardSpacing: breakpoints.xs ? 1.8 : breakpoints.sm ? 2.8 : 3.0, 
          rowSpacing: breakpoints.xs ? 2.5 : breakpoints.sm ? 2.8 : 3.0  
        }

        const row = Math.floor(idx / config.cardsPerRow)
        const col = idx % config.cardsPerRow
        
        const cardsInCurrentRow = Math.min(count - row * config.cardsPerRow, config.cardsPerRow)
        const startX = -(cardsInCurrentRow - 1) * config.cardSpacing / 2
        
        return [
          startX + col * config.cardSpacing,  
          -row*4 ,                   
          0                           
        ]
      } else {
        const config = {
          maxWidth: breakpoints.lg ? 16 : 20,
          minSpacing: breakpoints.lg ? 1.8 : 2.0,
          maxSpacing: breakpoints.lg ? 2.2 : 2.8,
          arcMultiplier: breakpoints.lg ? 0.25 : 0.3,
          maxRotation: breakpoints.lg ? 0.3 : 0.4,
          rotationMultiplier: breakpoints.lg ? 0.015 : 0.02,
          heightMultiplier: breakpoints.lg ? 0.08 : 0.1
        }

        const baseSpacing = Math.max(
          config.minSpacing,
          Math.min(config.maxSpacing, config.maxWidth / Math.max(count - 1, 1))
        )
        
        const totalWidth = (count - 1) * baseSpacing
        const startX = -totalWidth / 2

        const centerIdx = (count - 1) / 2
        const distanceFromCenter = Math.abs(idx - centerIdx)
        const arcDepth = distanceFromCenter * config.arcMultiplier

        const maxRotation = Math.min(
          config.maxRotation,
          count * config.rotationMultiplier
        )
        const rotY = (idx - centerIdx) * (maxRotation / Math.max(1, centerIdx))
        const heightVariation = Math.sin(idx * 0.5) * config.heightMultiplier

        return [
          startX + idx * baseSpacing,
          0.3 + heightVariation,
          1.5 - arcDepth
        ]
      }
    })
  }

  useEffect(() => {
    if (!dealtRefs.current || !Array.isArray(dealtRefs.current)) return
    if (dealtRefs.current.length === 0 || !deckGroupRef.current) return

    const tryAnimate = () => {
      const ready = dealtRefs.current.every(ref => ref?.current)

      if (ready) {
        const targetPositions = calculateTargetPositions(dealtCards, windowWidth)
        animateDeal(dealtRefs.current, deckGroupRef, targetPositions)
      } else {
        requestAnimationFrame(tryAnimate)
      }
    }

    tryAnimate()
  }, [dealtCards, windowWidth]) // Added windowWidth dependency

  useEffect(() => {
    if (dealtCards.length === 0) return
    if (!dealtRefs.current || !Array.isArray(dealtRefs.current)) return

    const ready = dealtRefs.current.every(ref => ref?.current)
    if (!ready) return

    const newTargetPositions = calculateTargetPositions(dealtCards, windowWidth)
    
    dealtRefs.current.forEach((ref, i) => {
      if (!ref?.current || !newTargetPositions[i]) return

      const card = ref.current
      const [targetX, targetY, targetZ] = newTargetPositions[i]
      
      const duration = 400
      const startTime = performance.now()
      
      const startX = card.position.x
      const startY = card.position.y
      const startZ = card.position.z
      const startRotY = card.rotation.y

      // Target rotation based on screen width
      const targetRotY = windowWidth >= 640 ? 
        (i - (dealtCards.length - 1) / 2) * 0.1 : 0

      function animate(currentTime) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = progress * progress * (3 - 2 * progress)

        card.position.x = startX + (targetX - startX) * eased
        card.position.y = startY + (targetY - startY) * eased
        card.position.z = startZ + (targetZ - startZ) * eased
        card.rotation.y = startRotY + (targetRotY - startRotY) * eased

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    })
  }, [windowWidth]) // Only trigger on window width changes

  // Function to read group position from CSS
  const getGroupPositionFromCSS = () => {
    const styles = getComputedStyle(document.documentElement)
    const y = parseFloat(styles.getPropertyValue('--group-y-position')) || -2.75
    return [0, y, 0]
  }

  const [groupPosition, setGroupPosition] = useState(getGroupPositionFromCSS())

  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        setGroupPosition(getGroupPositionFromCSS())
      }, 10)
    }

    window.addEventListener('resize', handleResize)
    setGroupPosition(getGroupPositionFromCSS())
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-400 via-purple-200 to-blue-200">
      <div className="flex-1 min-h-0 relative">
        <Canvas
          className="w-full h-full"
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 5, 15], fov: 40 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            castShadow
            position={[5, 5, 5]}
            intensity={1}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <Deck
            baseDeck={baseDeck}
            onDeal={handleDeal}
            onDeckChange={handleDeckChange}
            onShuffle={handleShuffle}
            groupRef={deckGroupRef}
          />
          <group position={groupPosition} className="transform-gpu">
            {dealtCards.map((code, idx) => {
              return (
                <Card
                  key={`${code}-${idx}`}
                  ref={dealtRefs.current[idx]}
                  code={code}
                  dealt={true}
                />
              )
            })}
          </group>
        </Canvas>
      </div>

      <div className="flex-shrink-0 p-2 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-6 py-3">
              <div className="text-white text-lg font-semibold text-center">
                <span className="text-purple-300">{deckCount}</span> cards left
              </div>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl 
                          p-3 sm:p-4 md:p-6">
            
            <div className="mb-3 sm:mb-4">
              <h3 className="text-white text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-center">
                Deal Cards
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-1.5 sm:gap-2 md:gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button 
                    key={n} 
                    onClick={() => requestDeal(n)}
                    className="bg-gradient-to-r from-purple-700 to-purple-600 
                             hover:from-purple-400 hover:to-purple-700 
                             text-white font-semibold 
                             py-1.5 sm:py-2 md:py-3 
                             px-2 sm:px-3 md:px-4 
                             rounded-lg sm:rounded-xl 
                             text-xs sm:text-sm md:text-base
                             transition-all duration-200 
                             hover:scale-105 active:scale-95 
                             shadow-lg hover:shadow-xl
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                             touch-manipulation
                             min-h-[32px] sm:min-h-[40px] md:min-h-[48px]"
                    disabled={deckCount < n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={resetDeck}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-400 hover:to-blue-700 
                          text-white font-semibold 
                          py-1.5 sm:py-2 md:py-3 
                          px-4 sm:px-6 md:px-8 
                          rounded-lg sm:rounded-xl 
                          text-xs sm:text-sm md:text-base
                          transition-all duration-200 
                          hover:scale-105 active:scale-95 
                          shadow-lg hover:shadow-xl
                          flex items-center gap-1 sm:gap-2 
                          touch-manipulation
                          min-h-[32px] sm:min-h-[40px] md:min-h-[48px]"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Reset Deck</span>
                <span className="sm:hidden">Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}