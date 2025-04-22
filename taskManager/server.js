// Backend simples em Node.js/Express para o Kanban
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3001;

const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir arquivos estáticos

// Logger simples
function logger(req, res, next) {
    console.log(`[server.js] - ${req.method} - ${req.url}`);
    next();
}
app.use(logger);

// GET tasks
app.get('/api/tasks', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('[server.js] - Erro ao ler data.json', err);
            return res.status(500).json([]);
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json([]);
        }
    });
});

// POST tasks
app.post('/api/tasks', (req, res) => {
    const tasks = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), err => {
        if (err) {
            console.error('[server.js] - Erro ao salvar data.json', err);
            return res.status(500).json({ error: 'Erro ao salvar' });
        }
        res.json({ ok: true });
    });
});

app.listen(PORT, () => {
    console.log(`[server.js] - Servidor rodando em http://localhost:${PORT}`);
});
