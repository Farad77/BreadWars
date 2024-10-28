// agentClasses.js

// Énumération des types de classes
export const AGENT_CLASS_TYPES = {
    VILLAGER: 'VILLAGER',
    BAKER: 'BAKER',
    WARRIOR: 'WARRIOR',
    SEDUCER: 'SEDUCER',
    HEALER: 'HEALER',
    SCOUT: 'SCOUT',
    FARMER: 'FARMER',
    ELDER: 'ELDER',
    BUILDER: 'BUILDER',
    BERSERKER: 'BERSERKER'
};

// Configuration des classes d'agents
export const AGENT_CLASSES = {
    [AGENT_CLASS_TYPES.VILLAGER]: {
        name: 'Villageois',
        chance: 60,
        stats: {
            forceBonus: 0,
            defenseBonus: 0,
            maxEnergyBonus: 0,
            reproductionBonus: 0
        },
        icon: '👤',
        description: 'Agent de base, polyvalent'
    },

    [AGENT_CLASS_TYPES.BAKER]: {
        name: 'Boulanger',
        chance: 5,
        stats: {
            forceBonus: -1,
            defenseBonus: 1,
            maxEnergyBonus: 20,
            reproductionBonus: 0
        },
        specialEffect: {
            type: 'createFood',
            chance: 0.1,
            range: 1
        },
        icon: '👨‍🍳',
        description: 'Peut créer de la nourriture autour de lui'
    },

    [AGENT_CLASS_TYPES.WARRIOR]: {
        name: 'Guerrier',
        chance: 8,
        stats: {
            forceBonus: 3,
            defenseBonus: 2,
            maxEnergyBonus: 30,
            reproductionBonus: -0.1
        },
        specialEffect: {
            type: 'seekCombat',
            range: 3,
            aggressionBonus: 0.3
        },
        icon: '⚔️',
        description: 'Plus fort en combat et cherche activement le conflit'
    },

    [AGENT_CLASS_TYPES.SEDUCER]: {
        name: 'Séducteur',
        chance: 5,
        stats: {
            forceBonus: -1,
            defenseBonus: -1,
            maxEnergyBonus: 0,
            reproductionBonus: 0.3
        },
        specialEffect: {
            type: 'enhanceReproduction',
            range: 2,
            bonus: 0.2
        },
        icon: '💝',
        description: 'Augmente les chances de reproduction des cellules voisines'
    },

    [AGENT_CLASS_TYPES.HEALER]: {
        name: 'Guérisseur',
        chance: 5,
        stats: {
            forceBonus: -2,
            defenseBonus: 1,
            maxEnergyBonus: 10,
            reproductionBonus: 0
        },
        specialEffect: {
            type: 'heal',
            chance: 0.15,
            range: 1,
            healAmount: 20
        },
        icon: '💊',
        description: 'Peut restaurer l\'énergie des cellules adjacentes'
    },

    [AGENT_CLASS_TYPES.SCOUT]: {
        name: 'Éclaireur',
        chance: 4,
        stats: {
            forceBonus: 0,
            defenseBonus: 1,
            maxEnergyBonus: -10,
            reproductionBonus: 0
        },
        specialEffect: {
            type: 'explore',
            movementRange: 2
        },
        icon: '👁️',
        description: 'Plus mobile, peut se déplacer plus loin'
    },

    [AGENT_CLASS_TYPES.FARMER]: {
        name: 'Fermier',
        chance: 5,
        stats: {
            forceBonus: -1,
            defenseBonus: 0,
            maxEnergyBonus: 40,
            reproductionBonus: 0.1
        },
        specialEffect: {
            type: 'efficientEating',
            energyBonus: 0.5
        },
        icon: '🌾',
        description: 'Obtient plus d\'énergie en mangeant'
    },

    [AGENT_CLASS_TYPES.ELDER]: {
        name: 'Ancien',
        chance: 3,
        stats: {
            forceBonus: -1,
            defenseBonus: 3,
            maxEnergyBonus: -20,
            reproductionBonus: 0.2
        },
        specialEffect: {
            type: 'wisdom',
            range: 2,
            survivalBonus: 0.2
        },
        icon: '👴',
        description: 'Plus résistant et aide les cellules voisines à survivre'
    },

    [AGENT_CLASS_TYPES.BUILDER]: {
        name: 'Bâtisseur',
        chance: 4,
        stats: {
            forceBonus: 0,
            defenseBonus: 2,
            maxEnergyBonus: 0,
            reproductionBonus: -0.1
        },
        specialEffect: {
            type: 'fortify',
            range: 1,
            defenseBoost: 2
        },
        icon: '👷',
        description: 'Renforce la défense des cellules voisines'
    },

    [AGENT_CLASS_TYPES.BERSERKER]: {
        name: 'Berserker',
        chance: 3,
        stats: {
            forceBonus: 4,
            defenseBonus: -2,
            maxEnergyBonus: 20,
            reproductionBonus: -0.2
        },
        specialEffect: {
            type: 'rage',
            rageTrigger: 0.3,
            rageBonus: 3
        },
        icon: '😠',
        description: 'Devient plus fort quand son énergie est basse'
    }
};

export function selectRandomClass() {
    const totalChance = Object.values(AGENT_CLASSES).reduce((sum, cls) => sum + cls.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const [className, classData] of Object.entries(AGENT_CLASSES)) {
        random -= classData.chance;
        if (random <= 0) {
            return className;
        }
    }
    return AGENT_CLASS_TYPES.VILLAGER;
}

export function applyClassEffects(gameInstance, x, y) {
    const cell = gameInstance.grid[x][y];
    const cellStats = gameInstance.cellStats[x][y];
    
    if (!cell || !cellStats || !cellStats.class) return;
    
    const classData = AGENT_CLASSES[cellStats.class];
    if (!classData.specialEffect) return;

    switch (classData.specialEffect.type) {
        case 'createFood':
            if (Math.random() < classData.specialEffect.chance) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newX = (x + i + gameInstance.cols) % gameInstance.cols;
                        const newY = (y + j + gameInstance.rows) % gameInstance.rows;
                        if (gameInstance.grid[newX][newY] === 0 && Math.random() < 0.2) {
                            gameInstance.grid[newX][newY] = 3; // Crée de la nourriture
                        }
                    }
                }
            }
            break;

        case 'heal':
            if (Math.random() < classData.specialEffect.chance) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newX = (x + i + gameInstance.cols) % gameInstance.cols;
                        const newY = (y + j + gameInstance.rows) % gameInstance.rows;
                        const neighborStats = gameInstance.cellStats[newX][newY];
                        if (neighborStats && gameInstance.grid[newX][newY] === cell) {
                            neighborStats.currentEnergy = Math.min(
                                neighborStats.currentEnergy + classData.specialEffect.healAmount,
                                neighborStats.maxEnergy
                            );
                        }
                    }
                }
            }
            break;

        case 'rage':
            if (cellStats.currentEnergy / cellStats.maxEnergy <= classData.specialEffect.rageTrigger) {
                cellStats.force += classData.specialEffect.rageBonus;
            }
            break;

        case 'efficientEating':
            if (gameInstance.hasAdjacentFood(x, y)) {
                cellStats.currentEnergy += cellStats.maxEnergy * classData.specialEffect.energyBonus;
                cellStats.currentEnergy = Math.min(cellStats.currentEnergy, cellStats.maxEnergy);
            }
            break;

        case 'fortify':
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newX = (x + i + gameInstance.cols) % gameInstance.cols;
                    const newY = (y + j + gameInstance.rows) % gameInstance.rows;
                    const neighborStats = gameInstance.cellStats[newX][newY];
                    if (neighborStats && gameInstance.grid[newX][newY] === cell) {
                        neighborStats.defense += classData.specialEffect.defenseBoost;
                    }
                }
            }
            break;

        // Les autres effets spéciaux peuvent être ajoutés ici
    }
}

export function getClassStats(className) {
    return AGENT_CLASSES[className]?.stats || AGENT_CLASSES[AGENT_CLASS_TYPES.VILLAGER].stats;
}

export function getClassIcon(className) {
    return AGENT_CLASSES[className]?.icon || AGENT_CLASSES[AGENT_CLASS_TYPES.VILLAGER].icon;
}