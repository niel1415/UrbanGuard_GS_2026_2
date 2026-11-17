@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js/NPM nao encontrado. Instale Node.js 20.19.4+.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando dependencias na primeira execucao...
  call npm install
  if errorlevel 1 ( echo Falha na instalacao. & pause & exit /b 1 )
)
echo INICIANDO APP EXPO: Leia o QR Code no Expo Go compativel com SDK 54.
call npx expo start --lan
pause
