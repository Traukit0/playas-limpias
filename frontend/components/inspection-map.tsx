"use client"

import { useEffect, useRef } from "react"

export function InspectionMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      // Aquí se inicializaría el mapa con una biblioteca como Leaflet o Mapbox
      // Este es un placeholder para la visualización
      if (mapRef.current) {
        const canvas = document.createElement("canvas")
        canvas.width = mapRef.current.clientWidth
        canvas.height = 200
        mapRef.current.appendChild(canvas)

        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Dibujar un mapa simplificado
          ctx.fillStyle = "#e6f2ff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Dibujar costa
          ctx.fillStyle = "#f2f2f2"
          ctx.beginPath()
          ctx.moveTo(0, 50)
          ctx.bezierCurveTo(canvas.width * 0.2, 30, canvas.width * 0.4, 80, canvas.width * 0.6, 40)
          ctx.bezierCurveTo(canvas.width * 0.8, 20, canvas.width, 60, canvas.width, 30)
          ctx.lineTo(canvas.width, 0)
          ctx.lineTo(0, 0)
          ctx.closePath()
          ctx.fill()

          // Dibujar agua
          ctx.fillStyle = "#b3d9ff"
          ctx.fillRect(0, 50, canvas.width, canvas.height - 50)

          // Dibujar puntos de inspección
          const points = [
            { x: canvas.width * 0.2, y: 70 },
            { x: canvas.width * 0.5, y: 90 },
            { x: canvas.width * 0.7, y: 60 },
            { x: canvas.width * 0.9, y: 80 },
          ]

          points.forEach((point) => {
            // Círculo exterior
            ctx.fillStyle = "rgba(66, 133, 244, 0.3)"
            ctx.beginPath()
            ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
            ctx.fill()

            // Círculo interior
            ctx.fillStyle = "#4285F4"
            ctx.beginPath()
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
            ctx.fill()
          })

          // Dibujar track de GPS
          ctx.strokeStyle = "#FF5722"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
          }
          ctx.stroke()
        }
      }
    } catch (error) {
      console.error("Error al renderizar el mapa:", error)
      // Mostrar un mensaje de error o un mapa alternativo
      if (mapRef.current) {
        mapRef.current.innerHTML =
          '<div class="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No se pudo cargar el mapa</div>'
      }
    }

    return () => {
      if (mapRef.current) {
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild)
        }
      }
    }
  }, [])

  return <div ref={mapRef} className="h-[200px] w-full rounded-md bg-muted"></div>
}
