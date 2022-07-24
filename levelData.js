const levelData = []
populateLevelData()

function populateLevelData() {
    const one = Array(16).fill(1)

    const brickHealths = [
        [[], [], [], [], one, one, one, one, one]
    ]
    
    for (const levelHealths of brickHealths) {
        const level = []
        for (let y = 0; y < 16; y++) {
            if (!levelHealths[y]) {
                continue
            }
            for (let x = 0; x < 16; x++) {
                if (levelHealths[y][x]) {
                    level.push({
                        position: { x: x * 0.9 + 0.45, y: y * 0.5 + 0.25 },
                        width: 0.9,
                        height: 0.5,
                        radius: 0,
                        health: levelHealths[y][x]
                    })
                }
            }
        }
        levelData.push(level)
    }
}