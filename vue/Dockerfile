# Node.js imajını temel al
FROM node:lts-alpine AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Kaynak kodunu kopyala
COPY . .

# Uygulamayı inşa et
RUN npm run build

# İkinci aşama: statik dosyaları sunmak için nginx kullan
FROM nginx:stable-alpine

# Önceki aşamadan build edilmiş dosyaları kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx yapılandırma dosyasını kopyala (isteğe bağlı)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx'i başlat
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]