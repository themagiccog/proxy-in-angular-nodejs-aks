# Use an official Node.js runtime as the build environment
FROM node:20 as build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
#RUN npm install #npm ci
RUN npm install --clean-install


# Copy the rest of the Angular application code
COPY . .

# Build the Angular application
RUN npm run build --prod
#RUN npm run build --configuration=production

# Use an official NGINX image as the base for serving the Angular app
FROM nginx:alpine

# Use if custom
#COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy the NGINX custom server block configuration file (conf.d/default.conf) to the container
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Remove the default NGINX HTML files 
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular build output to NGINX's default HTML directory
COPY --from=build /usr/src/app/dist/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
