import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from PIL import Image, ExifTags
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
    
    def corregir_orientacion_exif(self, imagen: Image.Image) -> Image.Image:
        """
        Corrige la orientación de la imagen según la etiqueta EXIF Orientation, si existe.
        """
        try:
            exif = imagen._getexif()
            if exif is not None:
                for tag, value in exif.items():
                    tag_name = ExifTags.TAGS.get(tag, tag)
                    if tag_name == 'Orientation':
                        orientacion = value
                        if orientacion == 3:
                            imagen = imagen.rotate(180, expand=True)
                        elif orientacion == 6:
                            imagen = imagen.rotate(270, expand=True)
                        elif orientacion == 8:
                            imagen = imagen.rotate(90, expand=True)
                        break
        except Exception:
            pass  # Si no hay EXIF o no se puede leer, no hacer nada
        return imagen
    
    def procesar_imagen(self, archivo: UploadFile, carpeta_destino: str, id_denuncia: int) -> Tuple[str, datetime]:
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
        ruta_relativa = f"/fotos/denuncia_{id_denuncia}/{nombre_final}"
        
        # Leer y procesar imagen
        imagen = Image.open(archivo.file)
        
        # Corregir orientación según EXIF antes de cualquier procesamiento
        imagen = self.corregir_orientacion_exif(imagen)
        
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
    
    def asociar_foto_a_evidencia(self, db: Session, id_denuncia: int, ruta_foto: str, timestamp_foto: datetime, descripcion: str) -> Optional[int]:
        """
        Asocia una foto a la evidencia más cercana en tiempo y guarda la descripción proporcionada por el usuario.
        """
        evidencias = db.query(Evidencia).filter(
            Evidencia.id_denuncia == id_denuncia
        ).all()
        if not evidencias:
            return None
        evidencia_cercana = None
        diferencia_minima = timedelta(hours=24)
        for evidencia in evidencias:
            timestamp_evidencia = datetime.combine(evidencia.fecha, evidencia.hora)
            diferencia = abs(timestamp_foto - timestamp_evidencia)
            if diferencia < diferencia_minima:
                diferencia_minima = diferencia
                evidencia_cercana = evidencia
        if evidencia_cercana:
            evidencia_cercana.foto_url = ruta_foto
            evidencia_cercana.descripcion = descripcion
            db.commit()
            return evidencia_cercana.id_evidencia
        return None

    def subir_fotos_denuncia(self, db: Session, id_denuncia: int, archivos: List[UploadFile], descripciones: List[str]) -> dict:
        """
        Sube múltiples fotos para una denuncia y las asocia a evidencias por timestamp y descripción del usuario
        """
        denuncia = db.query(Denuncia).filter(Denuncia.id_denuncia == id_denuncia).first()
        if not denuncia:
            raise HTTPException(status_code=404, detail="Denuncia no encontrada")
        evidencias = db.query(Evidencia).filter(Evidencia.id_denuncia == id_denuncia).count()
        if evidencias == 0:
            raise HTTPException(
                status_code=400, 
                detail="No hay evidencias GPS para esta denuncia. Debe subir el archivo GPX primero."
            )
        if len(archivos) != len(descripciones):
            raise HTTPException(status_code=400, detail="Debe enviar una descripción por cada foto.")
        carpeta_denuncia = self.crear_carpeta_denuncia(id_denuncia)
        resultados = {
            "fotos_procesadas": 0,
            "fotos_asociadas": 0,
            "errores": [],
            "detalles": []
        }
        for archivo, descripcion in zip(archivos, descripciones):
            try:
                if not self.validar_archivo(archivo):
                    resultados["errores"].append(f"Archivo inválido: {archivo.filename}")
                    continue
                ruta_foto, timestamp_foto = self.procesar_imagen(archivo, carpeta_denuncia, id_denuncia)
                resultados["fotos_procesadas"] += 1
                id_evidencia = self.asociar_foto_a_evidencia(db, id_denuncia, ruta_foto, timestamp_foto, descripcion)
                if id_evidencia:
                    resultados["fotos_asociadas"] += 1
                    resultados["detalles"].append({
                        "archivo": archivo.filename,
                        "evidencia_id": id_evidencia,
                        "timestamp_foto": timestamp_foto.isoformat(),
                        "ruta": ruta_foto,
                        "descripcion": descripcion
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