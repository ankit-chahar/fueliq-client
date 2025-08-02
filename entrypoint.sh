#!/bin/sh

# Entrypoint script for the client container
echo "Starting Petrol Pump Client..."

# Ensure Tailwind CSS is properly configured
echo "Checking Tailwind CSS configuration..."

# Check if tailwind.config.js exists
if [ ! -f "tailwind.config.js" ]; then
    echo "Creating default Tailwind config..."
    npx tailwindcss init -p
fi

# Verify all dependencies are installed
echo "Installing any missing dependencies..."
npm install

# Start the development server
echo "Starting React development server..."
exec npm start
