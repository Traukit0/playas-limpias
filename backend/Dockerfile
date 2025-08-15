# Imagen base oficial de Python
FROM python:3.11-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY requirements.txt .

# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Establece la zona horaria
ENV TZ=America/Santiago

# Copia el resto del código fuente
COPY . .

# Expone el puerto por defecto de Uvicorn/FastAPI
EXPOSE 8000

# Comando para iniciar el servidor en modo desarrollo
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]