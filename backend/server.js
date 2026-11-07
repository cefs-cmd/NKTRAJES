const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "nk_trajes_super_secret_key";

const pool = mysql.createPool({
    host: 'localhost', user: 'root', password: '', database: 'nk_trajes'
});

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Acesso Negado." });
    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token Inválido." });
        req.user = user;
        next();
    });
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'func1' && password === '1234') {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '8h' });
        return res.json({ token });
    }
    return res.status(401).json({ error: "Credenciais inválidas!" });
});

// CLIENTES
app.get('/api/clients', authenticateToken, async (req, res) => {
    const search = req.query.search || '';
    const [rows] = await pool.query('SELECT * FROM clients WHERE name LIKE ?', [`%${search}%`]);
    res.json(rows);
});

app.post('/api/clients', authenticateToken, async (req, res) => {
    const { name, email, cpf, birth_date } = req.body;
    const age = new Date().getFullYear() - new Date(birth_date).getFullYear();
    if (age < 18) return res.status(400).json({ error: "Cliente deve ser maior de 18 anos." });

    try {
        await pool.query('INSERT INTO clients (name, email, cpf, birth_date) VALUES (?, ?, ?, ?)', 
        [name, email, cpf, birth_date]);
        res.status(201).json({ message: "Cliente cadastrado." });
    } catch (err) {
        return res.status(400).json({ error: "CPF ou E-mail já cadastrado." });
    }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: "Cliente removido." });
});

// PRODUTOS
app.get('/api/products', authenticateToken, async (req, res) => {
    const search = req.query.search || '';
    const [rows] = await pool.query('SELECT * FROM products WHERE name LIKE ?', [`%${search}%`]);
    res.json(rows);
});

app.post('/api/products', authenticateToken, async (req, res) => {
    const { name, image_url, size, stock, price, is_limited_drop } = req.body;
    if (size < 33 || size > 48) return res.status(400).json({ error: "Tamanho inválido (33 a 48)." });
    if (price <= 0) return res.status(400).json({ error: "Preço deve ser > 0." });
    if (stock < 0) return res.status(400).json({ error: "Estoque não pode ser negativo." });

    await pool.query('INSERT INTO products (name, image_url, size, stock, price, is_limited_drop) VALUES (?, ?, ?, ?, ?, ?)', 
    [name, image_url, size, stock, price, is_limited_drop || false]);
    res.status(201).json({ message: "Produto cadastrado." });
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: "Produto removido." });
});

app.listen(3000, () => console.log('Servidor NK TRAJES rodando na porta 3000'));