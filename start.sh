#!/bin/bash
echo "=========================================="
echo " Sanitation Co-Governance Platform"
echo " Starting both servers..."
echo "=========================================="

# Start Python AI backend
echo ""
echo "[1/2] Starting FastAPI AI backend on port 8000..."
cd agenticAI
python server.py &
FASTAPI_PID=$!
cd ..
sleep 3

# Start Next.js frontend
echo "[2/2] Starting Next.js frontend on port 3000..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "=========================================="
echo " Both servers started!"
echo ""
echo " Frontend:  http://localhost:3000"
echo " AI Backend: http://localhost:8000"
echo ""
echo " Press Ctrl+C to stop both servers"
echo "=========================================="

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $FASTAPI_PID $NEXTJS_PID 2>/dev/null; exit 0" INT TERM
wait
