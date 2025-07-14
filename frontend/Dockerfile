# Utiliza una imagen oficial de Node.js
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instala pnpm globalmente
RUN npm install -g pnpm

# Instala las dependencias del proyecto
RUN pnpm install

# Copia el resto del código fuente
COPY . .

# Expone el puerto por defecto de Next.js
EXPOSE 3000

# Comando para iniciar el modo desarrollo
CMD ["pnpm", "dev"]