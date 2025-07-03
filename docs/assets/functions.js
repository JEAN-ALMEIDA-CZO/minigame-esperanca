
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const messageDiv = document.getElementById('message');
        const levelMessageDiv = document.getElementById('level-message');
        const gameOverMessageDiv = document.getElementById('game-over-message');
        const scoreDiv = document.getElementById('score');
        const livesDiv = document.getElementById('lives');
        const hearts = document.querySelectorAll('.heart');
        const pauseButton = document.getElementById('pause-button');
        const pauseIcon = document.getElementById('pause-icon');
        const playIcon = document.getElementById('play-icon');
        const modal = document.getElementById('modal');
        const continueButton = document.getElementById('continue-button');
        const restartButton = document.getElementById('restart-button');
        const tryAgainButton = document.getElementById('try-again-button');
        const backgroundMusic = document.getElementById('background-music');
        const lightSound = document.getElementById('light-sound');
        const obstacleSound = document.getElementById('obstacle-sound');
        const victorySound = document.getElementById('victory-sound');
        const cssSky = document.getElementById('css-sky');
        const sunSvg = document.getElementById('sun');
        const moonSvg = document.getElementById('moon');
        const soundModal = document.getElementById('sound-modal');
        const activateSoundButton = document.getElementById('activate-sound-button');
        const deactivateSoundButton = document.getElementById('deactivate-sound-button');
        const victoryModal = document.getElementById('victory-modal');
        const victoryMessageText = document.getElementById('victory-message-text');
        const copyMessageButton = document.getElementById('copy-message-button');

        const player = {
            x: 50,
            y: 368,
            width: 32,
            height: 32,
            jumpPower: 11,
            shortJumpPower: 8, //pulo curto
            vy: 0,
            gravity: 0.4,
            grounded: false,
            jumpCount: 0,
            maxJumps: 1, // Inicialmente permite apenas um pulo
            history: []
        };

        const moon = {
            x: canvas.width + 110,
            y: 20,
            width: 110,
            height: 110
        };

        let lives = 6;
        let lights = [];
        let backgroundLights = [];
        let obstacles = [];

        let powerUps = []; 
        let isImmune = false;
        let immunityTimer = 0;

        let score = 0;
        let currentLevel = 1;
        let gameOver = false;
        let paused = false;
        let showingLevelScreen = true;
        let isDay = false;
        let showMoon = false;
        let moonTimer = 0;
        let gameSpeed = 2.0;
        let moonSpeed = gameSpeed * 0.2;
        let time = 0;
        let blinkTimer = 0;
        let blinkAlpha = 1;
        let obstacleProbMultiplier = 1.0;
        let isMusicStarted = false;
        let soundEnabled = false;

        let lastTime = 0;
        //Array de probabilidade de aparecer as luzes
        const lightProbs = [0.01, 0.009, 0.0081, 0.00729, 0.006561, 0.0059049, 0.00531441, 0.00478297, 0.00430467, 0.0038742];
        const messages = [
            "Você é fera, não desiste nunca!",
            "Força total, cada passo é vitória!",
            "Manda ver, o jogo é teu!",
            "Tá voando, segue com tudo!",
            "Garra de campeão, continua brilhando!"
        ];

       const levelMessages = [
            "Nível 1 no bolso! Começou com tudo, segue firme!",
            "Nível 2 dominado! Mostrou quem manda, vai além!",
            "Nível 3 concluído! Obstáculos? Você passa por cima!",
            "Nível 4 vencido! Cada pulo é um show de garra!",
            "Nível 5 na conta! Tua força é bruta, continua!",
            "Nível 6 liquidado! Nada te para, é só acelerar!",
            "Nível 7 conquistado! Tô impressionado, tu é fera!",
            "Nível 8 arrasado! Guerreiro total, segue brilhando!",
            "Nível 9 no talo! Quase lá, tua luz é imbatível!",
            "Nível 10 dominado! Achou a glória, tu é lendário!"
        ];

        //Quantidade de luzes por nível
        const levelGoals = [10, 17, 24, 30, 37, 44, 50, 57, 64, 70];
        //Velocidade por nível
        const levelSpeeds = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5];
        //Array de probabilidade de aparecer os obstaculos
        const levelObstacleProbs = [0.004, 0.0056, 0.0072, 0.0088, 0.0104, 0.012, 0.0136, 0.0152, 0.0168, 0.0184];

        function updateHearts() {
            hearts.forEach((heart, index) => {
                if (index < lives) {
                    heart.classList.remove('dimmed');
                } else {
                    heart.classList.add('dimmed');
                }
            });
        }

        const keys = { jump: false };
        document.addEventListener('keydown', (e) => {
            if (soundEnabled && !isMusicStarted && !gameOver && !paused && e.key === ' ') {
                backgroundMusic.play().catch(err => console.log("Música iniciada após interação."));
                isMusicStarted = true;
            }

            if (gameOver || paused || showingLevelScreen) return;
            if (e.key === ' ') {
                keys.jump = true;
                if (player.grounded) {
                    player.vy = -player.jumpPower;
                    player.grounded = false;
                    player.jumpCount = 1;
                    // Se estiver imune, permite mais pulos (para simular pulo duplo normal na aura)
                    player.maxJumps = isImmune ? 2 : 1;
                } else if (player.jumpCount < player.maxJumps) {
                    // Pulo duplo: curto no modo normal, normal com a aura
                    player.vy = isImmune ? -player.jumpPower : -player.shortJumpPower;
                    player.jumpCount++;
                }
            }
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'))) {
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === ' ') keys.jump = false;
        });
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !gameOver && !showingLevelScreen && !paused) {
                paused = true;
                pauseIcon.style.display = 'none';
                playIcon.style.display = 'block';
                modal.style.display = 'block';
                if (soundEnabled) {
                    backgroundMusic.pause();
                }
            }
        });

        pauseButton.addEventListener('click', () => {
            if (showingLevelScreen || gameOver) return;
            paused = !paused;
            pauseIcon.style.display = paused ? 'none' : 'block';
            playIcon.style.display = paused ? 'block' : 'none';
            modal.style.display = paused ? 'block' : 'none';
            if (soundEnabled) {
                if (paused) {
                    backgroundMusic.pause();
                } else {
                    backgroundMusic.play();
                    isMusicStarted = true;
                }
            }
        });
        continueButton.addEventListener('click', () => {
            paused = false;
            pauseIcon.style.display = 'block';
            playIcon.style.display = 'none';
            modal.style.display = 'none';
            if (soundEnabled) {
                backgroundMusic.play();
                isMusicStarted = true;
            }
        });
        restartButton.addEventListener('click', () => {
            resetGame();
            paused = false;
            pauseIcon.style.display = 'block';
            playIcon.style.display = 'none';
            modal.style.display = 'none';
            if (soundEnabled) {
                backgroundMusic.play();
                isMusicStarted = true;
            }
        });
        tryAgainButton.addEventListener('click', () => {
            resetGame();
            gameOver = false;
            tryAgainButton.style.display = 'none';
            gameOverMessageDiv.style.display = 'none';
            if (soundEnabled) {
                backgroundMusic.play();
                isMusicStarted = true;
            }
        });

        // Controle de volume
        activateSoundButton.addEventListener('click', () => {
            soundEnabled = true;
            backgroundMusic.volume = 0.4;
            lightSound.volume = 0.5;
            obstacleSound.volume = 0.4;
            victorySound.volume = 0.6;
            soundModal.style.display = 'none';
            backgroundMusic.play();
            isMusicStarted = true;

            requestAnimationFrame(gameLoop);
        });

        deactivateSoundButton.addEventListener('click', () => {
            soundEnabled = false;
            backgroundMusic.volume = 0;
            lightSound.volume = 0;
            obstacleSound.volume = 0;
            victorySound.volume = 0;
            soundModal.style.display = 'none';

            requestAnimationFrame(gameLoop);
        });


        function copyMessageToClipboard() {
            const message = victoryMessageText.textContent;
            navigator.clipboard.writeText(message).then(() => {
                alert("Mensagem copiada para a área de transferência!");
            }).catch(err => {
                console.error("Erro ao copiar mensagem: ", err);
                alert("Erro ao copiar a mensagem.");
            });
        }
        copyMessageButton.addEventListener('click', copyMessageToClipboard);


        function spawnObjects() {
            if (Math.random() < 0.08) {
                backgroundLights.push({
                    x: canvas.width,
                    y: Math.random() * 130,
                    width: 5,
                    height: 5,
                    alpha: Math.random() * 0.7 + 0.3
                });
            }
            if (Math.random() < lightProbs[currentLevel - 1]) {
                lights.push({
                    x: canvas.width,
                    y: Math.random() * 150 + 200,
                    width: 10,
                    height: 10
                });
            }
            if (Math.random() < levelObstacleProbs[currentLevel - 1] * obstacleProbMultiplier) {
                const baseHeight = 30 + (currentLevel - 1) * 3;
                obstacles.push({
                    x: canvas.width,
                    y: canvas.height - baseHeight,
                    width: 25 + (currentLevel - 1) * 3,
                    baseHeight: baseHeight,
                    height: baseHeight,
                    type: 'barreira'
                });
            }

            //  Lógica para criar o power-up raro
            if (Math.random() < 0.001) { // Chance muito baixa de aparecer
                powerUps.push({
                    x: canvas.width,
                    y: Math.random() * 150 + 200,
                    width: 15,
                    height: 15
                });
            }
        }

        function checkCollisions() {
            lights = lights.filter(light => {
                if (player.x < light.x + light.width &&
                    player.x + player.width > light.x &&
                    player.y < light.y + light.height &&
                    player.y + player.height > light.y) {
                    score++;
                    if (soundEnabled) {
                        lightSound.currentTime = 0;
                        try {
                            lightSound.play().catch(e => console.log("Erro ao tocar som da luz:", e));
                        } catch (e) {
                            console.log("Erro ao tocar som da luz:", e);
                        }
                    }
                    scoreDiv.textContent = `Nível: ${currentLevel} | Luzes: ${score}/${levelGoals[currentLevel - 1]}`;
                    if (score === Math.ceil(levelGoals[currentLevel - 1] / 2)) {
                        showMessage(messages[Math.floor(Math.random() * messages.length)]);
                    }
                    return false;
                }
                return true;
            });

            //  Checa colisão com o power-up
            powerUps = powerUps.filter(powerUp => {
                if (player.x < powerUp.x + powerUp.width &&
                    player.x + player.width > powerUp.x &&
                    player.y < powerUp.y + powerUp.height &&
                    player.y + player.height > powerUp.y) {

                    isImmune = true;
                    immunityTimer = 5; // 5 segundos de imunidade
                    player.maxJumps = 2; // Permite 2 pulos normais com a aura

                    if (soundEnabled) {
                        lightSound.currentTime = 0;
                        lightSound.play();
                    }
                    return false; // Remove o power-up da tela
                }
                return true;
            });


            for (const obstacle of obstacles) {
                if (player.x < obstacle.x + obstacle.width &&
                    player.x + player.width > obstacle.x &&
                    player.y < obstacle.y + obstacle.height &&
                    player.y + player.height > obstacle.y) {

                    //  Ignora colisão se estiver imune
                    if (isImmune) {
                        return false;
                    }

                    const landingThreshold = 5;
                    if (player.vy >= 0 && (player.y + player.height - player.vy) <= (obstacle.y + landingThreshold)) {
                        player.y = obstacle.y - player.height;
                        player.vy = 0;
                        player.grounded = true;
                        player.jumpCount = 0;
                        player.maxJumps = 1; // Reseta maxJumps para 1 ao tocar no chão
                        return false;
                    } else {
                        messageDiv.style.display = 'none';
                        if (soundEnabled) {
                            obstacleSound.currentTime = 0;
                            try {
                                obstacleSound.play().catch(e => console.log("Erro ao tocar som do obstáculo:", e));
                            } catch (e) {
                                console.log("Erro ao tocar som do obstáculo:", e);
                            }
                        }
                        lives--;
                        updateHearts();
                        if (lives <= 0) {
                            showGameOverMessage("Não desista! Você é mais forte que os obstáculos.", false);
                            return true;
                        }
                        
                        else {
                            resetLevel();
                            return false;
                        }
                    }
                }
            }
            return false;
        }

        function showMessage(text) {
            messageDiv.textContent = text;
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }

        function showLevelMessage(text) {
            levelMessageDiv.textContent = text;
            levelMessageDiv.style.display = 'block';
            setTimeout(() => {
                levelMessageDiv.style.display = 'none';
                showingLevelScreen = false;
                isDay = false;
                document.body.style.background = '#1a1a2e';
                cssSky.style.display = 'none';
                sunSvg.style.display = 'none';
                moonTimer = 0;
                moon.x = canvas.width + moon.width;
                showMoon = false;
                moonSvg.style.display = 'none';
            }, 2000);
        }

        function showGameOverMessage(text, isVictory = false) {
            gameOver = true;
            if (soundEnabled) {
                backgroundMusic.pause();
            }

            if (isVictory) {
                victoryMessageText.textContent = text;
                victoryModal.style.display = 'flex'; 
                gameOverMessageDiv.style.display = 'none'; 
                tryAgainButton.style.display = 'none'; 
            } else {
                gameOverMessageDiv.textContent = text;
                gameOverMessageDiv.style.display = 'block';
                tryAgainButton.style.display = 'flex'; 
                victoryModal.style.display = 'none'; 
            }
        }


        function resetLevel() {
            player.x = 50;
            player.y = 368;
            player.vy = 0;
            player.grounded = true;
            player.jumpCount = 0;
            player.maxJumps = 1; // Garante que volta para 1 pulo após resetar o nível
            player.history = [];
            obstacles = [];
            lights = [];
            powerUps = [];
            isImmune = false; // Reseta a imunidade
            immunityTimer = 0;
            backgroundLights = [];
            score = 0;
            gameSpeed = levelSpeeds[currentLevel - 1];
            moonSpeed = gameSpeed * 0.3;
            obstacleProbMultiplier = 1.0;
            isDay = false;
            showMoon = false;
            moonTimer = 0;
            moon.x = canvas.width + moon.width;
            document.body.style.background = '#1a1a2e';
            cssSky.style.display = 'none';
            sunSvg.style.display = 'none';
            moonSvg.style.display = 'none';
            scoreDiv.textContent = `Nível: ${currentLevel} | Luzes: ${score}/${levelGoals[currentLevel - 1]}`;
            showingLevelScreen = true;
            showLevelMessage(`Nível ${currentLevel}`);
        }

        function resetGame() {
            currentLevel = 1;
            score = 0;
            lives = 6;
            updateHearts();
            gameOver = false;
            paused = false;
            showingLevelScreen = true;
            obstacles = [];
            lights = [];
            powerUps = [];
            isImmune = false;
            immunityTimer = 0;
            backgroundLights = [];
            gameSpeed = levelSpeeds[0];
            moonSpeed = gameSpeed * 0.3;
            obstacleProbMultiplier = 1.0;
            player.x = 50;
            player.y = 368;
            player.vy = 0;
            player.grounded = true;
            player.jumpCount = 0;
            player.maxJumps = 1; // Garante que volta para 1 pulo ao reiniciar o jogo
            player.history = [];
            isDay = false;
            showMoon = false;
            moonTimer = 0;
            moon.x = canvas.width + moon.width;
            document.body.style.background = '#1a1a2e';
            cssSky.style.display = 'none';
            sunSvg.style.display = 'none';
            moonSvg.style.display = 'none';
            scoreDiv.textContent = `Nível: ${currentLevel} | Luzes: ${score}/${levelGoals[currentLevel - 1]}`;
            showLevelMessage(`Nível ${currentLevel}`);
            tryAgainButton.style.display = 'none';
            victoryModal.style.display = 'none'; 
            gameOverMessageDiv.style.display = 'none';
        }

        function nextLevel() {

            if (currentLevel >= 5 && lives < 6) {
                lives = Math.min(lives + 1, 6); // Add 1 coração, upa até o 5° coração
                updateHearts();
            }
            // Mensagem de vitória ao chegar nível 10
            currentLevel++;
            if (currentLevel > 10) {

                if (soundEnabled) {
                    backgroundMusic.pause();
                    victorySound.currentTime = 0;
                    victorySound.play().catch(e => console.log("Erro ao tocar som da vitória:", e));
                }
                const victoryMessage = "Parabéns! Você alcançou a vitória! Lembre-se, cada obstáculo superado na vida te torna mais forte. Acredite em sua capacidade de brilhar e siga em frente com sua luz interior. Você é imparável!";
                showGameOverMessage(victoryMessage, true);
                gameOver = true;
                return;
            }
            score = 0;
            obstacles = [];
            lights = [];
            powerUps = [];
            isImmune = false;
            immunityTimer = 0;
            backgroundLights = [];
            gameSpeed = levelSpeeds[currentLevel - 1];
            moonSpeed = gameSpeed * 0.3;
            obstacleProbMultiplier = 1.0;
            player.history = [];
            showingLevelScreen = true;
            isDay = true;
            document.body.style.background = '#87CEEB';
            cssSky.style.display = 'block';
            sunSvg.style.display = 'block';
            messageDiv.style.display = 'none';
            moonSvg.style.display = 'none';
            moonTimer = 0;
            moon.x = canvas.width + moon.width;
            showMoon = false;
            moonSvg.style.right = `${canvas.width - moon.x}px`;
            showLevelMessage(levelMessages[currentLevel - 2]);
            scoreDiv.textContent = `Nível: ${currentLevel} | Luzes: ${score}/${levelGoals[currentLevel - 1]}`;
        }

        function update(deltaTime) {
            if (gameOver || paused || showingLevelScreen) return;

            const scale = deltaTime * 60;

            player.vy += player.gravity * scale;
            player.y += player.vy * scale;

            if (player.y > canvas.height - player.height) {
                player.y = canvas.height - player.height;
                player.vy = 0;
                player.grounded = true;
                player.jumpCount = 0;
                player.maxJumps = 1;
            }

            //  Controla o timer e a aura
            if (isImmune) {
                immunityTimer -= deltaTime;
                player.history.push({ x: player.x, y: player.y, width: player.width, height: player.height });
                if (player.history.length > 20) {
                    player.history.shift();
                }
                if (immunityTimer <= 0) {
                    isImmune = false;
                    player.history = [];
                    player.maxJumps = 1; // Volta para 1 pulo quando a imunidade acaba
                }
            }

            player.history.forEach(segment => {
                segment.x -= gameSpeed * scale;
            });

            lights.forEach(light => light.x -= gameSpeed * scale);
            powerUps.forEach(powerUp => powerUp.x -= gameSpeed * scale);
            backgroundLights.forEach(light => {
                light.x -= gameSpeed * scale;
                if (Math.random() < 0.05) {
                    light.alpha = Math.random() * 0.7 + 0.3;
                }
            });
            obstacles.forEach(obstacle => {
                obstacle.x -= gameSpeed * scale;
                obstacle.height = Math.max(20, obstacle.baseHeight + Math.sin(time * 0.05) * (10 + (currentLevel - 1) * 2));
                obstacle.y = canvas.height - obstacle.height;
            });

            if (!isDay) {
                moonTimer++;
                if (moonTimer >= 500 && !showMoon) {
                    showMoon = true;
                    moon.x = canvas.width + moon.width;
                    moonSvg.style.right = `${canvas.width - moon.x}px`;
                }
                if (showMoon) {
                    moon.x -= moonSpeed * scale;
                    moonSvg.style.right = `${canvas.width - moon.x}px`;
                    if (moon.x < -moon.width) {
                        showMoon = false;
                        moonTimer = 0;
                        moon.x = canvas.width + moon.width;
                    }
                }
            }

            lights = lights.filter(light => light.x > -light.width);
            powerUps = powerUps.filter(powerUp => powerUp.x > -powerUp.width);
            backgroundLights = backgroundLights.filter(light => light.x > -light.width);
            obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);

            if (!isDay) spawnObjects();

            obstacleProbMultiplier = Math.min(obstacleProbMultiplier + 0.0001, 3.0);

            if (checkCollisions()) return;

            if (score >= levelGoals[currentLevel - 1]) {
                nextLevel();
            }

            blinkTimer++;
            if (blinkTimer % 30 === 0) {
                blinkAlpha = blinkAlpha === 1 ? 0.5 : 1;
            }

            time++;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (isDay) {
                ctx.fillStyle = 'rgba(0,0,0,0)';
            } else {
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#162447');
                gradient.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = gradient;
            }
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            sunSvg.style.display = isDay ? 'block' : 'none';
            moonSvg.style.display = (!isDay && showMoon) ? 'block' : 'none';

            if (!isDay) {
                backgroundLights.forEach(light => {
                    ctx.globalAlpha = light.alpha;
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(light.x + light.width / 2, light.y + light.height / 2, light.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;
                });
            }

            lights.forEach(light => {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(light.x + light.width / 2, light.y + light.height / 2, light.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            //  Desenha o power-up arco-íris
            powerUps.forEach(powerUp => {
                const hue = (time * 5) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            if (isImmune && player.history.length > 0) { // Só desenha a aura se estiver imune
                for (let i = 0; i < player.history.length; i++) {
                    const pos = player.history[i];
                    const alpha = (i / player.history.length) * 0.5;
                    const hue = (time + i * 10) % 360;
                    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;

                    const radius = 8;
                    ctx.beginPath();
                    ctx.moveTo(pos.x + radius, pos.y);
                    ctx.lineTo(pos.x + pos.width - radius, pos.y);
                    ctx.arcTo(pos.x + pos.width, pos.y, pos.x + pos.width, pos.y + radius, radius);
                    ctx.lineTo(pos.x + pos.width, pos.y + pos.height - radius);
                    ctx.arcTo(pos.x + pos.width, pos.y + pos.height, pos.x + pos.width - radius, pos.y + pos.height, radius);
                    ctx.lineTo(pos.x + radius, pos.y + pos.height);
                    ctx.arcTo(pos.x, pos.y + pos.height, pos.x, pos.y + pos.height - radius, radius);
                    ctx.lineTo(pos.x, pos.y + radius);
                    ctx.arcTo(pos.x, pos.y, player.x + radius, pos.y, radius);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            const progress = Math.min(score / levelGoals[currentLevel - 1], 1);
            const r = Math.round(51 + (255 - 51) * progress);
            const g = r;
            const b = r;

            ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowBlur = isImmune ? 30 : 20;
            ctx.fillStyle = '#ffec99';
            const radius = 8;
            ctx.beginPath();
            ctx.moveTo(player.x + radius, player.y);
            ctx.lineTo(player.x + player.width - radius, player.y);
            ctx.arcTo(player.x + player.width, player.y, player.x + player.width, player.y + radius, radius);
            ctx.lineTo(player.x + player.width, player.y + player.height - radius);
            ctx.arcTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height, radius);
            ctx.lineTo(player.x + radius, player.y + player.height);
            ctx.arcTo(player.x, player.y + player.height, player.x, player.y + player.height - radius, radius);
            ctx.lineTo(player.x, player.y + radius);
            ctx.arcTo(player.x, player.y, player.x + radius, player.y, radius);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            obstacles.forEach(obstacle => {
                ctx.globalAlpha = blinkAlpha;
                ctx.fillStyle = '#655ec4';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                ctx.globalAlpha = 1;
            });
        }

        function gameLoop(currentTime) {
            if (lastTime === 0) {
                lastTime = currentTime;
            }
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            update(deltaTime);
            draw();
            requestAnimationFrame(gameLoop);
        }

        window.onload = function() {

            soundModal.style.display = 'flex';
            updateHearts();
            gameSpeed = levelSpeeds[currentLevel - 1];
            showLevelMessage(`Nível ${currentLevel}`);
        };