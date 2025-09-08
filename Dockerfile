# Base image with Node.js
FROM node:18-slim

# Set working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json into /app
COPY package*.json ./

# Install project dependencies inside
RUN npm install

# Copy all project files into /app
COPY . .

# Build project
RUN npm run build

# Expose your app port (change if different)
EXPOSE 3000

# Start the app with PM2 from /app/server
CMD ["npm","start"]