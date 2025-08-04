# 1. Aşama: Uygulamayı derle (Build Stage)
# Node.js LTS (uzun süreli destek) imajını kullanarak proje kaynak kodunu derle.
FROM node:lts-alpine AS builder

# Konteyner içinde çalışma dizinini ayarla.
WORKDIR /app

# Sadece 'package.json' ve 'package-lock.json' dosyalarını kopyala.
# Bu, bağımlılıklar değişmediği sürece 'npm install' adımının önbellekten çalışmasını sağlar ve build süresini kısaltır.
COPY package*.json ./

# Proje bağımlılıklarını yükle.
RUN npm install

# Kalan tüm uygulama dosyalarını çalışma dizinine kopyala.
COPY . .

# Vue projesini üretim için derle.
# Bu komut 'dist' adında bir klasör oluşturur.
RUN npm run build

# 2. Aşama: Uygulamayı NGINX ile çalıştır (Runtime Stage)
# Derlenen statik dosyaları sunmak için çok daha hafif bir NGINX imajı kullan.
FROM nginx:stable-alpine

# NGINX'in varsayılan yapılandırma dosyasını sil.
RUN rm /etc/nginx/conf.d/default.conf

# Kendi özel NGINX yapılandırma dosyamızı kopyala.
# Bu dosya, Vue Router gibi SPA'ler için gereklidir.
COPY nginx.conf /etc/nginx/conf.d/

# İlk aşamada oluşturulan derlenmiş dosyaları (dist klasörü) NGINX'in sunacağı dizine kopyala.
COPY --from=builder /app/dist /usr/share/nginx/html

# 80 numaralı portu dışarıya aç.
EXPOSE 80

# NGINX'i arka planda değil, ön planda çalıştır. Bu, konteynerin ayakta kalmasını sağlar.
CMD ["nginx", "-g", "daemon off;"]
