const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect("mongodb+srv://user1:AGtv10sRCCiu5qUp@cluster0.7419l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("✅ Успешное подключение к базе данных"))
    .catch(err => console.error("❌ Ошибка подключения:", err));

// Проверка работы сервера
app.get("/", (req, res) => {
    res.send("🚀 Сервер работает!");
});

// Создаём схему пользователя
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Схема сообщений
const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// Регистрация
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Пользователь уже существует" });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.json({ message: "✅ Регистрация успешна!" });
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Вход
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }
        res.json({ message: "✅ Вход успешен!" });
    } catch (error) {
        console.error("Ошибка входа:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Получение пользователей
app.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "username email");
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении пользователей" });
    }
});

// Чат через WebSocket
io.on("connection", (socket) => {
    console.log("🔌 Пользователь подключился:", socket.id);

    socket.on("sendMessage", async (data) => {
        const { sender, receiver, message } = data;
        const newMessage = new Message({ sender, receiver, message });
        await newMessage.save();
        io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("❌ Пользователь отключился:", socket.id);
    });
});

// Получение истории сообщений
app.get("/messages", async (req, res) => {
    try {
        const { sender, receiver } = req.query;
        const messages = await Message.find({
            $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ timestamp: 1 });
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении сообщений" });
    }
});

// Запуск сервера
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});