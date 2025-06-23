import React, { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { cardMap } from '../utils/cardList'
import { animateCardHover } from '../src/animations/hovercard'

const Card = forwardRef(({
  code,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  dealt = false,
}, ref) => {
  const meshRef = useRef()
  const [isHovered, setIsHovered] = useState(false)

  useImperativeHandle(ref, () => meshRef.current, [])

  const getCardSizeFromCSS = () => {
    const styles = getComputedStyle(document.documentElement)
    const width = parseFloat(styles.getPropertyValue('--card-width')) || 2.5
    const height = parseFloat(styles.getPropertyValue('--card-height')) || 4.5
    const thickness = parseFloat(styles.getPropertyValue('--card-thickness')) || 0.05

    return [width, height, thickness]
  }
  const [cardSize, setCardSize] = useState(getCardSizeFromCSS())
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        setCardSize(getCardSizeFromCSS())
      }, 10)
    }

    window.addEventListener('resize', handleResize)

    setCardSize(getCardSizeFromCSS())

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (meshRef.current && dealt) {
      meshRef.current.userData.originalY = position[1]
      meshRef.current.userData.originalZ = position[2]
    }
  }, [position, dealt])

  const frontUrl = cardMap[code]
  const backUrl = cardMap['CardBacks']
  const [frontTex, backTex] = useLoader(
    THREE.TextureLoader,
    [frontUrl, backUrl]
  )

  const materials = [
    new THREE.MeshStandardMaterial({ color: '#222' }),
    new THREE.MeshStandardMaterial({ color: '#222' }),
    new THREE.MeshStandardMaterial({ color: '#222' }),
    new THREE.MeshStandardMaterial({ color: '#222' }),
    new THREE.MeshStandardMaterial({ map: frontTex }),
    new THREE.MeshStandardMaterial({ map: backTex }),
  ]

  const handlePointerEnter = (e) => {
    if (!dealt) return // Only hover dealt cards
    e.stopPropagation()
    setIsHovered(true)
    animateCardHover(meshRef, true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerLeave = (e) => {
    if (!dealt) return
    e.stopPropagation()
    setIsHovered(false)
    animateCardHover(meshRef, false)
    document.body.style.cursor = 'default'
  }

  useEffect(() => {
    return () => {
      if (meshRef.current && dealt) {
        // Reset card to original state when component unmounts
        resetCardHover(meshRef)
      }
    }
  }, [dealt])

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      material={materials}
      castShadow
      receiveShadow
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <boxGeometry args={cardSize} />
    </mesh>
  )
})

export default Card