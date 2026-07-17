(function() {
    // 1. DYNAMICALLY INJECT STRUCTURE AND STYLE
    // This replicates the HTML container and canvas purely inside the JS runtime environment
    const container = document.createElement('div');
    container.style.cssText = "max-width: 650px; margin: 0 auto; font-family: sans-serif; background: rgb(249,249,249); padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";

    const controls = document.createElement('div');
    controls.style.cssText = "margin-bottom: 10px; display: flex; gap: 10px; align-items: center;";

    const playPauseBtn = document.createElement('button');
    playPauseBtn.textContent = 'Pause';
    playPauseBtn.style.cssText = "padding: 6px 12px; cursor: pointer;";

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = "padding: 6px 12px; cursor: pointer;";

    const label = document.createElement('label');
    label.innerHTML = 'Speed: <input type="range" min="1" max="5" value="2" style="vertical-align: middle;">';
    const speedSlider = label.querySelector('input');

    controls.appendChild(playPauseBtn);
    controls.appendChild(resetBtn);
    controls.appendChild(label);

    const canvas = document.createElement('canvas');
    canvas.width = 650;
    canvas.height = 350;
    canvas.style.cssText = "background: white; border: 1px solid rgb(204,204,204); display: block; width: 100%; max-width: 650px;";

    const tallyBox = document.createElement('div');
    tallyBox.style.cssText = "margin-top: 10px; max-height: 120px; overflow-y: auto; background: rgb(238,238,238); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px;";
    tallyBox.innerHTML = '<strong>Non-Associative Counterexamples Found:</strong><div id="tallyList" style="margin-top: 5px; color: rgb(179,0,0);">None yet.</div>';
    const tallyList = tallyBox.querySelector('#tallyList');

    container.appendChild(controls);
    container.appendChild(canvas);
    container.appendChild(tallyBox);

    // Ximera Safety Hook: Find the script execution context element and attach container right before it
    const currentScript = document.currentScript || Array.from(document.getElementsByTagName('script')).pop();
    currentScript.parentNode.insertBefore(container, currentScript);

    // 2. CORE ANIMATION ENGINE LOGIC
    const ctx = canvas.getContext('2d');
    const table = [[0, 1, 2], [1, 0, 0], [2, 1, 1]];
    const elementColors = { 0: 'rgb(231,76,60)', 1: 'rgb(241,196,15)', 2: 'rgb(155,89,182)' };
    
    let isPlaying = true;
    let animationSpeed = 2; 
    let currentTriplet = { a: 0, b: 0, c: 0 };
    let phase = 0; 
    let phaseProgress = 0;
    const counterexamples = [];

    const gridOffset = { x: 50, y: 70 };
    const cellSize = 50;

    function getCellCenter(row, col) {
        return { x: gridOffset.x + col * cellSize + cellSize / 2, y: gridOffset.y + row * cellSize + cellSize / 2 };
    }

    playPauseBtn.onclick = () => {
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
    };

    resetBtn.onclick = () => {
        currentTriplet = { a: 0, b: 0, c: 0 };
        phase = 0;
        phaseProgress = 0;
        counterexamples.length = 0;
        tallyList.innerHTML = 'None yet.';
    };

    function updateLogic() {
        if (!isPlaying) return;
        phaseProgress += 0.01 * animationSpeed;
        if (phaseProgress >= 1) {
            phaseProgress = 0;
            phase++;
            if (phase > 3) {
                phase = 0;
                currentTriplet.c++;
                if (currentTriplet.c > 2) {
                    currentTriplet.c = 0;
                    currentTriplet.b++;
                    if (currentTriplet.b > 2) {
                        currentTriplet.b = 0;
                        currentTriplet.a++;
                        if (currentTriplet.a > 2) {
                            currentTriplet.a = 0; 
                            counterexamples.length = 0;
                            tallyList.innerHTML = 'None yet (Restarted loop).';
                        }
                    }
                }
            }
        }
    }

    function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const { a, b, c } = currentTriplet;
        
        ctx.strokeStyle = 'rgb(51,51,51)';
        ctx.lineWidth = 2;
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgb(0,0,0)';
        
        ctx.fillText("a \\ b", gridOffset.x - 40, gridOffset.y - 15);
        for(let i=0; i<3; i++) {
            ctx.fillText(i, gridOffset.x + i*cellSize + 20, gridOffset.y - 15);
            ctx.fillText(i, gridOffset.x - 25, gridOffset.y + i*cellSize + 30);
        }

        for (let r = 0; r < 3; r++) {
            for (let col = 0; col < 3; col++) {
                ctx.fillStyle = elementColors[table[r][col]];
                ctx.fillRect(gridOffset.x + col * cellSize, gridOffset.y + r * cellSize, cellSize, cellSize);
                ctx.strokeRect(gridOffset.x + col * cellSize, gridOffset.y + r * cellSize, cellSize, cellSize);
            }
        }

        const ab = table[a][b];
        const bc = table[b][c];
        const leftFinal = table[ab][c];
        const rightFinal = table[a][bc];

        let blackPos = { x: 450, y: 120 };
        let bluePos = { x: 450, y: 220 };
        let mergeColor = null;

        const pos_a_b = getCellCenter(a, b);
        const pos_ab_c = getCellCenter(ab, c);
        const pos_b_c = getCellCenter(b, c);
        const pos_a_bc = getCellCenter(a, bc);

        if (phase === 0) {
            blackPos.x = lerp(450, pos_a_b.x, phaseProgress);
            blackPos.y = lerp(120, pos_a_b.y, phaseProgress);
            bluePos.x = lerp(450, pos_b_c.x, phaseProgress);
            bluePos.y = lerp(220, pos_b_c.y, phaseProgress);
        } else if (phase === 1) {
            blackPos = pos_a_b;
            bluePos = pos_b_c;
        } else if (phase === 2) {
            blackPos.x = lerp(pos_a_b.x, pos_ab_c.x, phaseProgress);
            blackPos.y = lerp(pos_a_b.y, pos_ab_c.y, phaseProgress);
            bluePos.x = lerp(pos_b_c.x, pos_a_bc.x, phaseProgress);
            bluePos.y = lerp(pos_b_c.y, pos_a_bc.y, phaseProgress);
        } else if (phase === 3) {
            const targetX = 520;
            const targetY = 170;
            blackPos.x = lerp(pos_ab_c.x, targetX, phaseProgress);
            blackPos.y = lerp(pos_ab_c.y, targetY, phaseProgress);
            bluePos.x = lerp(pos_a_bc.x, targetX, phaseProgress);
            bluePos.y = lerp(pos_a_bc.y, targetY, phaseProgress);

            if (phaseProgress > 0.6) {
                if (leftFinal === rightFinal) {
                    mergeColor = 'rgb(46,204,113)'; 
                } else {
                    mergeColor = 'rgb(231,76,60)'; 
                    const key = `(${a}*${b})*${c} = ${leftFinal} != ${a}*(${b}*${c}) = ${rightFinal}`;
                    if (!counterexamples.includes(key)) {
                        counterexamples.push(key);
                        tallyList.innerHTML = counterexamples.join('<br>');
                    }
                }
            }
        }

        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`Testing Triplet: (a=${a}, b=${b}, c=${c})`, 350, 40);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgb(17,17,17)';
        ctx.fillText(`Black Box: (${a} * ${b}) * ${c} = ${phase > 0 ? ab : '?'} * ${c} = ${phase > 2 ? leftFinal : '?'}`, 350, 90);
        ctx.fillStyle = 'rgb(0,102,204)';
        ctx.fillText(`Blue Box: ${a} * (${b} * ${c}) = ${a} * ${phase > 0 ? bc : '?'} = ${phase > 2 ? rightFinal : '?'}`, 350, 250);

        ctx.strokeStyle = 'rgb(153,153,153)';
        ctx.lineWidth = 1;
        ctx.strokeRect(480, 135, 80, 70);
        ctx.fillStyle = 'rgb(85,85,85)';
        ctx.font = '12px sans-serif';
        ctx.fillText("Meld Unit", 493, 130);

        if (mergeColor) {
            ctx.fillStyle = mergeColor;
            ctx.fillRect(blackPos.x - 12, blackPos.y - 12, 24, 24);
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.strokeRect(blackPos.x - 12, blackPos.y - 12, 24, 24);
        } else {
            ctx.fillStyle = 'rgb(34,34,34)';
            ctx.fillRect(blackPos.x - 10, blackPos.y - 10, 20, 20);
            ctx.fillStyle = 'rgb(0,136,255)';
            ctx.fillRect(bluePos.x - 10, bluePos.y - 10, 20, 20);
        }
    }

    function loop() {
        animationSpeed = parseInt(speedSlider.value);
        updateLogic();
        draw();
        requestAnimationFrame(loop);
    }
    loop();
})();