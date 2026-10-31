@echo off
title Gerador de Instalador - FH Moveis
chcp 65001 > nul
echo ========================================================
echo       Compilador e Gerador de Instalador Windows
echo ========================================================
echo.

set /p VERSAO="Informe o numero da versao (ex: 1.0.2): "
if "%VERSAO%"=="" (
    echo [ERRO] Versao nao informada.
    pause
    exit /b 1
)

echo.
echo [1/4] Compilando Frontend (React + Vite)...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar frontend!
    pause
    exit /b 1
)

echo Copiando arquivos gerados para static do backend...
if not exist "%~dp0backend\src\main\resources\static" mkdir "%~dp0backend\src\main\resources\static"
xcopy "%~dp0frontend\dist\*" "%~dp0backend\src\main\resources\static\" /E /I /Y /Q >nul

echo.
echo [2/4] Compilando Backend com Maven (Java 21)...
cd /d "%~dp0backend"
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar backend!
    pause
    exit /b 1
)

echo.
echo [3/4] Empacotando com jpackage (executavel e runtime)...
cd /d "%~dp0"
if exist "dist-app\GestaoMarcenaria" rd /s /q "dist-app\GestaoMarcenaria"
if not exist "dist-app-input" mkdir "dist-app-input"
copy /y "backend\target\gestao-marcenaria-backend-*.jar" "dist-app-input\" >nul

for %%F in (dist-app-input\gestao-marcenaria-backend-*.jar) do set JAR_NAME=%%~nxF

"C:\Program Files\Java\jdk-21.0.12\bin\jpackage.exe" ^
  --type app-image ^
  --dest dist-app ^
  --name GestaoMarcenaria ^
  --input dist-app-input ^
  --main-jar "%JAR_NAME%" ^
  --main-class org.springframework.boot.loader.launch.JarLauncher ^
  --icon app.ico ^
  --app-version %VERSAO% ^
  --java-options "-Djpackage.app-version=%VERSAO%" ^
  --java-options "-Dfile.encoding=UTF-8"

rd /s /q "dist-app-input"

copy /y "fechar.bat" "dist-app\GestaoMarcenaria\" >nul
copy /y "Iniciar-Silencioso.vbs" "dist-app\GestaoMarcenaria\" >nul
copy /y "app.ico" "dist-app\GestaoMarcenaria\" >nul
if not exist "dist-app\GestaoMarcenaria\data" mkdir "dist-app\GestaoMarcenaria\data"
if exist "data\marcenaria.db" copy /y "data\marcenaria.db" "dist-app\GestaoMarcenaria\data\" >nul

echo.
echo [4/4] Gerando instalador com Inno Setup...
"C:\Users\User\AppData\Local\Programs\Inno Setup 6\iscc.exe" /DMyAppVersion=%VERSAO% setup.iss
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao executar Inno Setup!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo    [SUCESSO] Instalador v%VERSAO% gerado na pasta dist-installer/
echo ========================================================
echo.
pause
