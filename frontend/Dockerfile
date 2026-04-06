# Stage 1: Build the React application
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (use npm ci for clean install if package-lock exists)
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Vite application for production
RUN npm run build

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

# Copy the NGINX configuration file we created
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the previous stage to NGINX HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
