const canvas = document.querySelector('#gameCanvas')
const context = canvas.getContext('2d')

const gameState = {
    balls: [],
    bricks: [],
    paddle: {
        color: 'ff0000',
        position: {x: 7.2, y: 10},
        width: 2,
        height: 0.4,
        radius: 0.2,
        velocity: {x: 0, y: 0},
        isEllipse: true
    },
    width: 14.4,
    height: 10.8,
    lastUpdate: Date.now(),
    keys: {},
    lives: 2
}

resetLevel()
document.addEventListener('keydown', e => input(e.key, true))
document.addEventListener('keyup', e => input(e.key, false))
const gameInterval = setInterval(gameLoop, 1)
function gameLoop() {
    // get elapsed interval
    const now = Date.now()
    const dt = (now - gameState.lastUpdate) / (gameState.bullet ? 10000 : 1000)
    gameState.lastUpdate = now

    for (let i = 0; i < 4; i++) {
        if (!update(dt / 4)) {
            clearInterval(gameInterval)
            return
        }
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    draw(context)
}

function draw(context) {
    context.save()
    context.scale(100, 100)
    for (const ball of gameState.balls) {
        circle(ball.position.x, ball.position.y,
            ball.radius, ball.color)
    }
    for (const brick of gameState.bricks) {
        rect(brick.position.x, brick.position.y,
            brick.width, brick.height, brick.color)
    }
    const paddle = gameState.paddle
    if (paddle.isEllipse) {
        ellipse(paddle.position.x, paddle.position.y,
            paddle.width, paddle.height, paddle.color)
    } else {
        roundedRect(paddle.position.x, paddle.position.y,
            paddle.width, paddle.height, paddle.radius, paddle.color)
    }
    const newBall = paddle.shooting
    if (newBall) {
        circle(paddle.position.x,
            paddle.position.y - paddle.height / 2 - newBall.radius,
            newBall.radius, newBall.color)
    }
    context.restore()

    function circle(x, y, r, c) {
        context.beginPath()
        context.arc(x, y, r, 0, 2 * Math.PI)
        context.fillStyle = `#${c}`
        context.fill()
    }

    function ellipse(x, y, w, h, c) {
        context.save()
        context.translate(x, y)
        context.scale(w, h)
        context.beginPath()
        context.arc(0, 0, 0.5, 0, 2 * Math.PI)
        context.fillStyle = `#${c}`
        context.fill()
        context.restore()
    }
    
    function rect(x, y, w, h, c) {
        context.beginPath()
        context.rect(x - w / 2, y - h / 2, w, h)
        context.fillStyle = `#${c}`
        context.fill()
    }

    function roundedRect(x, y, w, h, r, c) {
        const offsets = [1, 1, -1, -1]
        r = Math.min(r, Math.min(w, h) / 2)
        rect(x, y, w, h - r * 2, c)
        rect(x, y, w - r * 2, h, c)
        for (let i = 0; i < 4; i++) {
            circle(x + offsets[i] * (w / 2 - r),
                y + offsets[(i + 1) % 4] * (h / 2 - r), r, c)
        }
    }
}

function input(key, value) {
    switch (key)
    {
        case 'ArrowLeft':
            gameState.keys.left = value
            break
        case 'ArrowRight':
            gameState.keys.right = value
            break
        case ' ':
            if (gameState.paddle.shooting) {
                gameState.paddle.shoot = value
            } else {
                gameState.bullet = value
            }
            break
    }
}

function update(dt){
    // check random powerups
    if (Math.random() < 1 - Math.pow(0.95, dt)) {
        const brickIndex = Math.floor(Math.random() * gameState.bricks.length)
        const brick = gameState.bricks[brickIndex]

        // pick random key from object (StackOverflow):
        // https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
        const effectNames = Object.keys(effects).filter(x => !gameState.bricks.some(y => y.effect == x))
        if (effectNames.length != 0) {
            const effectName = effectNames[Math.floor(Math.random() * effectNames.length)]
            const effect = effects[effectName]
            brick.color = effect.color
            brick.onBreak = effects[effectName].callback
            brick.effect = effectName
        }
    }

    const keys = gameState.keys
    for (const ball of gameState.balls) {
        ball.position.x += ball.velocity.x * dt
        ball.position.y += ball.velocity.y * dt
        
        // check collision
        const hitBricks = []
        for (const brick of gameState.bricks) {
            if (checkCollision(ball, brick)) {
                hitBricks.push(brick)
                brick.lastHit = ball
            }
        }
        checkCollision(ball, gameState.paddle)

        // damage hit bricks
        if (hitBricks.length) {
            for (const brick of hitBricks) {
                brick.health--
            }
            for (const brick of hitBricks.filter(x => x.health <= 0 && x.onBreak)) {
                brick.onBreak(brick.lastHit)
            }
            gameState.bricks = gameState.bricks.filter(x => x.health > 0)
        }

        // ball edge bounce logic
        if (ball.position.x < ball.radius) {
            if (ball.velocity.x < 0) {
                ball.position.x = 2 * ball.radius - ball.position.x
                ball.velocity.x *= -1
            }
        } else if (ball.position.x > gameState.width - ball.radius) {
            if (ball.velocity.x > 0) {
                ball.position.x = 2 * (gameState.width - ball.radius) - ball.position.x
                ball.velocity.x *= -1
            }
        } else if (ball.position.y < ball.radius) {
            if (ball.velocity.y < 0) {
                ball.position.y = 2 * ball.radius - ball.position.y
                ball.velocity.y *= -1
            }
        } else if (gameState.noWell && ball.position.y > gameState.height - ball.radius) {
            if (ball.velocity.y > 0) {
                ball.position.y = 2 * (gameState.height - ball.radius) - ball.position.y
                ball.velocity.y *= -1
            }
        }
    }

    const paddle = gameState.paddle
    gameState.balls = gameState.balls.filter(x => x.position.y < gameState.height + x.radius)
    if (!gameState.balls.length && !paddle.shooting) {
        if (gameState.lives <= 0) {
            alert("Out of lives - game over!")
            return false
        } else {
            gameState.lives--
            const newBall = {
                color: '0000ff',
                radius: 0.3,
                targetSpeed: 7.5
            }
            paddle.shooting = newBall
        }
    }

    paddle.position.x += paddle.velocity.x * dt
    paddle.position.y += paddle.velocity.y * dt

    // paddle edge bounce logic
    if (paddle.position.x < paddle.width / 2) {
        if (paddle.velocity.x < 0) {
            paddle.position.x = paddle.width - paddle.position.x
            paddle.velocity.x *= -0.4
        }
    } else if (paddle.position.x > gameState.width - paddle.width / 2) {
        if (paddle.velocity.x > 0) {
            paddle.position.x = 2 * gameState.width - paddle.width - paddle.position.x
            paddle.velocity.x *= -0.4
        }
    }

    // paddle control logic
    const powered = keys.left || keys.right
    const move = !keys.left != !keys.right
    if (keys.left || keys.right) {
        if (keys.left && keys.right) {
        } else if (keys.left) {
            paddle.velocity.x = Math.max(paddle.velocity.x - 60 * dt, -12)
        } else {
            paddle.velocity.x = Math.min(paddle.velocity.x + 60 * dt, 12)
        }
    } else {
        paddle.velocity.x *= Math.pow(0.5, dt)
    }

    const newBall = paddle.shooting
    if (paddle.shoot && paddle.shooting) {
        newBall.position = {
            x: paddle.position.x,
            y: paddle.position.y - paddle.height / 2 - newBall.radius
        }
        const velx = clamp(paddle.velocity.x, newBall.targetSpeed * -0.8,
            newBall.targetSpeed * 0.8)
        newBall.velocity = {
            x: velx,
            y: Math.sqrt(newBall.targetSpeed * newBall.targetSpeed - velx * velx)
        }
        paddle.shoot = paddle.shooting = undefined
        gameState.balls.push(newBall)
    }

    function checkCollision(ball, brick) {
        const absdx = Math.abs(ball.position.x - brick.position.x)
        const absdy = Math.abs(ball.position.y - brick.position.y)
        if (absdx > brick.width / 2 + ball.radius || absdy > brick.height / 2 + ball.radius) {
            return false
        }
        let relvx = ball.velocity.x
        let relvy = ball.velocity.y
        if (brick.velocity) {
            relvx -= brick.velocity.x
            relvy -= brick.velocity.y
        }
        let vectorImpact = false
        let impactX
        let impactY
        let impactThreshold
        if (brick.isEllipse) {
            const impactPoint = closestPointOnEllipse(
                brick.width / 2, brick.height / 2, {
                    x: ball.position.x - brick.position.x,
                    y: ball.position.y - brick.position.y
                })
            impactX = impactPoint.x + brick.position.x
            impactY = impactPoint.y + brick.position.y
            impactThreshold = ball.radius
            vectorImpact = true
        } else {
            if (absdx < brick.width / 2 - brick.radius) {
                if (ball.position.y < brick.position.y) {
                    if (ball.velocity.y > 0) {
                        relvy *= -1
                    }
                } else if (ball.position.y > brick.position.y) {
                    if (ball.velocity.y < 0) {
                        relvy *= -1
                    }
                }
            } else if (absdy < brick.height / 2 - brick.radius) {
                if (ball.position.x < brick.position.x) {
                    if (ball.velocity.x > 0) {
                        relvx *= -1
                    }
                } else if (ball.position.x > brick.position.x) {
                    if (ball.velocity.x < 0) {
                        relvx *= -1
                    }
                }
            } else {
                impactX = clamp(ball.position.x,
                    brick.position.x - brick.width / 2 + brick.radius,
                    brick.position.x + brick.width / 2 - brick.radius)
                impactY = clamp(ball.position.y,
                    brick.position.y - brick.height / 2 + brick.radius,
                    brick.position.y + brick.height / 2 - brick.radius)
                impactThreshold = ball.radius + brick.radius
                vectorImpact = true
            }
        }
        if (vectorImpact) {
            let impactVecX = ball.position.x - impactX
            let impactVecY = ball.position.y - impactY
            const impactVecLen = Math.sqrt(impactVecX * impactVecX
                + impactVecY * impactVecY)
            if (impactVecLen > impactThreshold) {
                return false
            }
            impactVecX /= impactVecLen
            impactVecY /= impactVecLen
            const impactDot = relvx * impactVecX
                + relvy * impactVecY
            if (impactDot > 0) {
                return false
            }
            relvx -= 2 * impactDot * impactVecX
            relvy -= 2 * impactDot * impactVecY
        }
        if (brick.velocity) {
            relvx += brick.velocity.x
            relvy += brick.velocity.y
        }
        const velLen = Math.sqrt(relvx * relvx + relvy * relvy) * 0.9
        const targetLen = clamp(velLen, ball.targetSpeed / 2, ball.targetSpeed * 1.5)
        const ratio = targetLen / velLen
        ball.velocity.x = relvx// * ratio
        ball.velocity.y = relvy// * ratio
        return true
    }

    function clamp(value, min, max) {
        if (value < min) {
            return min
        } else if (value > max) {
            return max
        } else {
            return value
        }
    }

    // get closest point on an ellipse (StackOverflow):
    // https://stackoverflow.com/questions/22959698/distance-from-given-point-to-given-ellipse
    function closestPointOnEllipse(semiaxisx, semiaxisy, p) {
        const px = Math.abs(p.x)
        const py = Math.abs(p.y)
        let tx = ty = 1 / Math.sqrt(2)   // roughly 0.7071067
        const a = semiaxisx
        const b = semiaxisy

        for (let i = 0; i < 3; i++) {
            const x = a * tx
            const y = b * ty

            const ex = (a * a - b * b) * tx ** 3 / a
            const ey = (b * b - a * a) * ty ** 3 / b

            const rx = x - ex
            const ry = y - ey
            const qx = px - ex
            const qy = py - ey

            const r = Math.sqrt(rx * rx + ry * ry)
            const q = Math.sqrt(qx * qx + qy * qy)

            tx = clamp((qx * r / q + ex) / a, 0, 1)
            ty = clamp((qy * r / q + ey) / b, 0, 1)
            const t = Math.sqrt(tx * tx + ty * ty)
            tx /= t
            ty /= t
        }

        return {
            x: Math.abs(a * tx) * Math.sign(p.x),
            y: Math.abs(b * ty) * Math.sign(p.y)
        }
    }

    return true
}

function resetLevel()
{
    gameState.balls = [
        {
            color: '0000ff',
            position: {x: 4.95, y: 6.5},
            // position: {x: 7.2, y: 9.6},
            radius: 0.3,
            velocity: {x: 4.5, y: 6},
            // velocity: {x: 4, y: -4},
            targetSpeed: 7.5
        }
    ]
    gameState.bricks = []
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 16; x++) {
            const brick = {
                color: 'bababa',
                position: {x: x * 0.9 + 0.45, y: y * 0.5 + 2.6},
                width: 0.9,
                height: 0.5,
                radius: 0,
                health: 1
            }
            gameState.bricks.push(brick)
        }
    }

    // gameState.bricks.push({
    //     color: '000',
    //     position: {x: 10.2, y: 6.6 },
    //     width: 1,
    //     height: 1,
    //     radius: 0,
    //     health: Infinity
    // })

    gameState.paddle.position.x = 7.2
    gameState.paddle.velocity.x = 0
}

const effects = {
    widePaddle: {
        color: 'ba00ff',
        callback: _ => {
        gameState.paddle.width *= 2
    }},
    tinyPaddle: {
        color: 'ff0000',
        callback: _ => {
        gameState.paddle.width /= 2
    }},
    multiball: {
        color: '0000ff',
        callback: ball => {
        const velx = ball.velocity.x
        const vely = ball.velocity.y
        const velLen = Math.sqrt(velx * velx + vely * vely)
        for (let i = 0; i < 2; i++) {
            const angle = 2 * Math.PI * Math.random()
            gameState.balls.push({
                color: ball.color,
                position: {x: ball.position.x, y: ball.position.y},
                radius: ball.radius,
                velocity: {x: velLen * Math.cos(angle), y: velLen * Math.sin(angle)},
                targetSpeed: ball.targetSpeed
            })
        }
    }}
}