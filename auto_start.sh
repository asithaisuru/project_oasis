#!/bin/bash

# ================================================
# Auto Updating & Starting Frontend and Backend Servers
# ================================================

echo "==============================================="
echo "  Pulling latest code from GitHub repository..."
echo "==============================================="

git pull origin main
if [ $? -ne 0 ]; then
    echo
    echo "❌ Failed to pull latest code. Check your internet connection or repo access."
    read -p "Press Enter to exit..."
    exit 1
fi

echo
echo "==============================================="
echo "  Installing dependencies for Frontend..."
echo "==============================================="
cd frontend || { echo "❌ Frontend folder not found."; exit 1; }

npm install
if [ $? -ne 0 ]; then
    echo
    echo "❌ Frontend dependencies installation failed."
    read -p "Press Enter to exit..."
    exit 1
fi
cd ..

echo
echo "==============================================="
echo "  Installing dependencies for Backend..."
echo "==============================================="
cd backend || { echo "❌ Backend folder not found."; exit 1; }

npm install
if [ $? -ne 0 ]; then
    echo
    echo "❌ Backend dependencies installation failed."
    read -p "Press Enter to exit..."
    exit 1
fi
cd ..

echo
echo "==============================================="
echo "  Starting Frontend and Backend Servers..."
echo "==============================================="

# Start frontend in background terminal
gnome-terminal --title="Frontend Server" -- bash -c "cd frontend && npm run dev; exec bash"

# Start backend in background terminal
gnome-terminal --title="Backend Server" -- bash -c "cd backend && npm run dev; exec bash"

# Wait a few seconds for servers to boot
sleep 5

# Open frontend in default browser
xdg-open "http://localhost:5173" >/dev/null 2>&1 &

echo
echo "✅ Servers started successfully."
read -p "Press Enter to exit..."
