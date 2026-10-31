@echo off
title Encerrar Gestao Marcenaria
chcp 65001 > nul
echo ========================================================
echo        Encerrando Sistema de Gestao de Marcenaria
echo ========================================================
echo.
taskkill /F /IM GestaoMarcenaria.exe >nul 2>&1
echo [OK] Sistema e servidor local encerrados com sucesso!
echo.
timeout /t 2 >nul
