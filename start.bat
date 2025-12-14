@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 Запускаем ScenarIO...
echo.

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo ⚠️  Зависимости не установлены. Запускаем установку...
    echo.
    call setup.bat
    if %errorlevel% neq 0 (
        echo ❌ Ошибка при установке зависимостей
        exit /b 1
    )
    echo.
)

if not exist "client\node_modules" (
    echo ⚠️  Зависимости клиента не установлены. Запускаем установку...
    echo.
    call setup.bat
    if %errorlevel% neq 0 (
        echo ❌ Ошибка при установке зависимостей
        exit /b 1
    )
    echo.
)

echo ▶️  Запускаем сервер и клиент...
echo.
call npm run dev

