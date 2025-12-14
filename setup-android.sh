#!/data/data/com.termux/files/usr/bin/sh

# Скрипт установки для Android (Termux)
# Использование: ./setup-android.sh

echo "🚀 Начинаем установку ScenarIO на Android..."

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Node.js не найден. Устанавливаем..."
    pkg update && pkg upgrade -y
    pkg install nodejs -y
    
    if ! command -v node &> /dev/null; then
        echo "❌ Не удалось установить Node.js"
        echo "Попробуйте вручную: pkg install nodejs"
        exit 1
    fi
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js найден: $NODE_VERSION"

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm найден: $NPM_VERSION"
echo ""

# Установка зависимостей сервера
echo "📦 Устанавливаем зависимости сервера..."
if npm install; then
    echo "✓ Зависимости сервера установлены"
else
    echo "❌ Ошибка при установке зависимостей сервера"
    exit 1
fi

echo ""

# Установка зависимостей клиента
echo "📦 Устанавливаем зависимости клиента..."
if cd client && npm install; then
    echo "✓ Зависимости клиента установлены"
    cd ..
else
    echo "❌ Ошибка при установке зависимостей клиента"
    exit 1
fi

echo ""
echo "✅ Установка завершена успешно!"
echo ""
echo "💡 Для запуска сервера используйте:"
echo "   npm run server"
echo ""
echo "💡 Для запуска с клиентом (dev-режим):"
echo "   npm run dev"
echo ""
echo "📱 Узнать IP-адрес Android TV:"
echo "   ifconfig | grep inet"
echo ""

