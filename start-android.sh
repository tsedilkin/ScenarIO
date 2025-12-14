#!/data/data/com.termux/files/usr/bin/sh

# Скрипт запуска для Android (Termux)
# Использование: ./start-android.sh

echo "🚀 Запускаем ScenarIO на Android..."

# Проверка наличия node_modules
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "⚠️  Зависимости не установлены. Запускаем установку..."
    echo ""
    ./setup-android.sh
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка при установке зависимостей"
        exit 1
    fi
    echo ""
fi

# Получение IP-адреса
echo "📡 IP-адрес Android TV:"
ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1
echo ""

echo "▶️  Запускаем сервер..."
echo "💡 Игра будет доступна по адресу: http://IP_АДРЕС:3000"
echo ""

npm run server

