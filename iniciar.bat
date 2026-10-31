@echo off
title Gestao Marcenaria
chcp 65001 > nul
echo ========================================================
echo        Iniciando Sistema de Gestao de Marcenaria
echo ========================================================
echo.
echo Iniciando aplicacao em segundo plano...
echo O navegador abrira automaticamente em http://localhost:8085
echo.

cd /d "%~dp0dist-app\GestaoMarcenaria"
start "" "GestaoMarcenaria.exe"

exit
