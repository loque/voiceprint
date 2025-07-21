
# Use the latest LTS version of Node.js
FROM node:lts

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package.json .
COPY package-lock.json .

# Install dependencies
RUN npm install --production=false

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Expose the port Vite uses by default
EXPOSE 5173

# Start the app in preview mode with host 0.0.0.0
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
