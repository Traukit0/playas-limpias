"use client"

import { useEffect, useRef } from "react"

interface AnalysisMapProps {
  sectorName: string
  waypoints: number
  photos: number
  isAnalyzing: boolean
  analysisComplete: boolean
}

export function AnalysisMap({ sectorName, waypoints, photos, isAnalyzing, analysisComplete }: AnalysisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      if (mapRef.current) {
        const canvas = document.createElement("canvas")
        canvas.width = mapRef.current.clientWidth
        canvas.height = 400
        mapRef.current.appendChild(canvas)

        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Limpiar canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Dibujar fondo del mapa
          ctx.fillStyle = "#e6f2ff"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Dibujar costa
          ctx.fillStyle = "#f2f2f2"
          ctx.beginPath()
          ctx.moveTo(0, 80)
          ctx.bezierCurveTo(canvas.width * 0.2, 50, canvas.width * 0.4, 120, canvas.width * 0.6, 70)
          ctx.bezierCurveTo(canvas.width * 0.8, 30, canvas.width, 90, canvas.width, 50)
          ctx.lineTo(canvas.width, 0)
          ctx.lineTo(0, 0)
          ctx.closePath()
          ctx.fill()

          // Dibujar agua
          ctx.fillStyle = "#b3d9ff"
          ctx.fillRect(0, 80, canvas.width, canvas.height - 80)

          if (analysisComplete) {
            // Dibujar waypoints
            const points = Array.from({ length: waypoints }, (_, i) => ({
              x: (canvas.width / (waypoints + 1)) * (i + 1),
              y: 100 + Math.random() * 200,
            }))

            points.forEach((point, index) => {
              // Círculo exterior
              ctx.fillStyle = "rgba(34, 197, 94, 0.3)"
              ctx.beginPath()
              ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
              ctx.fill()

              // Círculo interior
              ctx.fillStyle = "#22c55e"
              ctx.beginPath()
              ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
              ctx.fill()

              // Número del waypoint
              ctx.fillStyle = "white"
              ctx.font = "10px sans-serif"
              ctx.textAlign = "center"
              ctx.fillText((index + 1).toString(), point.x, point.y + 3)
            })

            // Dibujar track GPS
            ctx.strokeStyle = "#ef4444"
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y)
            }
            ctx.stroke()

            // Dibujar áreas de interés (anomalías)
            const anomalies = [
              { x: canvas.width * 0.3, y: 150 },
              { x: canvas.width * 0.7, y: 200 },
              { x: canvas.width * 0.5, y: 250 },
            ]

            anomalies.forEach((anomaly) => {
              ctx.fillStyle = "rgba(239, 68, 68, 0.2)"
              ctx.beginPath()
              ctx.arc(anomaly.x, anomaly.y, 25, 0, Math.PI * 2)
              ctx.fill()

              ctx.strokeStyle = "#ef4444"
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.arc(anomaly.x, anomaly.y, 25, 0, Math.PI * 2)
              ctx.stroke()
            })
          } else if (isAnalyzing) {
            // Mostrar indicador de carga
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.fillStyle = "white"
            ctx.font = "16px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText("Procesando datos...", canvas.width / 2, canvas.height / 2)
          }

          // Agregar título del sector
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
          ctx.fillRect(10, 10, 200, 30)
          ctx.fillStyle = "#1f2937"
          ctx.font = "14px sans-serif"
          ctx.textAlign = "left"
          ctx.fillText(sectorName, 15, 30)
        }
      }
    } catch (error) {
      console.error("Error al renderizar el mapa de análisis:", error)
    }

    return () => {
      if (mapRef.current) {
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild)
        }
      }
    }
  }, [sectorName, waypoints, photos, isAnalyzing, analysisComplete])

  return <div ref={mapRef} className="h-[400px] w-full rounded-md bg-muted"></div>
}
