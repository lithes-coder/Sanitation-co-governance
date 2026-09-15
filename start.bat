@echo off
echo ==========================================
echo  Sanitation Co-Governance Platform
echo  Starting both servers...
echo ==========================================
echo.
echo [1/2] Starting FastAPI AI backend on port 8000...
start "AI Backend" cmd /c "cd agenticAI && python server.py"
timeout /t 3 /nobreak >/dev/null
echo [2/2] Starting Next.js frontend on port 3000...
start "Next.js Frontend" cmd /c "npm run dev"
echo.
echo ==========================================
echo  Both servers started!
echo.
echo  Frontend:   http://localhost:3000
echo  AI Backend: http://localhost:8000
echo ==========================================
pause
