const levelData = []
populateLevelData()

function populateLevelData() {
    const one = Array(16).fill(1)

    const brickHealths = [
        [[], [], [], [], one, one, one, one, one],
        [[], [],
            [0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 0, 0],
            [0, 0, 2, 2, 2, 0, 2, 1,
                1, 2, 0, 2, 2, 2, 0, 0],
            [0, 0, 0, 0, 0, 0, 2, 1,
                1, 2, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 2, 1,
                1, 2, 0, 0, 0, 0, 0, 0],
            [2, 2, 2, 2, 2, 2, 3, 3,
                3, 3, 2, 2, 2, 2, 2, 2],
            [1, 1, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 1, 1]
        ]
    ]
    const brickPowerups = [
        [[], [], [], [], [], [
            0, 0, 0, 'multiball',
            0, 0, 0, 0, 0, 0, 0, 0,
            'widePaddle', 0, 0, 0
        ]],
        [[], [], [], [], [
            0, 0, 0, 'widePaddle',
            0, 0, 0, 0, 0, 0, 0, 0,
            'multiball', 0, 0, 0
        ], [], [], [], [], [], [
            0, 0, 0, 0, 'tinyPaddle',
            0, 0, 0, 0, 0, 0,
            'tinyPaddle', 0, 0, 0, 0
        ]]
    ]
    
    for (let i = 0; i < brickHealths.length; i++) {
        const levelHealths = brickHealths[i]
        const levelPowerups = brickPowerups[i]
        const level = {}
        const bricks = []
        for (let y = 0; y < 16; y++) {
            if (!levelHealths[y]) {
                continue
            }
            for (let x = 0; x < 16; x++) {
                if (levelHealths[y][x]) {
                    const brick = {
                        position: { x: x * 0.9 + 0.45, y: y * 0.5 + 0.25 },
                        width: 0.9,
                        height: 0.5,
                        radius: 0,
                        health: levelHealths[y][x]
                    }
                    if (levelPowerups[y] && levelPowerups[y][x]) {
                        brick.onBreak = levelPowerups[y][x]
                    }
                    bricks.push(brick)
                }
            }
        }
        level.bricks = bricks
        levelData.push(level)
    }
}