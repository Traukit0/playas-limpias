import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from PIL import Image
import exifread
from models.evidencias import Evidencia
from models.denuncias import Denuncia

class FotoService:
    def __init__(self):
        self.base_fotos_path = "fotos"
        self.allowed_extensions = {'.jpg', '.jpeg', '.png'}
        self.max_size = (1920, 1080)
        self.quality = 85  # Para JPEG
        
    def crear_carpeta_denuncia(self, id_denuncia: int) -> str:
        """Crea la carpeta para almacenar fotos de una denuncia específica"""
        carpeta = os.path.join(self.base_fotos_path, f"denuncia_{id_denuncia}")
        os.makedirs(carpeta, exist_ok=True)
        return carpeta
    
    def validar_archivo(self, archivo: UploadFile) -> bool:
        """Valida que el archivo sea una imagen válida"""
        if not archivo.filename:
            return False
            
        # Verificar extensión
        nombre, extension = os.path.splitext(archivo.filename.lower())
        if extension not in self.allowed_extensions:
            return False
            
        # Verificar tipo MIME
        if not archivo.content_type or not archivo.content_type.startswith('image/'):
            return False
            
        return True
    
    def procesar_imagen(self, archivo: UploadFile, carpeta_destino: str) -> Tuple[str, datetime]:
        """
        Procesa una imagen: la comprime, guarda y extrae timestamp EXIF
        Retorna: (ruta_relativa, timestamp_foto)
        """
        # Generar nombre único
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_original = os.path.splitext(archivo.filename)[0]
        extension = os.path.splitext(archivo.filename)[1].lower()
        
        # Si es JPEG, mantener extensión .jpg
        if extension in ['.jpeg', '.jpg']:
            extension = '.jpg'
        
        nombre_final = f"{nombre_original}_{timestamp}{extension}"
        ruta_completa = os.path.join(carpeta_destino, nombre_final)
        ruta_relativa = f"/fotos/denuncia_{os.path.basename(carpeta_destino)}/{nombre_final}"
        
        # Leer y procesar imagen
        imagen = Image.open(archivo.file)
        
        # Convertir a RGB si es necesario
        if imagen.mode in ('RGBA', 'LA', 'P'):
            imagen = imagen.convert('RGB')
        
        # Redimensionar si es necesario
        if imagen.size[0] > self.max_size[0] or imagen.size[1] > self.max_size[1]:
            imagen.thumbnail(self.max_size, Image.Resampling.LANCZOS)
        
        # Guardar imagen procesada
        if extension == '.jpg':
            imagen.save(ruta_completa, 'JPEG', quality=self.quality, optimize=True)
        else:
            imagen.save(ruta_completa, 'PNG', optimize=True)
        
        # Extraer timestamp EXIF
        archivo.file.seek(0)  # Resetear posición del archivo
        timestamp_foto = self.extraer_timestamp_exif(archivo)
        
        return ruta_relativa, timestamp_foto
    
    def extraer_timestamp_exif(self, archivo: UploadFile) -> datetime:
        """
        Extrae el timestamp de los metadatos EXIF de la foto
        Si no encuentra EXIF, retorna timestamp actual
        """
        try:
            archivo.file.seek(0)
            tags = exifread.process_file(archivo.file, details=False)
            
            # Buscar DateTimeOriginal primero, luego DateTime
            if 'EXIF DateTimeOriginal' in tags:
                fecha_str = str(tags['EXIF DateTimeOriginal'])
            elif 'Image DateTime' in tags:
                fecha_str = str(tags['Image DateTime'])
            else:
                return datetime.now()
            
            # Parsear fecha EXIF (formato: YYYY:MM:DD HH:MM:SS)
            try:
                return datetime.strptime(fecha_str, '%Y:%m:%d %H:%M:%S')
            except ValueError:
                return datetime.now()
                
        except Exception as e:
            print(f"Error al extraer EXIF: {e}")
            return datetime.now()
    
    def asociar_foto_a_evidencia(self, db: Session, id_denuncia: int, ruta_foto: str, 
                                timestamp_foto: datetime) -> Optional[int]:
        """
        Asocia una foto a la evidencia más cercana en tiempo
        Retorna el id_evidencia si encuentra coincidencia, None si no
        """
        # Buscar evidencias de la denuncia
        evidencias = db.query(Evidencia).filter(
            Evidencia.id_denuncia == id_denuncia
        ).all()
        
        if not evidencias:
            return None
        
        # Encontrar la evidencia más cercana en tiempo
        evidencia_cercana = None
        diferencia_minima = timedelta(hours=24)  # Tolerancia de 24 horas
        
        for evidencia in evidencias:
            # Combinar fecha y hora de la evidencia
            timestamp_evidencia = datetime.combine(evidencia.fecha, evidencia.hora)
            
            # Calcular diferencia absoluta
            diferencia = abs(timestamp_foto - timestamp_evidencia)
            
            if diferencia < diferencia_minima:
                diferencia_minima = diferencia
                evidencia_cercana = evidencia
        
        if evidencia_cercana:
            # Actualizar la evidencia con la foto
            evidencia_cercana.foto_url = ruta_foto
            evidencia_cercana.descripcion = f"Foto asociada por timestamp: {timestamp_foto.strftime('%Y-%m-%d %H:%M:%S')}"
            db.commit()
            return evidencia_cercana.id_evidencia
        
        return None
    
    def subir_fotos_denuncia(self, db: Session, id_denuncia: int, 
                           archivos: List[UploadFile]) -> dict:
        """
        Sube múltiples fotos para una denuncia y las asocia a evidencias por timestamp
        """
        # Verificar que la denuncia existe
        denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == id_denuncia).first()
        if not denuncia:
            raise HTTPException(status_code=404, detail="Denuncia no encontrada")
        
        # Verificar que hay evidencias (GPX ya procesado)
        evidencias = db.query(Evidencia).filter(Evidencia.id_denuncia == id_denuncia).count()
        if evidencias == 0:
            raise HTTPException(
                status_code=400, 
                detail="No hay evidencias GPS para esta denuncia. Debe subir el archivo GPX primero."
            )
        
        # Crear carpeta para la denuncia
        carpeta_denuncia = self.crear_carpeta_denuncia(id_denuncia)
        
        resultados = {
            "fotos_procesadas": 0,
            "fotos_asociadas": 0,
            "errores": [],
            "detalles": []
        }
        
        for archivo in archivos:
            try:
                # Validar archivo
                if not self.validar_archivo(archivo):
                    resultados["errores"].append(f"Archivo inválido: {archivo.filename}")
                    continue
                
                # Procesar imagen
                ruta_foto, timestamp_foto = self.procesar_imagen(archivo, carpeta_denuncia)
                resultados["fotos_procesadas"] += 1
                
                # Asociar a evidencia
                id_evidencia = self.asociar_foto_a_evidencia(db, id_denuncia, ruta_foto, timestamp_foto)
                
                if id_evidencia:
                    resultados["fotos_asociadas"] += 1
                    resultados["detalles"].append({
                        "archivo": archivo.filename,
                        "evidencia_id": id_evidencia,
                        "timestamp_foto": timestamp_foto.isoformat(),
                        "ruta": ruta_foto
                    })
                else:
                    resultados["errores"].append(
                        f"No se pudo asociar {archivo.filename} a ninguna evidencia GPS"
                    )
                    
            except Exception as e:
                resultados["errores"].append(f"Error procesando {archivo.filename}: {str(e)}")
        
        return resultados
    
    def listar_fotos_denuncia(self, db: Session, id_denuncia: int) -> List[dict]:
        """
        Lista todas las fotos asociadas a una denuncia
        """
        evidencias_con_fotos = db.query(Evidencia).filter(
            Evidencia.id_denuncia == id_denuncia,
            Evidencia.foto_url.isnot(None)
        ).all()
        
        fotos = []
        for evidencia in evidencias_con_fotos:
            fotos.append({
                "id_evidencia": evidencia.id_evidencia,
                "foto_url": evidencia.foto_url,
                "descripcion": evidencia.descripcion,
                "fecha": evidencia.fecha,
                "hora": evidencia.hora,
                "coordenadas": {
                    "lat": db.execute(
                        text("SELECT ST_Y(coordenadas::geometry) FROM evidencias WHERE id_evidencia = :id"),
                        {"id": evidencia.id_evidencia}
                    ).scalar(),
                    "lon": db.execute(
                        text("SELECT ST_X(coordenadas::geometry) FROM evidencias WHERE id_evidencia = :id"),
                        {"id": evidencia.id_evidencia}
                    ).scalar()
                }
            })
        
        return fotos 