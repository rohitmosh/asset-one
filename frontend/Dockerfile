# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci

# Copy the rest of the frontend source
COPY . .

# Compile TypeScript and build production bundle
RUN npm run build

# Stage 2: Web Server stage
FROM nginx:1.25-alpine

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
