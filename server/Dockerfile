# Use official Node.js image
FROM node:20

# Create app directory inside container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose backend port
EXPOSE 1000

# Start app
CMD ["npm", "start"]