# Stage 1: Build static React files
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Receive the build argument VITE_API_URL and make it available to the build script
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:1.25-alpine

# Overwrite default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
