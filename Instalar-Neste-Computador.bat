@echo off
title Instalador - FH Moveis Planejados v1.0.1
chcp 65001 > nul
echo ========================================================
echo     Instalador do Sistema FH Moveis Planejados v1.0.1
echo ========================================================
echo.
echo Este assistente instalara o sistema neste computador.
echo Destino padrao: C:\GestaoMarcenaria
echo.

set "DESTINO=C:\GestaoMarcenaria"
set "ORIGEM=%~dp0dist-app\GestaoMarcenaria"

if not exist "%ORIGEM%\GestaoMarcenaria.exe" (
    echo [ERRO] Pasta de distribuicao nao encontrada em:
    echo %ORIGEM%
    echo Verifique se os arquivos estao na mesma pasta do instalador.
    pause
    exit /b 1
)

echo [1/3] Copiando arquivos do sistema para %DESTINO%...
if not exist "%DESTINO%" mkdir "%DESTINO%"
xcopy "%ORIGEM%\*" "%DESTINO%\" /E /I /Y /Q >nul

echo [2/3] Copiando icone do sistema...
if exist "%~dp0app.ico" copy /y "%~dp0app.ico" "%DESTINO%\app.ico" >nul

echo [3/3] Criando atalho na Area de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -comObject WScript.Shell; " ^
  "$Desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$Shortcut = $WshShell.CreateShortcut(\"$Desktop\FH Moveis - Gestao.lnk\"); " ^
  "$Shortcut.TargetPath = 'wscript.exe'; " ^
  "$Shortcut.Arguments = '\"%DESTINO%\Iniciar-Silencioso.vbs\"'; " ^
  "$Shortcut.WorkingDirectory = '%DESTINO%'; " ^
  "if (Test-Path '%DESTINO%\app.ico') { $Shortcut.IconLocation = '%DESTINO%\app.ico'; } " ^
  "$Shortcut.Description = 'Sistema de Gestao Operacional e Orcamentos - FH Moveis'; " ^
  "$Shortcut.Save()"

echo.
echo ========================================================
echo         [SUCESSO] Instalacao Concluida!
echo ========================================================
echo.
echo O atalho 'FH Moveis - Gestao' foi criado na sua Area de Trabalho.
echo Para abrir o sistema, basta dar 2 cliques no atalho.
echo.
pause
