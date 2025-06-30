class Food {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.points = this.getPoints();
        this.color = this.getColor();
    }

    getPoints() {
        switch (this.type) {
            case 'normal': return 10;
            case 'special': return 30;
            case 'golden': return 50;
            default: return 10;
        }
    }

    getColor() {
        switch (this.type) {
            case 'normal': return '#e74c3c'; // red
            case 'special': return '#9b59b6'; // purple
            case 'golden': return '#f1c40f'; // yellow
            default: return '#e74c3c';
        }
    }
}

class Wall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Snake {
    constructor() {
        this.body = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    move(food, walls) {
        this.direction = this.nextDirection;
        const head = { ...this.body[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        if (!this.isValidMove(head, walls)) {
            return { ateFood: false, collision: true };
        }

        const ateFood = head.x === food.x && head.y === food.y;
        this.body.unshift(head);
        if (!ateFood) this.body.pop();
        return { ateFood, foodType: food.type };
    }

    isValidMove(position, walls) {
        if (position.x < 0 || position.x >= 20 || position.y < 0 || position.y >= 20) return false;

        for (const wall of walls)
            if (position.x === wall.x && position.y === wall.y) return false;

        for (let i = 0; i < this.body.length - 1; i++)
            if (position.x === this.body[i].x && position.y === this.body[i].y) return false;

        return true;
    }
}

class ScoreHistory {
    constructor(maxSize = 5) {
        this.scores = [];
        this.maxSize = maxSize;
    }

    addScore(score, level) {
        const scoreEntry = {
            score: score,
            level: level,
            date: new Date().toLocaleTimeString()
        };
        this.scores.unshift(scoreEntry);
        if (this.scores.length > this.maxSize) this.scores.pop();
    }

    getScores() {
        return this.scores;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileSize = 20;
        this.snake = new Snake();
        this.foods = [];
        this.walls = [];
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 150;
        this.scoreHistory = new ScoreHistory();
        this.showHistory = false;
        this.isPaused = false;
        this.levelUpMessage = '';
        this.pauseMessage = '';

        this.canvas.width = this.gridSize * this.tileSize;
        this.canvas.height = this.gridSize * this.tileSize;

        this.createPauseButton();
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    createPauseButton() {
        const pauseBtn = document.createElement('button');
        pauseBtn.id = 'pauseBtn';
        pauseBtn.textContent = 'Pause';
        pauseBtn.style.position = 'absolute';
        pauseBtn.style.top = '10px';
        pauseBtn.style.right = '10px';
        pauseBtn.style.display = 'none';
        pauseBtn.addEventListener('click', () => this.togglePause());
        document.querySelector('.game-container').appendChild(pauseBtn);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        if (this.isPaused) {
            clearInterval(this.gameLoop);
            clearInterval(this.foodSpawnInterval);
            pauseBtn.textContent = 'Resume';
            this.pauseMessage = 'PAUSED';
        } else {
            this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
            this.foodSpawnInterval = setInterval(() => {
                if (this.foods.length < 3) this.foods.push(this.generateFood());
            }, 5000);
            pauseBtn.textContent = 'Pause';
            this.pauseMessage = '';
        }
        this.draw();
    }

    generateFood() {
        const types = ['normal', 'special', 'golden'];
        const type = types[Math.floor(Math.random() * types.length)];
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.isPositionOccupied(food));
        return new Food(food.x, food.y, type);
    }

    isPositionOccupied(pos) {
        return [...this.snake.body, ...this.walls, ...this.foods].some(p => p.x === pos.x && p.y === pos.y);
    }

    generateWalls() {
        this.walls = [];
        const center = { x: 10, y: 10 };

        const patterns = [
            () => { for (let x = 5; x < 15; x++) this.walls.push(new Wall(x, 5)); },
            () => { for (let y = 5; y < 15; y++) this.walls.push(new Wall(5, y)); },
            () => {
                for (let x = 5; x < 15; x++) {
                    this.walls.push(new Wall(x, 5));
                    this.walls.push(new Wall(x, 14));
                }
                for (let y = 6; y < 14; y++) {
                    this.walls.push(new Wall(5, y));
                    this.walls.push(new Wall(14, y));
                }
            },
            () => {
                for (let x = 5; x < 15; x++) this.walls.push(new Wall(x, 15));
                for (let y = 5; y < 15; y++) {
                    this.walls.push(new Wall(5, y));
                    this.walls.push(new Wall(14, y));
                }
            },
            () => {
                const count = 20;
                for (let i = 0; i < count; i++) {
                    let wx, wy;
                    do {
                        wx = Math.floor(Math.random() * this.gridSize);
                        wy = Math.floor(Math.random() * this.gridSize);
                    } while (this.isPositionOccupied({ x: wx, y: wy }) ||
                             (Math.abs(wx - center.x) <= 2 && Math.abs(wy - center.y) <= 2));
                    this.walls.push(new Wall(wx, wy));
                }
            }
        ];
        const pattern = patterns[Math.min(this.level - 1, patterns.length - 1)];
        pattern();
    }

    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        if (key === 'p') return this.togglePause();
        if (key === 'h') {
            this.showHistory = !this.showHistory;
            return this.draw();
        }
        if (this.isPaused) return;

        const dir = this.snake.direction;
        if ((key === 'arrowup' || key === 'w') && dir !== 'down') this.snake.nextDirection = 'up';
        if ((key === 'arrowdown' || key === 's') && dir !== 'up') this.snake.nextDirection = 'down';
        if ((key === 'arrowleft' || key === 'a') && dir !== 'right') this.snake.nextDirection = 'left';
        if ((key === 'arrowright' || key === 'd') && dir !== 'left') this.snake.nextDirection = 'right';
    }

    update() {
        if (this.foods.length === 0) this.foods.push(this.generateFood());
        const result = this.snake.move(this.foods[0], this.walls);

        if (result.collision) return this.gameOver();
        if (result.ateFood) {
            const food = this.foods.shift();
            this.score += food.points;
            document.getElementById('score').textContent = this.score;

            const newLevel = Math.floor(this.score / 100) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.showLevelUpMessage();
                this.levelUp();
            }
        }

        this.draw();
    }

    showLevelUpMessage() {
        this.levelUpMessage = `Level ${this.level}!`;
        if (this.levelUpTimer) clearTimeout(this.levelUpTimer);
        this.levelUpTimer = setTimeout(() => this.levelUpMessage = '', 2000);
    }

    levelUp() {
        this.gameSpeed = Math.max(50, 150 - (this.level * 5));
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.foods = [];
        this.generateWalls();
        this.foods.push(this.generateFood());
        this.updateSnakeColor();
    }

    updateSnakeColor() {
        const colors = [
            { head: '#27ae60', body: '#2ecc71' },
            { head: '#2980b9', body: '#3498db' },
            { head: '#8e44ad', body: '#9b59b6' },
            { head: '#c0392b', body: '#e74c3c' },
            { head: '#f39c12', body: '#f1c40f' }
        ];
        const colorIndex = Math.min(Math.floor(this.level / 2), colors.length - 1);
        this.snakeColors = colors[colorIndex];
    }

    draw() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const wall of this.walls) {
            const grad = this.ctx.createLinearGradient(
                wall.x * this.tileSize, wall.y * this.tileSize,
                (wall.x + 1) * this.tileSize, (wall.y + 1) * this.tileSize
            );
            grad.addColorStop(0, '#7f8c8d');
            grad.addColorStop(1, '#bdc3c7');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(wall.x * this.tileSize, wall.y * this.tileSize, this.tileSize - 1, this.tileSize - 1);
        }

        this.snake.body.forEach((s, i) => {
            this.ctx.fillStyle = i === 0 ? this.snakeColors.head : this.snakeColors.body;
            this.ctx.fillRect(s.x * this.tileSize, s.y * this.tileSize, this.tileSize - 1, this.tileSize - 1);
        });

        for (const food of this.foods) {
            this.ctx.fillStyle = food.color;
            this.ctx.fillRect(food.x * this.tileSize, food.y * this.tileSize, this.tileSize - 1, this.tileSize - 1);
        }

        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Level: ${this.level}`, 10, 20);
        this.ctx.fillText(`Score: ${this.score}`, 10, 40);
        this.ctx.fillText('Press H to toggle score history', 10, 60);
        this.ctx.fillText('Press P to pause', 10, 80);

        if (this.levelUpMessage) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.levelUpMessage, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }

        if (this.showHistory) this.drawScoreHistory();
        if (this.pauseMessage) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.pauseMessage, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }
    }

    drawScoreHistory() {
        const history = this.scoreHistory.getScores();
        const startX = this.canvas.width - 200;
        const startY = 20;
        const lineHeight = 25;

        this.ctx.fillStyle = this.isPaused ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(startX - 10, startY - 10, 190, (history.length + 1) * lineHeight + 10);

        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('Score History', startX, startY);

        this.ctx.font = '14px Arial';
        history.forEach((entry, index) => {
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.fillText(`${index + 1}. Score: ${entry.score} (Level ${entry.level}) - ${entry.date}`, startX, startY + (index + 1) * lineHeight);
        });
    }

    gameOver() {
        clearInterval(this.gameLoop);
        clearInterval(this.foodSpawnInterval);
        this.scoreHistory.addScore(this.score, this.level);

        const msg = `Game Over!\nScore: ${this.score}\nLevel: ${this.level}\n\nPress OK to restart`;
        if (confirm(msg)) this.restart();
        else {
            document.getElementById('startBtn').style.display = 'inline-block';
            document.getElementById('restartBtn').style.display = 'none';
        }
    }

    restart() {
        clearInterval(this.gameLoop);
        clearInterval(this.foodSpawnInterval);
        if (this.levelUpTimer) clearTimeout(this.levelUpTimer);

        this.snake = new Snake();
        this.foods = [];
        this.walls = [];
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 150;
        this.levelUpMessage = '';
        this.isPaused = false;
        this.pauseMessage = '';
        document.getElementById('score').textContent = this.score;
        document.getElementById('pauseBtn').textContent = 'Pause';

        this.start();
    }

    start() {
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        this.generateWalls();
        this.foods.push(this.generateFood());
        this.updateSnakeColor();

        clearInterval(this.gameLoop);
        clearInterval(this.foodSpawnInterval);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.foodSpawnInterval = setInterval(() => {
            if (this.foods.length < 3) this.foods.push(this.generateFood());
        }, 5000);
    }
}

const game = new Game();
