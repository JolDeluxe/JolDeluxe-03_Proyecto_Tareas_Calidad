# --- Etapa 1: Construcción (Build) ---
# Le ponemos un "apodo" (builder) a esta etapa
FROM node:20-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copia package.json e instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código fuente y construye la app
COPY . .
RUN npm run build

# --- Etapa 2: Servidor (Serve) ---
# Empezamos desde una imagen de Nginx limpia y ligera
FROM nginx:alpine

# Copia los archivos estáticos construidos en la Etapa 1
# La carpeta 'dist' de Vite se copia al directorio raíz de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia tu configuración personalizada de Nginx
# (La crearemos a continuación)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80 (el puerto por defecto de Nginx)
EXPOSE 80