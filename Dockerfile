# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy configuration files first
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install app dependencies
RUN npm install

# Copy entrypoint script and make it executable
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Copy the rest of the application source code
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Use the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
