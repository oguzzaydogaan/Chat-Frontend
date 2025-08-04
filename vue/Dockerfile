# 1. Aşama: Uygulamayı derle (Build Stage)
# Node.js LTS (Uzun Süreli Destek) imajını temel alarak başlıyoruz.
FROM node:lts-alpine AS build

# Çalışma dizinini belirle
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala.
# Bu, sadece bağımlılıklar değiştiğinde 'npm install' adımının tekrar çalışmasını sağlar.
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Kalan tüm uygulama dosyalarını kopyala
COPY . .

# Vue projesini derle. Bu komut 'dist' klasörünü oluşturacaktır.
# Eğer 'npm run build' dışında farklı bir komut kullanıyorsanız, burayı güncelleyin.
RUN npm run build

# 2. Aşama: Uygulamayı çalıştırmak için NGINX'i kullan (Serve Stage)
# Çok daha küçük ve güvenli olan NGINX imajını temel alıyoruz.
FROM nginx:alpine

# NGINX'in varsayılan konfigürasyon dosyasını sil
RUN rm /etc/nginx/conf.d/default.conf

# Kendi NGINX konfigürasyon dosyamızı ekle.
# Projenin ana dizininde 'nginx.conf' adında bir dosya oluşturmanız gerekecek.
COPY nginx.conf /etc/nginx/conf.d/

# İlk aşamada oluşturulan 'dist' klasöründeki statik dosyaları NGINX'in sunacağı dizine kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# 80 numaralı portu dışarıya aç
EXPOSE 80

# NGINX'i çalıştır
CMD ["nginx", "-g", "daemon off;"]
