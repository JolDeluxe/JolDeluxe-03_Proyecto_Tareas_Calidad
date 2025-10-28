# Usa una imagen oficial de Node.js.
FROM node:18-alpine

# Establece el directorio de trabajo DENTRO del contenedor
WORKDIR /app

# Copia package.json para aprovechar el caché
COPY package*.json ./

# Instala todas las dependencias (necesitas typescript para compilar)
RUN npm install

# Copia el resto del código
# Copia el resto del código de tu backend
COPY . .

# 🚨 CORREGIDO: Ahora usamos npm run build
RUN npm run build

# (Importante para Prisma) Genera el cliente de Prisma
RUN npx prisma generate

# Expone el puerto 3000
EXPOSE 3000

# El comando para iniciar tu servidor de producción
CMD ["sh", "-c", "sleep 10 && npx prisma migrate deploy && npm start"]