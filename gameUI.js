import GameOfLife from './gameCore.js';
import { AGENT_CLASSES } from './agentClasses.js';

class GameUI {
    constructor() {
        this.canvas = document.getElementById('grid');
        this.ctx = this.canvas.getContext('2d');
        this.cellInfo = document.getElementById('cellInfo');
        this.resolution = 20;
        this.cols = this.canvas.width / this.resolution;
        this.rows = this.canvas.height / this.resolution;
        
        this.game = new GameOfLife(this.cols, this.rows);
        this.currentColor = 'red';
        this.isRunning = false;
        this.animation = null;

        this.initializeEventListeners();
        this.draw();
        this.updateClassStats();
    }

    setCurrentColor(color) {
        this.currentColor = color;
    }

    importStrategy(strategyData, color) {
        const strategy = JSON.parse(strategyData);
        this.game.importStrategy(strategy, color);
        this.draw();
    }

    drawExpression(x, y, expression, type, classIcon) {
        const centerX = x + this.resolution / 2;
        const centerY = y + this.resolution / 2;
        const size = this.resolution * 0.6;
        
        // Dessiner l'icône de classe
        this.ctx.font = `${this.resolution * 0.7}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(classIcon, centerX, centerY);

        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        
        switch(expression) {
            case 'normal':
                // Petits yeux au-dessus de l'icône
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(centerX - size/4, centerY - size/3, 2, 0, Math.PI * 2);
                this.ctx.arc(centerX + size/4, centerY - size/3, 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'eating':
                // Yeux en forme de ^ au-dessus de l'icône
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - size/4, centerY - size/3);
                this.ctx.lineTo(centerX - size/4 + 3, centerY - size/3 - 3);
                this.ctx.moveTo(centerX + size/4, centerY - size/3);
                this.ctx.lineTo(centerX + size/4 + 3, centerY - size/3 - 3);
                this.ctx.stroke();
                break;

            case 'victory':
                // Étoiles autour de l'icône
                this.drawStar(centerX - size/3, centerY - size/3, 3);
                this.drawStar(centerX + size/3, centerY - size/3, 3);
                break;

            case 'tired':
                // Spirales au-dessus de l'icône
                this.drawSpiral(centerX - size/4, centerY - size/3, 3);
                this.drawSpiral(centerX + size/4, centerY - size/3, 3);
                break;
        }
    }

    drawStar(x, y, size) {
        this.ctx.save();
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            this.ctx.lineTo(
                Math.cos(((i * 4) / 5 + 0.5) * Math.PI) * size + x,
                Math.sin(((i * 4) / 5 + 0.5) * Math.PI) * size + y
            );
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawSpiral(x, y, size) {
        this.ctx.save();
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < 360; i++) {
            const angle = 0.1 * i;
            const radius = (0.02 * i * size) / 4;
            this.ctx.lineTo(
                x + radius * Math.cos(angle * Math.PI / 180),
                y + radius * Math.sin(angle * Math.PI / 180)
            );
        }
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawEnergyBar(x, y, currentEnergy, maxEnergy) {
        const barWidth = 4;
        const barHeight = (currentEnergy / maxEnergy) * this.resolution;
        this.ctx.fillStyle = `hsl(${(currentEnergy / maxEnergy) * 120}, 100%, 50%)`;
        this.ctx.fillRect(
            x + this.resolution - barWidth, 
            y + this.resolution - barHeight, 
            barWidth, 
            barHeight
        );
    }

    drawStatsBars(x, y, force, defense) {
        // Barre de force (rouge)
        const forceWidth = (force / 10) * this.resolution;
        this.ctx.fillStyle = '#ff000080';
        this.ctx.fillRect(x, y, forceWidth, 2);
        
        // Barre de défense (bleue)
        const defenseWidth = (defense / 10) * this.resolution;
        this.ctx.fillStyle = '#0000ff80';
        this.ctx.fillRect(x, y + 2, defenseWidth, 2);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const x = i * this.resolution;
                const y = j * this.resolution;
                const stats = this.game.getCellStats(i, j);

                if (stats) {
                    // Couleur de base
                    this.ctx.fillStyle = stats.type === 1 ? '#ff444480' : '#4444ff80';
                    this.ctx.fillRect(x, y, this.resolution, this.resolution);
                    
                    // Barres de stats
                    this.drawStatsBars(x, y, stats.force, stats.defense);
                    
                    // Barre d'énergie
                    this.drawEnergyBar(x, y, stats.currentEnergy, stats.maxEnergy);

                    // Expression et icône de classe
                    this.drawExpression(x, y, stats.expression, stats.type, stats.classIcon);
                    
                } else if (this.game.grid[i][j] === 3) {
                    // Pain
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(x, y, this.resolution, this.resolution);
                    // Petit symbole de pain
                    this.ctx.font = `${this.resolution * 0.7}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillText('🍞', x + this.resolution/2, y + this.resolution/2);
                }
                
                this.ctx.strokeStyle = '#ddd';
                this.ctx.strokeRect(x, y, this.resolution, this.resolution);
            }
        }
        this.updateStats();
        this.updateClassStats();
    }

    updateClassStats() {
        const redClassStats = this.game.getClassDistribution('red');
        const blueClassStats = this.game.getClassDistribution('blue');
        
        let redStatsHtml = '<h3>Classes Rouges:</h3>';
        let blueStatsHtml = '<h3>Classes Bleues:</h3>';
        
        Object.entries(AGENT_CLASSES).forEach(([className, classData]) => {
            const redCount = redClassStats[className] || 0;
            const blueCount = blueClassStats[className] || 0;
            
            if (redCount > 0) {
                redStatsHtml += `<div>${classData.icon} ${classData.name}: ${redCount}</div>`;
            }
            if (blueCount > 0) {
                blueStatsHtml += `<div>${classData.icon} ${classData.name}: ${blueCount}</div>`;
            }
        });

        document.getElementById('redClassStats').innerHTML = redStatsHtml;
        document.getElementById('blueClassStats').innerHTML = blueStatsHtml;
    }

    updateStats() {
        const counts = this.game.getCounts();
        document.getElementById('redCount').textContent = counts.redCount;
        document.getElementById('blueCount').textContent = counts.blueCount;
        document.getElementById('foodCount').textContent = counts.foodCount;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animation = setInterval(() => {
                const winner = this.game.update();
                this.draw();
                
                if (winner) {
                    this.showVictoryMessage(winner);
                }
            }, 200);
        }
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.animation);
    }

    reset() {
        this.stop();
        this.game.reset();
        this.draw();
    }

    showVictoryMessage(winner) {
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = winner === 'red' ? '#ffebee' : '#e3f2fd';
        message.style.border = `2px solid ${winner === 'red' ? '#ff4444' : '#4444ff'}`;
        message.style.padding = '20px';
        message.style.borderRadius = '10px';
        message.style.zIndex = '1000';
        message.style.fontSize = '24px';
        message.style.textAlign = 'center';
        message.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        // Ajouter les statistiques de classe à la victoire
        const classStats = winner === 'red' ? 
            this.game.getClassDistribution('red') : 
            this.game.getClassDistribution('blue');
        
        let classStatsHtml = '<div style="font-size: 16px; margin-top: 10px;">';
        Object.entries(classStats).forEach(([className, count]) => {
            const classData = AGENT_CLASSES[className];
            classStatsHtml += `<div>${classData.icon} ${classData.name}: ${count}</div>`;
        });
        classStatsHtml += '</div>';
        
        message.innerHTML = `
            <h2 style="margin: 0 0 10px 0; color: ${winner === 'red' ? '#d32f2f' : '#1976d2'}">
                Victoire ${winner === 'red' ? 'Rouge' : 'Bleue'}!
            </h2>
            ${classStatsHtml}
            <button onclick="this.parentElement.remove(); gameUI.reset();" 
                    style="background-color: ${winner === 'red' ? '#ff4444' : '#4444ff'}; 
                           color: white; 
                           border: none; 
                           padding: 8px 16px; 
                           border-radius: 4px; 
                           cursor: pointer;
                           margin-top: 10px">
                Nouvelle Partie
            </button>
        `;
        
        document.body.appendChild(message);
        this.stop();
    }

    handleCellHover(x, y, event) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const stats = this.game.getCellStats(x, y);
            if (stats) {
                const mouseX = event.clientX;
                const mouseY = event.clientY;
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                let offsetX = 15;
                let offsetY = 15;
                
                const infoWidth = 200;
                const infoHeight = 150;
                
                if (mouseX + infoWidth + offsetX > windowWidth) {
                    offsetX = -infoWidth - 15;
                }
                if (mouseY + infoHeight + offsetY > windowHeight) {
                    offsetY = -infoHeight - 15;
                }

                this.cellInfo.style.display = 'block';
                this.cellInfo.style.left = (mouseX + offsetX) + 'px';
                this.cellInfo.style.top = (mouseY + offsetY) + 'px';
                
                requestAnimationFrame(() => {
                    this.cellInfo.classList.add('visible');
                });

                const classData = AGENT_CLASSES[stats.class];
                this.cellInfo.innerHTML = `
                    <div>
                        <strong>Couleur:</strong> ${stats.type === 1 ? 'Rouge' : 'Bleu'}<br>
                        <strong>Classe:</strong> ${classData.icon} ${classData.name}<br>
                        <strong>Énergie:</strong> ${stats.currentEnergy}/${stats.maxEnergy}<br>
                        <strong>Force:</strong> ${stats.force}/10<br>
                        <strong>Défense:</strong> ${stats.defense}/10<br>
                        <strong>État:</strong> ${stats.expression}<br>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            ${classData.description}
                        </div>
                    </div>
                `;
            } else {
                this.hideCellInfo();
            }

            if (event.buttons === 1) {
                if (this.game.addCell(x, y, this.currentColor)) {
                    this.draw();
                }
            }
        } else {
            this.hideCellInfo();
        }
    }

    hideCellInfo() {
        this.cellInfo.classList.remove('visible');
        setTimeout(() => {
            if (!this.cellInfo.classList.contains('visible')) {
                this.cellInfo.style.display = 'none';
            }
        }, 200);
    }

    initializeEventListeners() {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.resolution);
            const y = Math.floor((event.clientY - rect.top) / this.resolution);
            
            if (this.game.addCell(x, y, this.currentColor)) {
                this.draw();
            }
        });

        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.resolution);
            const y = Math.floor((event.clientY - rect.top) / this.resolution);
            this.handleCellHover(x, y, event);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hideCellInfo();
        });

        // Gestionnaires pour les boutons
        window.setCurrentColor = (color) => this.setCurrentColor(color);
        window.start = () => this.start();
        window.stop = () => this.stop();
        window.reset = () => this.reset();
        
        // Gestionnaires pour l'import de stratégies
        window.importRedStrategy = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.importStrategy(e.target.result, 'red');
                };
                reader.readAsText(file);
            }
        };

        window.importBlueStrategy = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.importStrategy(e.target.result, 'blue');
                };
                reader.readAsText(file);
            }
        };

        // Gestionnaire pour l'export de stratégies
        window.exportStrategy = (color) => {
            const strategy = this.game.serializeStrategy(color);
            const jsonStr = JSON.stringify(strategy, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `strategy_${color}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // Mise à jour des statistiques de classe toutes les secondes
        setInterval(() => {
            if (this.isRunning) {
                this.updateClassStats();
            }
        }, 1000);
    }
}

// Créer et démarrer le jeu quand le document est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new GameUI();
});

export default GameUI;