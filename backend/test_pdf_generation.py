#!/usr/bin/env python3
"""
Script de prueba para verificar la generación básica de PDFs
Ejecutar desde el directorio backend/
"""

import sys
import os
from datetime import datetime
from io import BytesIO

# Agregar el directorio backend al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pdf_generator import PDFGenerator

class MockAnalisis:
    def __init__(self):
        self.id_analisis = 123
        self.id_denuncia = 456
        self.fecha_analisis = datetime.now()
        self.distancia_buffer = 500
        self.metodo = "buffer_analysis"
        self.observaciones = "Prueba de generación de PDF desde script de test"

class MockDenuncia:
    def __init__(self):
        self.lugar = "Sector de Prueba - Playa Los Ejemplos"
        self.fecha_inspeccion = datetime.now()
        self.fecha_ingreso = datetime.now()
        self.id_usuario = 1
        self.id_estado = 1

class MockUsuario:
    def __init__(self):
        self.nombre = "Inspector de Prueba"
        self.email = "inspector@test.com"

class MockEvidencia:
    def __init__(self, id_ev, lat, lon):
        self.id_evidencia = id_ev
        self.fecha = "2024-01-15"
        self.hora = "14:30:00"
        self.coordenadas = {
            "type": "Point",
            "coordinates": [lon, lat]
        }
        self.descripcion = f"Evidencia de prueba #{id_ev}"
        self.foto_url = f"test_photo_{id_ev}.jpg" if id_ev % 2 == 0 else None

class MockConcesion:
    def __init__(self, id_conc, codigo):
        self.id_concesion = id_conc
        self.codigo_centro = codigo
        self.nombre = f"Centro Acuícola {codigo}"
        self.titular = f"Empresa Test {id_conc}"
        self.tipo = "Salmón Atlántico"
        self.region = "Los Lagos"

class MockResultado:
    def __init__(self, id_conc, valida=True):
        self.id_concesion = id_conc
        self.interseccion_valida = valida
        self.distancia_minima = 150.5 if valida else 750.2

async def test_pdf_generation():
    """Función principal de prueba"""
    try:
        print("🔄 Iniciando prueba de generación de PDF...")
        
        # Crear datos mock
        analisis = MockAnalisis()
        denuncia = MockDenuncia()
        usuario = MockUsuario()
        
        # Crear evidencias de prueba
        evidencias = [
            MockEvidencia(1, -41.4689, -72.9411),  # Puerto Montt
            MockEvidencia(2, -41.4700, -72.9400),
            MockEvidencia(3, -41.4680, -72.9420),
        ]
        
        # Crear concesiones de prueba
        concesiones = [
            MockConcesion(101, "CHI-001"),
            MockConcesion(102, "CHI-002"),
            MockConcesion(103, "CHI-003"),
        ]
        
        # Crear resultados de prueba
        resultados = [
            MockResultado(101, True),
            MockResultado(102, True),
            MockResultado(103, False),
        ]
        
        print(f"📊 Datos de prueba creados:")
        print(f"   - Análisis ID: {analisis.id_analisis}")
        print(f"   - Evidencias: {len(evidencias)}")
        print(f"   - Concesiones: {len(concesiones)}")
        print(f"   - Resultados: {len(resultados)}")
        
        # Generar PDF
        print("\n🔄 Generando PDF...")
        pdf_generator = PDFGenerator()
        pdf_bytes = await pdf_generator.generate_analysis_pdf(
            analisis=analisis,
            denuncia=denuncia,
            evidencias=evidencias,
            resultados=resultados,
            concesiones=concesiones,
            usuario=usuario,
            estado=None
        )
        
        # Verificar que se generó correctamente
        if pdf_bytes and len(pdf_bytes) > 0:
            print(f"✅ PDF generado exitosamente!")
            print(f"   - Tamaño: {len(pdf_bytes):,} bytes ({len(pdf_bytes)/1024:.1f} KB)")
            
            # Guardar archivo de prueba
            output_file = f"test_pdf_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            with open(output_file, 'wb') as f:
                f.write(pdf_bytes)
            
            print(f"   - Archivo guardado: {output_file}")
            print(f"   - Ubicación: {os.path.abspath(output_file)}")
            
            return True
        else:
            print("❌ Error: No se generaron bytes para el PDF")
            return False
            
    except Exception as e:
        print(f"❌ Error durante la prueba: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def verify_dependencies():
    """Verificar que las dependencias estén instaladas"""
    try:
        print("🔍 Verificando dependencias...")
        
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph
        print("   ✅ ReportLab instalado correctamente")
        
        from io import BytesIO
        print("   ✅ IO disponible")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Dependencia faltante: {e}")
        print("   💡 Ejecute: pip install -r requirements.txt")
        return False

async def main():
    """Función principal"""
    print("=" * 60)
    print("🧪 PRUEBA DE GENERACIÓN DE PDF - Sistema Playas Limpias")
    print("=" * 60)
    
    # Verificar dependencias
    if not verify_dependencies():
        return False
    
    print()
    
    # Ejecutar prueba
    result = await test_pdf_generation()
    
    print("\n" + "=" * 60)
    if result:
        print("🎉 PRUEBA COMPLETADA EXITOSAMENTE")
        print("💡 El PDF ha sido generado y guardado en el directorio actual")
        print("🔍 Abra el archivo PDF para verificar el contenido")
    else:
        print("💥 PRUEBA FALLIDA")
        print("🔧 Revise los logs de error arriba para más detalles")
    print("=" * 60)
    
    return result

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 