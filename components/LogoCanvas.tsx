'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function LogoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const frameIdRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const logoSize = Math.max(32, container.clientWidth || 36)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.z = 2.4
    
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power'
    })
    renderer.setSize(logoSize, logoSize)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const group = new THREE.Group()
    scene.add(group)
    groupRef.current = group

    const coreGeometry = new THREE.IcosahedronGeometry(0.48, 1)
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd7b47f,
      emissive: 0xa57f3d,
      emissiveIntensity: 0.22,
      metalness: 0.72,
      roughness: 0.28,
      clearcoat: 0.85,
      clearcoatRoughness: 0.2,
    })
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial)
    group.add(coreMesh)

    const ringGeometry = new THREE.TorusGeometry(0.8, 0.05, 24, 72)
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2ddbd,
      emissive: 0x9b7a47,
      emissiveIntensity: 0.12,
      metalness: 0.62,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI * 0.35
    ring.rotation.y = Math.PI * 0.2
    group.add(ring)

    const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16)
    const nodeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8e7cb,
      emissive: 0xc79a55,
      emissiveIntensity: 0.35,
      metalness: 0.25,
      roughness: 0.35,
    })

    const nodePositions = [
      new THREE.Vector3(0.96, 0.12, 0.2),
      new THREE.Vector3(-0.3, 0.88, -0.18),
      new THREE.Vector3(-0.78, -0.46, 0.24),
    ]
    const baseNodePositions = nodePositions.map((position) => position.clone())

    const nodes = nodePositions.map((position) => {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
      node.position.copy(position)
      group.add(node)
      return node
    })

    const connectorGeometry = new THREE.CylinderGeometry(0.022, 0.022, 1, 8)
    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: 0xd7b47f,
      emissive: 0x7d6438,
      emissiveIntensity: 0.16,
      metalness: 0.48,
      roughness: 0.44,
    })

    const connectors = nodePositions.map((position) => {
      const direction = position.clone().normalize()
      const length = position.length()
      const connector = new THREE.Mesh(connectorGeometry, connectorMaterial)
      connector.position.copy(position.clone().multiplyScalar(0.5))
      connector.scale.y = length
      connector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
      group.add(connector)
      return connector
    })

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xd7b47f, 4.2)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const fillLight = new THREE.PointLight(0xf2ddbd, 1.4)
    fillLight.position.set(-4, -3, 3)
    scene.add(fillLight)

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      if (group) {
        coreMesh.rotation.y += 0.008
        coreMesh.rotation.x += 0.004
        ring.rotation.z += 0.006

        const targetTiltX = mouseRef.current.y * 0.45
        const targetTiltY = mouseRef.current.x * 0.45
        
        group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetTiltX, 0.05)
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetTiltY, 0.05)

        const time = Date.now() * 0.002
        coreMaterial.emissiveIntensity = 0.2 + Math.sin(time) * 0.07
        nodeMaterial.emissiveIntensity = 0.3 + Math.sin(time * 1.25) * 0.1

        nodes.forEach((node, index) => {
          const wobble = Math.sin(time + index * 1.5) * 0.03
         const basePos = baseNodePositions[index];
if (basePos) {
  node.position.copy(basePos).multiplyScalar(1 + wobble);
}
        })

        connectors.forEach((connector, index) => {
          connector.scale.x = 1 + Math.sin(time + index) * 0.01
        })
      }

      renderer.render(scene, camera)
      frameIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
      
      if (rendererRef.current && container) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement)
        }
        rendererRef.current.dispose()
      }
      
      coreGeometry.dispose()
      coreMaterial.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      nodeGeometry.dispose()
      nodeMaterial.dispose()
      connectorGeometry.dispose()
      connectorMaterial.dispose()
      scene.clear()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ filter: 'drop-shadow(0 0 6px rgba(215, 180, 127, 0.45))' }}
    />
  )
}
