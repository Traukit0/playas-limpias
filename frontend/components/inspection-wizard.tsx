"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

import { StepOne } from "@/components/wizard-steps/step-one"
import { StepTwo } from "@/components/wizard-steps/step-two"
import { StepThree } from "@/components/wizard-steps/step-three"
import { StepFour } from "@/components/wizard-steps/step-four"
import { StepFive } from "@/components/wizard-steps/step-five"

export interface InspectionData {
  sectorName: string
  inspectionDate: string
  inspector: string
  observations: string
  gpxFile: File | null
  photos: File[]
  analysisComplete: boolean
}

const steps = [
  { id: 1, title: "Información General", description: "Datos básicos de la inspección" },
  { id: 2, title: "Waypoints GPS", description: "Cargar archivo GPX" },
  { id: 3, title: "Fotografías", description: "Subir imágenes de la inspección" },
  { id: 4, title: "Análisis", description: "Revisar datos en mapa" },
  { id: 5, title: "Resultados", description: "Descargar archivos finales" },
]

export function InspectionWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [inspectionData, setInspectionData] = useState<InspectionData>({
    sectorName: "",
    inspectionDate: "",
    inspector: "",
    observations: "",
    gpxFile: null,
    photos: [],
    analysisComplete: false,
  })

  const updateInspectionData = (data: Partial<InspectionData>) => {
    setInspectionData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = (currentStep / steps.length) * 100

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne data={inspectionData} updateData={updateInspectionData} onNext={nextStep} />
      case 2:
        return <StepTwo data={inspectionData} updateData={updateInspectionData} onNext={nextStep} onPrev={prevStep} />
      case 3:
        return <StepThree data={inspectionData} updateData={updateInspectionData} onNext={nextStep} onPrev={prevStep} />
      case 4:
        return <StepFour data={inspectionData} updateData={updateInspectionData} onNext={nextStep} onPrev={prevStep} />
      case 5:
        return <StepFive data={inspectionData} onPrev={prevStep} />
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Paso {currentStep} de {steps.length}
              </CardTitle>
              <CardDescription>{steps[currentStep - 1]?.title}</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {Math.round(progress)}% Completado
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                    step.id < currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : step.id === currentStep
                        ? "border-primary text-primary"
                        : "border-muted-foreground/25 text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStep()}
    </div>
  )
}
