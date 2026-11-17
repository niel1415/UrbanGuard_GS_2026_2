@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
where java >nul 2>nul
if errorlevel 1 (
  echo ERRO: JDK 21 nao encontrado. Instale/configure JAVA_HOME e PATH.
  pause
  exit /b 1
)
where mvn >nul 2>nul
if errorlevel 1 (
  echo ERRO: Maven nao encontrado. Instale Maven e configure PATH.
  pause
  exit /b 1
)
echo INICIANDO URBANGUARD API - http://localhost:8080/api/health
mvn spring-boot:run
pause
