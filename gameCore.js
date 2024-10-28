import { AGENT_CLASSES, selectRandomClass, applyClassEffects, getClassStats, getClassIcon } from './agentClasses.js';

const FOOD_COUNT = 50;

class GameOfLife {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = this.createGrid();
        this.cellStats = this.createStatsGrid();
    }

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    createCellStats(className = null) {
        const baseStats = {
            maxEnergy: this.randomBetween(50, 200),
            currentEnergy: 0,
            force: this.randomBetween(0, 10),
            defense: this.randomBetween(0, 10),
            expression: 'normal',
            expressionTimer: 0,
            class: className || selectRandomClass()
        };

        // Appliquer les bonus de classe
        const classStats = getClassStats(baseStats.class);
        return {
            ...baseStats,
            maxEnergy: baseStats.maxEnergy + classStats.maxEnergyBonus,
            force: baseStats.force + classStats.forceBonus,
            defense: baseStats.defense + classStats.defenseBonus,
            reproductionBonus: classStats.reproductionBonus || 0,
            classIcon: getClassIcon(baseStats.class)
        };
    }

    createStatsGrid() {
        return new Array(this.cols).fill(null)
            .map(() => new Array(this.rows).fill(null)
                .map(() => null));
    }

    createGrid() {
        const newGrid = new Array(this.cols).fill(null)
            .map(() => new Array(this.rows).fill(0));
        
        let foodPlaced = 0;
        while (foodPlaced < FOOD_COUNT) {
            const x = Math.floor(Math.random() * this.cols);
            const y = Math.floor(Math.random() * this.rows);
            if (newGrid[x][y] === 0) {
                newGrid[x][y] = 3;
                foodPlaced++;
            }
        }
        return newGrid;
    }

    setExpression(i, j, expression, duration = 10) {
        if (this.cellStats[i][j]) {
            this.cellStats[i][j].expression = expression;
            this.cellStats[i][j].expressionTimer = duration;
        }
    }

    updateExpressions() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.cellStats[i][j] && this.cellStats[i][j].expressionTimer > 0) {
                    this.cellStats[i][j].expressionTimer--;
                    if (this.cellStats[i][j].expressionTimer === 0) {
                        this.cellStats[i][j].expression = 'normal';
                    }
                }
            }
        }
    }

    killCell(i, j) {
        if (Math.random() < 0.1) {
            this.grid[i][j] = 3; // 10% de chance de se transformer en pain
        } else {
            this.grid[i][j] = 0;
        }
        this.cellStats[i][j] = null;
    }

    countNeighborStats(x, y, color, stat) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                if (this.grid[col][row] === color && this.cellStats[col][row]) {
                    sum += this.cellStats[col][row][stat];
                }
            }
        }
        return sum;
    }

    resolveCombat(x, y) {
        const redForce = this.countNeighborStats(x, y, 1, 'force');
        const blueForce = this.countNeighborStats(x, y, 2, 'force');
        const redDefense = this.countNeighborStats(x, y, 1, 'defense');
        const blueDefense = this.countNeighborStats(x, y, 2, 'defense');
        
        // Appliquer les bonus de rage des Berserkers
        const cellStats = this.cellStats[x][y];
        if (cellStats && cellStats.class === 'BERSERKER' && 
            cellStats.currentEnergy / cellStats.maxEnergy <= AGENT_CLASSES.BERSERKER.specialEffect.rageTrigger) {
            if (this.grid[x][y] === 1) {
                redForce += AGENT_CLASSES.BERSERKER.specialEffect.rageBonus;
            } else {
                blueForce += AGENT_CLASSES.BERSERKER.specialEffect.rageBonus;
            }
        }
        
        if (redForce > blueDefense && this.grid[x][y] === 2) {
            if (Math.random() < 0.5) {
                this.grid[x][y] = 1;
                this.cellStats[x][y] = this.createCellStats();
                this.cellStats[x][y].currentEnergy = this.cellStats[x][y].maxEnergy / 2;
                this.setExpression(x, y, 'victory', 15);
            } else {
                this.killCell(x, y);
            }
            return true;
        } else if (blueForce > redDefense && this.grid[x][y] === 1) {
            if (Math.random() < 0.5) {
                this.grid[x][y] = 2;
                this.cellStats[x][y] = this.createCellStats();
                this.cellStats[x][y].currentEnergy = this.cellStats[x][y].maxEnergy / 2;
                this.setExpression(x, y, 'victory', 15);
            } else {
                this.killCell(x, y);
            }
            return true;
        }
        return false;
    }

    countNeighbors(x, y, color) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                if (this.grid[col][row] === color) sum++;
            }
        }
        return sum;
    }

    hasAdjacentFood(x, y) {
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                if (this.grid[col][row] === 3) return true;
            }
        }
        return false;
    }

    hasNearbyClass(x, y, className) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                if (this.cellStats[col][row]?.class === className) {
                    return true;
                }
            }
        }
        return false;
    }

    getEmptyNeighbors(x, y) {
        const emptyNeighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                if (this.grid[col][row] === 0) {
                    emptyNeighbors.push({x: col, y: row});
                }
            }
        }
        return emptyNeighbors;
    }

    update() {
        const nextGen = this.grid.map(arr => [...arr]);
        const nextStats = this.cellStats.map(arr => arr.map(stats => 
            stats ? {...stats} : null
        ));

        // Appliquer les effets spéciaux avant de mettre à jour les cellules
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.cellStats[i][j]) {
                    applyClassEffects(this, i, j);
                }
            }
        }

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const redNeighbors = this.countNeighbors(i, j, 1);
                const blueNeighbors = this.countNeighbors(i, j, 2);
                const currentCell = this.grid[i][j];

                if (currentCell === 0) {
                    let reproductionThreshold = 3;
                    const nearbySeducer = this.hasNearbyClass(i, j, 'SEDUCER');
                    if (nearbySeducer) {
                        reproductionThreshold = 2; // Plus facile de se reproduire près d'un séducteur
                    }

                    if (redNeighbors === reproductionThreshold) {
                        nextGen[i][j] = 1;
                        nextStats[i][j] = this.createCellStats();
                        nextStats[i][j].currentEnergy = nextStats[i][j].maxEnergy;
                    }
                    else if (blueNeighbors === reproductionThreshold) {
                        nextGen[i][j] = 2;
                        nextStats[i][j] = this.createCellStats();
                        nextStats[i][j].currentEnergy = nextStats[i][j].maxEnergy;
                    }
                } 
                else if (currentCell === 1 || currentCell === 2) {
                    if (this.resolveCombat(i, j)) continue;

                    if (this.hasAdjacentFood(i, j)) {
                        const energyGain = this.cellStats[i][j].class === 'FARMER' ? 
                            1.5 : 1; // Bonus pour les fermiers
                        nextStats[i][j].currentEnergy = Math.min(
                            nextStats[i][j].maxEnergy,
                            nextStats[i][j].currentEnergy + (nextStats[i][j].maxEnergy * energyGain)
                        );
                        this.setExpression(i, j, 'eating', 5);
                        for (let di = -1; di < 2; di++) {
                            for (let dj = -1; dj < 2; dj++) {
                                const col = (i + di + this.cols) % this.cols;
                                const row = (j + dj + this.rows) % this.rows;
                                if (this.grid[col][row] === 3) {
                                    nextGen[col][row] = 0;
                                }
                            }
                        }
                    } else {
                        nextStats[i][j].currentEnergy--;
                    }

                    if (nextStats[i][j].currentEnergy < nextStats[i][j].maxEnergy * 0.2) {
                        this.setExpression(i, j, 'tired', 5);
                    }

                    if (nextStats[i][j].currentEnergy <= 0) {
                        if (Math.random() < 0.1) {
                            nextGen[i][j] = 3;
                        } else {
                            nextGen[i][j] = 0;
                        }
                        nextStats[i][j] = null;
                        continue;
                    }

                    // Règles de survie avec bonus de l'Ancien
                    let minNeighbors = 2;
                    let maxNeighbors = 3;
                    if (this.hasNearbyClass(i, j, 'ELDER')) {
                        minNeighbors = 1; // Plus facile de survivre près d'un Ancien
                        maxNeighbors = 4;
                    }

                    if (currentCell === 1 && (redNeighbors < minNeighbors || redNeighbors > maxNeighbors)) {
                        if (Math.random() < 0.1) {
                            nextGen[i][j] = 3;
                        } else {
                            nextGen[i][j] = 0;
                        }
                        nextStats[i][j] = null;
                    }
                    else if (currentCell === 2 && (blueNeighbors < minNeighbors || blueNeighbors > maxNeighbors)) {
                        if (Math.random() < 0.1) {
                            nextGen[i][j] = 3;
                        } else {
                            nextGen[i][j] = 0;
                        }
                        nextStats[i][j] = null;
                    }
                }
            }
        }
        
        // Gérer la création de nourriture par les boulangers
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.cellStats[i][j]?.class === 'BAKER' && Math.random() < 0.1) {
                    // Chercher une case vide adjacente
                    const emptyNeighbors = this.getEmptyNeighbors(i, j);
                    if (emptyNeighbors.length > 0) {
                        const randomPos = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                        nextGen[randomPos.x][randomPos.y] = 3; // Créer de la nourriture
                    }
                }
            }
        }

        // Déplacer les éclaireurs
        this.moveScouts();

        this.grid = nextGen;
        this.cellStats = nextStats;
        this.updateExpressions();

        const winner = this.checkVictory();
        if (winner) {
            return winner;
        }
        return null;
    }

    checkVictory() {
        const counts = this.getCounts();
        if (counts.redCount === 0 && counts.blueCount > 0) {
            return 'blue';
        } else if (counts.blueCount === 0 && counts.redCount > 0) {
            return 'red';
        }
        return null;
    }

    reset(redStrategy = null, blueStrategy = null) {
        this.grid = this.createGrid();
        this.cellStats = this.createStatsGrid();
        
        if (redStrategy) {
            this.importStrategy(redStrategy, 'red');
        }
        if (blueStrategy) {
            this.importStrategy(blueStrategy, 'blue');
        }
    }

    importStrategy(strategy, color) {
        const { positions, width = 0, height = 0 } = strategy;
        if (!positions.length) return;

        // Calculer les positions de départ selon la couleur
        let startX, startY;
        if (color === 'red') {
            // Haut droit
            startX = this.cols - width - 2; // -2 pour laisser une marge
            startY = 2; // Marge en haut
        } else {
            // Bas gauche
            startX = 2; // Marge à gauche
            startY = this.rows - height - 2; // -2 pour laisser une marge
        }

        // Vérifier si la stratégie peut être placée
        if (startX < 0 || startY < 0 || startX + width > this.cols || startY + height > this.rows) {
            console.error("La stratégie est trop grande pour être placée");
            return;
        }

        // Placer les cellules avec leurs positions relatives sans effacer les autres
        positions.forEach(pos => {
            const newX = startX + pos.x;
            const newY = startY + pos.y;
            if (this.grid[newX][newY] === 0) { // Vérifier que la case est libre
                this.addCell(newX, newY, color, pos.class);
            }
        });
    }

    addCell(x, y, color, className = null) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            this.grid[x][y] = color === 'red' ? 1 : 2;
            this.cellStats[x][y] = this.createCellStats(className);
            this.cellStats[x][y].currentEnergy = this.cellStats[x][y].maxEnergy;
            return true;
        }
        return false;
    }

    getCellStats(x, y) {
        if (this.grid[x][y] === 1 || this.grid[x][y] === 2) {
            return {
                type: this.grid[x][y],
                ...this.cellStats[x][y]
            };
        }
        return null;
    }

    moveScouts() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.cellStats[i][j]?.class === 'SCOUT') {
                    const cellType = this.grid[i][j];
                    const range = AGENT_CLASSES.SCOUT.specialEffect.movementRange;
                    
                    // Chercher une position valide dans la portée
                    let validPositions = [];
                    for (let dx = -range; dx <= range; dx++) {
                        for (let dy = -range; dy <= range; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const newX = (i + dx + this.cols) % this.cols;
                            const newY = (j + dy + this.rows) % this.rows;
                            
                            if (this.grid[newX][newY] === 0) {
                                validPositions.push({x: newX, y: newY});
                            }
                        }
                    }
                    
                    // Déplacer vers une position aléatoire valide
                    if (validPositions.length > 0) {
                        const newPos = validPositions[Math.floor(Math.random() * validPositions.length)];
                        this.grid[newPos.x][newPos.y] = cellType;
                        this.cellStats[newPos.x][newPos.y] = this.cellStats[i][j];
                        this.grid[i][j] = 0;
                        this.cellStats[i][j] = null;
                    }
                }
            }
        }
    }

    getCounts() {
        let redCount = 0;
        let blueCount = 0;
        let foodCount = 0;
        
        // Stats des classes
        let classStats = {
            red: {},
            blue: {}
        };
        
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j] === 1) {
                    redCount++;
                    const cellClass = this.cellStats[i][j].class;
                    classStats.red[cellClass] = (classStats.red[cellClass] || 0) + 1;
                }
                if (this.grid[i][j] === 2) {
                    blueCount++;
                    const cellClass = this.cellStats[i][j].class;
                    classStats.blue[cellClass] = (classStats.blue[cellClass] || 0) + 1;
                }
                if (this.grid[i][j] === 3) foodCount++;
            }
        }
        
        return { 
            redCount, 
            blueCount, 
            foodCount,
            classStats 
        };
    }

    getClassDistribution(color) {
        const counts = {};
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j] === (color === 'red' ? 1 : 2)) {
                    const className = this.cellStats[i][j].class;
                    counts[className] = (counts[className] || 0) + 1;
                }
            }
        }
        return counts;
    }

    serializeStrategy(color) {
        // Trouver les limites de la stratégie actuelle
        let minX = this.cols;
        let minY = this.rows;
        let maxX = 0;
        let maxY = 0;
        const cellType = color === 'red' ? 1 : 2;
        
        // Trouver les dimensions de la stratégie
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j] === cellType) {
                    minX = Math.min(minX, i);
                    minY = Math.min(minY, j);
                    maxX = Math.max(maxX, i);
                    maxY = Math.max(maxY, j);
                }
            }
        }
        
        // Si aucune cellule trouvée
        if (minX > maxX) return { name: `Stratégie ${color}`, positions: [] };
        
        // Enregistrer les positions relatives à partir du point (0,0)
        const positions = [];
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j] === cellType) {
                    positions.push({
                        x: i - minX,
                        y: j - minY,
                        class: this.cellStats[i][j].class
                    });
                }
            }
        }
        
        return {
            name: `Stratégie ${color}`,
            positions: positions,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
}

export default GameOfLife;