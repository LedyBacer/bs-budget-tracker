# Используем node как базовый образ
FROM node:22-alpine as build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем все файлы проекта
COPY . .

# Собираем приложение
RUN npm run build:ignore-errors

# Используем nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранное приложение в директорию nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"] 