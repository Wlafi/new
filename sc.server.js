const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
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
    password: { type: String, required: true } // Пароль пока без хеширования
});

// Создаём модель
const User = mongoose.model("User", userSchema);

// **Простой тестовый маршрут GET `/register`**
app.get("/register", (req, res) => {
    res.json({ message: "✅ GET /register работает!" });
});

// **POST-запрос для регистрации (пока без БД)**
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Проверяем, существует ли пользователь с таким email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Пользователь уже существует" });
        }

        // Создаём нового пользователя
        const newUser = new User({ username, email, password });
        await newUser.save();

        res.json({ message: "✅ Регистрация успешна!" });
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});
app.get("/test-db", async (req, res) => {
    try {
        const users = await User.find();
        res.json({ message: "✅ Подключение к MongoDB успешно!", users });
    } catch (error) {
        res.status(500).json({ error: "❌ Ошибка подключения к базе данных" });
    }
});
app.post('/test-db', async (req, res) => {
    try {
      // Создаём тестовую модель
      const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
  
      // Создаём новый документ
      const testDoc = new TestModel({ name: "Тестовое подключение" });
      await testDoc.save();
  
      res.json({ success: true, message: "Данные успешно записаны в базу!" });
    } catch (error) {
      console.error("Ошибка при записи в базу:", error);
      res.status(500).json({ error: "Ошибка при записи в базу данных", details: error.message });
    }
  });
  (async () => {
    const users = await User.find();
    console.log("📌 Список пользователей:", users);
})();
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Ищем пользователя по email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Пользователь не найден" });
        }

        // Проверяем пароль (пока без хеширования)
        if (user.password !== password) {
            return res.status(400).json({ error: "Неверный пароль" });
        }

        res.json({ message: "✅ Вход успешен!" });
    } catch (error) {
        console.error("Ошибка входа:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});
app.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "username email"); // Берём только имя и email
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении пользователей" });
    }
});


// Запуск сервера
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
