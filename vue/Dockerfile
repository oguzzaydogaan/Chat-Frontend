# 1. Aşama: Uygulamayı derle (Build Stage)
FROM node:lts-alpine AS builder

# Konteyner içinde çalışma dizinini ayarla.
WORKDIR /app

# Sadece 'package.json' ve 'package-lock.json' dosyalarını kopyala.
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Aşama: Uygulamayı NGINX ile çalıştır (Runtime Stage)
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

# NGINX konfigürasyon dosyamızı kopyala.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Önceki aşamadan derlenmiş dosyaları kopyala.
COPY --from=builder /app/dist /usr/share/nginx/html

# ÖNEMLİ DEĞİŞİKLİK: 80 yerine 8080 portunu aç
EXPOSE 8080

# NGINX'i arka planda değil, ön planda çalıştır.
CMD ["nginx", "-g", "daemon off;"]
