// logger para debug
const logger = {
    debug: (msg) => console.debug(`[Kanban] - ${msg}`)
};

// Alternância de tema claro/escuro
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    logger.debug(`toggleTheme - Tema alterado para ${next}`);
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// Task Model: { id, title, desc, status }

// Carregar tasks do backend
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Erro ao carregar tasks do backend');
        const data = await response.json();
        logger.debug('loadTasks - Dados carregados do backend');
        return data;
    } catch (e) {
        logger.debug(`loadTasks - Falha ao carregar do backend: ${e.message}`);
        const local = localStorage.getItem('kanbanTasks');
        if (local) {
            logger.debug('loadTasks - Carregando tasks do localStorage');
            return JSON.parse(local);
        }
        logger.debug('loadTasks - Nenhuma task encontrada, retornando array vazio');
        return [];
    }
}

// Salvar tasks no backend
async function saveTasks(tasks) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
        });
        if (!response.ok) throw new Error('Erro ao salvar tasks no backend');
        logger.debug('saveTasks - Tasks salvas no backend');
    } catch (e) {
        logger.debug(`saveTasks - Falha ao salvar no backend: ${e.message}`);
        localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
    }
}

// Gera um ID único para cada task
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Renderiza as tasks nas colunas
function renderKanban(tasks) {
    logger.debug(`renderKanban - Renderizando board com ${tasks.length} tasks`);
    const columns = {
        todo: document.getElementById('column-todo'),
        doing: document.getElementById('column-doing'),
        done: document.getElementById('column-done')
    };
    Object.values(columns).forEach(col => col.innerHTML = '');
    tasks.forEach(task => {
        const el = document.createElement('div');
        el.className = 'kanban-task';
        el.setAttribute('draggable', true);
        el.setAttribute('tabindex', 0);
        el.dataset.id = task.id;
        el.innerHTML = `<strong>${task.title}</strong>${task.desc ? `<div style='margin-top:4px;font-size:0.96em;'>${task.desc}</div>` : ''}`;
        columns[task.status].appendChild(el);
    });
    addDragAndDrop(tasks);
}

// Drag and Drop entre colunas
function addDragAndDrop(tasks) {
    let draggedId = null;
    document.querySelectorAll('.kanban-task').forEach(taskEl => {
        taskEl.addEventListener('dragstart', (e) => {
            draggedId = taskEl.dataset.id;
            taskEl.classList.add('dragging');
            logger.debug(`[KanbanTask] - dragstart - ID ${draggedId}`);
        });
        taskEl.addEventListener('dragend', () => {
            draggedId = null;
            taskEl.classList.remove('dragging');
            logger.debug(`[KanbanTask] - dragend`);
        });
    });
    document.querySelectorAll('.kanban-tasks').forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            column.classList.add('dragover');
        });
        column.addEventListener('dragleave', () => {
            column.classList.remove('dragover');
        });
        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('dragover');
            if (draggedId) {
                const task = tasks.find(t => t.id === draggedId);
                if (task) {
                    const newStatus = column.parentElement.getAttribute('data-status');
                    logger.debug(`[KanbanTask] - drop - ID ${draggedId} para ${newStatus}`);
                    task.status = newStatus;
                    renderKanban(tasks);
                    saveTasks(tasks);
                }
            }
        });
    });
}

// Modal de nova task
function setupTaskDialog(tasks) {
    const dialog = document.getElementById('task-dialog');
    const addBtn = document.getElementById('add-task');
    const form = document.getElementById('task-form');
    addBtn.onclick = () => {
        form.reset();
        dialog.showModal();
        setTimeout(() => form['title'].focus(), 50);
    };
    form.onsubmit = (e) => {
        e.preventDefault();
        const title = form['title'].value.trim();
        const desc = form['desc'].value.trim();
        const status = form['status'].value;
        if (!title) return;
        const task = { id: generateId(), title, desc, status };
        tasks.push(task);
        renderKanban(tasks);
        saveTasks(tasks);
        dialog.close();
        logger.debug(`[TaskDialog] - Nova task criada - ${JSON.stringify(task)}`);
    };
    dialog.addEventListener('close', () => {
        form.reset();
    });
    // Fechar modal com ESC ou clique fora
    dialog.addEventListener('cancel', () => dialog.close());
}

// Inicialização
async function init() {
    loadTheme();
    document.getElementById('toggle-theme').onclick = toggleTheme;
    let tasks = await loadTasks();
    renderKanban(tasks);
    setupTaskDialog(tasks);
    logger.debug('[Kanban] - init - Kanban inicializado');
}

init();