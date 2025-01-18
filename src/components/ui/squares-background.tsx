import { useRef, useEffect, useState } from "react"

interface SquaresProps {
  direction?: "right" | "left" | "up" | "down" | "diagonal"
  speed?: number
  borderColor?: string
  squareSize?: number
  hoverFillColor?: string
  className?: string
}

export function Squares({
  direction = "right",
  speed = 1,
  borderColor = "#333",
  squareSize = 40,
  hoverFillColor = "#222",
  className,
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const numSquaresX = useRef<number>()
  const numSquaresY = useRef<number>()
  const gridOffset = useRef({ x: 0, y: 0 })
  const [hoveredSquare, setHoveredSquare] = useState<{
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas background
    canvas.style.background = "#060606"

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      numSquaresX.current = Math.ceil(width / squareSize) + 1
      numSquaresY.current = Math.ceil(height / squareSize) + 1
    }

    // Initial resize
    resizeCanvas()

    // Add resize observer for more reliable size updates
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(canvas)

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      ctx.lineWidth = 0.5

      for (let x = startX; x < canvas.width / (window.devicePixelRatio || 1) + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height / (window.devicePixelRatio || 1) + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize)
          const squareY = y - (gridOffset.current.y % squareSize)

          if (
            hoveredSquare &&
            Math.floor((x - startX) / squareSize) === hoveredSquare.x &&
            Math.floor((y - startY) / squareSize) === hoveredSquare.y
          ) {
            ctx.fillStyle = hoverFillColor
            ctx.fillRect(squareX, squareY, squareSize, squareSize)
          }

          ctx.strokeStyle = borderColor
          ctx.strokeRect(squareX, squareY, squareSize, squareSize)
        }
      }

      const gradient = ctx.createRadialGradient(
        canvas.width / (2 * (window.devicePixelRatio || 1)),
        canvas.height / (2 * (window.devicePixelRatio || 1)),
        0,
        canvas.width / (2 * (window.devicePixelRatio || 1)),
        canvas.height / (2 * (window.devicePixelRatio || 1)),
        Math.sqrt(Math.pow(canvas.width / (window.devicePixelRatio || 1), 2) + Math.pow(canvas.height / (window.devicePixelRatio || 1), 2)) / 2,
      )
      gradient.addColorStop(0, "rgba(6, 6, 6, 0)")
      gradient.addColorStop(1, "#060606")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1))
    }

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.1)

      switch (direction) {
        case "right":
          gridOffset.current.x =
            (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          break
        case "left":
          gridOffset.current.x =
            (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize
          break
        case "up":
          gridOffset.current.y =
            (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize
          break
        case "down":
          gridOffset.current.y =
            (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal":
          gridOffset.current.x =
            (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y =
            (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
      }

      drawGrid()
      requestRef.current = requestAnimationFrame(updateAnimation)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      const hoveredSquareX = Math.floor(
        (mouseX + gridOffset.current.x - startX) / squareSize,
      )
      const hoveredSquareY = Math.floor(
        (mouseY + gridOffset.current.y - startY) / squareSize,
      )

      setHoveredSquare({ x: hoveredSquareX, y: hoveredSquareY })
    }

    const handleMouseLeave = () => {
      setHoveredSquare(null)
    }

    // Event listeners
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    // Initial setup
    requestRef.current = requestAnimationFrame(updateAnimation)

    // Cleanup
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      resizeObserver.unobserve(canvas)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [direction, speed, borderColor, hoverFillColor, hoveredSquare, squareSize])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full border-none block ${className}`}
    />
  )
}
