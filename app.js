// ============== 遊戲全域變數 ==============
let playerPokemon = null;
let enemyPokemon = null;
let availablePokemon = []; 

// 這裡準備一個空箱子，用來裝 1025 隻寶可夢的中文名字
let globalZhDict = {}; 

const cellCount = 5; 
const theta = 360 / cellCount; 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============== 預載入全世代中文圖鑑 (GraphQL 魔法) ==============
// 遊戲一打開時會先執行這個函數，一次性下載所有中文名字！
async function initGame() {
    const btnDraw = document.getElementById('btn-draw');
    btnDraw.innerText = "📚 正在下載全國中文圖鑑...";
    btnDraw.disabled = true;

    // 這是 GraphQL 語法：告訴伺服器「我只要繁體(4)跟簡體(12)的名字，其他都不要！」
    const query = `
    query {
      pokemon_v2_pokemonspeciesname(where: {language_id: {_in: [4, 12]}}) {
        pokemon_species_id
        name
        language_id
      }
    }`;

    try {
        const response = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const { data } = await response.json();
        
        // 將下載回來的資料裝進 globalZhDict 字典裡
        data.pokemon_v2_pokemonspeciesname.forEach(item => {
            // 如果還沒存過，或者是繁體中文(4)，就存起來
            if (!globalZhDict[item.pokemon_species_id] || item.language_id === 4) {
                globalZhDict[item.pokemon_species_id] = item.name;
            }
        });

        console.log("全世代中文圖鑑下載完成！總共:", Object.keys(globalZhDict).length, "隻");
        btnDraw.innerText = "🎲 抽取 5 張卡牌";
        btnDraw.disabled = false;
    } catch (error) {
        console.error("圖鑑下載失敗", error);
        btnDraw.innerText = "❌ 載入失敗，請重新整理網頁";
    }
}

// 當網頁載入完成時，立刻執行 initGame
window.onload = initGame;


// ============== 滑鼠與手機觸控事件 (3D 旋轉) ==============
let isDragging = false;
let startX = 0;
let currentAngle = 0;
let lastAngle = 0;

const scene = document.getElementById('drag-scene');
const carousel = document.querySelector('.carousel');

function startDrag(x) { isDragging = true; startX = x; }
function moveDrag(x) {
    if (!isDragging) return;
    currentAngle = lastAngle + ((x - startX) * 0.8); 
    carousel.style.transform = `translateZ(-250px) rotateY(${currentAngle}deg)`;
}
function endDrag() { if (isDragging) { isDragging = false; lastAngle = currentAngle; } }

scene.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(e.pageX); });
window.addEventListener('mousemove', (e) => moveDrag(e.pageX));
window.addEventListener('mouseup', endDrag);

scene.addEventListener('touchstart', (e) => startDrag(e.touches[0].pageX));
window.addEventListener('touchmove', (e) => moveDrag(e.touches[0].pageX));
window.addEventListener('touchend', endDrag);


// ============== API 抓取邏輯 (變得超快！) ==============
function getRandomId() {
    return Math.floor(Math.random() * 1025) + 1; // 全國圖鑑 1 ~ 1025
}

async function fetchPokemon(id) {
    try {
        // 現在我們只需要抓取數值，不用再抓物種資料了，因為名字已經在我們手上了！
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        
        // 直接從我們剛下載好的巨大字典中拿出名字，如果真的沒有才顯示英文
        let nameZh = globalZhDict[id] || data.name.toUpperCase();

        const types = data.types.map(t => t.type.name);

        return {
            id: data.id,
            name: data.name.toUpperCase(),
            nameZh: nameZh, 
            hp: data.stats[0].base_stat * 3, 
            maxHp: data.stats[0].base_stat * 3,
            attack: data.stats[1].base_stat,
            types: types, 
            typeString: types.join(', '), 
            image: data.sprites.other['official-artwork'].front_default
        };
    } catch (error) {
        return null;
    }
}

function appendLog(text) {
    const logDiv = document.getElementById('log');
    const logContainer = document.getElementById('log-container');
    logDiv.innerHTML += text + "<br>";
    logContainer.scrollTop = logContainer.scrollHeight; 
}


// ============== 抽卡邏輯 ==============
async function drawCards() {
    const btnDraw = document.getElementById('btn-draw');
    const btnNext = document.getElementById('btn-next-group');
    
    btnDraw.innerText = "⏳ 正在尋找未登錄的寶可夢...";
    btnDraw.disabled = true;
    btnNext.disabled = true;
    document.getElementById('btn-battle').disabled = true;

    document.getElementById('battle-screen').style.display = 'none';
    
    availablePokemon = [];
    let usedIds = new Set();
    let usedTypes = new Set();
    
    while (availablePokemon.length < 5) {
        let id = getRandomId();
        if (usedIds.has(id)) continue; 
        
        let pkmn = await fetchPokemon(id);
        if (!pkmn) continue;

        let hasDuplicateType = pkmn.types.some(type => usedTypes.has(type));
        
        if (!hasDuplicateType) {
            availablePokemon.push(pkmn);
            usedIds.add(id);
            pkmn.types.forEach(type => usedTypes.add(type));
        }
    }

    carousel.innerHTML = ''; 
    currentAngle = 0; 
    lastAngle = 0;
    carousel.style.transform = `translateZ(-250px) rotateY(${currentAngle}deg)`;

    availablePokemon.forEach((pkmn, i) => {
        const cellAngle = i * theta;
        const cell = document.createElement('div');
        cell.className = 'carousel-cell';
        cell.style.transform = `rotateY(${cellAngle}deg) translateZ(250px)`;
        
        cell.innerHTML = `
            <img src="${pkmn.image}" alt="${pkmn.name}">
            <h4>${pkmn.name}</h4>
            <h3>${pkmn.nameZh}</h3>
            <span class="type-tag">${pkmn.typeString}</span>
            <p>❤️ HP: ${pkmn.hp} | ⚔️ ATK: ${pkmn.attack}</p>
            <button class="btn-select" onclick="choosePokemon(${i})">✨ 選擇</button>
        `;
        carousel.appendChild(cell);
    });

    document.getElementById('selection-screen').style.display = 'block';
    btnDraw.innerText = "🎲 抽取 5 張卡牌";
    btnDraw.disabled = false;
    btnNext.disabled = false;
}

// ============== 選擇出戰卡牌 ==============
async function choosePokemon(index) {
    playerPokemon = availablePokemon[index];
    document.getElementById('selection-screen').style.display = 'none';
    
    enemyPokemon = await fetchPokemon(getRandomId());

    document.getElementById('battle-screen').style.display = 'flex';
    
    document.getElementById('player-name').innerText = playerPokemon.name;
    document.getElementById('player-name-zh').innerText = playerPokemon.nameZh;
    document.getElementById('player-hp').innerText = playerPokemon.hp;
    document.getElementById('player-max-hp').innerText = playerPokemon.maxHp;
    document.getElementById('player-atk').innerText = playerPokemon.attack;
    document.getElementById('player-img').src = playerPokemon.image;

    document.getElementById('enemy-name').innerText = enemyPokemon.name;
    document.getElementById('enemy-name-zh').innerText = enemyPokemon.nameZh;
    document.getElementById('enemy-hp').innerText = enemyPokemon.hp;
    document.getElementById('enemy-max-hp').innerText = enemyPokemon.maxHp;
    document.getElementById('enemy-atk').innerText = enemyPokemon.attack;
    document.getElementById('enemy-img').src = enemyPokemon.image;

    document.getElementById('log').innerHTML = ""; 
    appendLog(`你選擇了 【${playerPokemon.nameZh}】！\n請點擊上方「開始戰鬥！」\n\n`);
    
    document.getElementById('btn-battle').disabled = false;
}

// ============== 回合制戰鬥邏輯 ==============
async function startBattle() {
    if (!playerPokemon || !enemyPokemon) return;

    document.getElementById('btn-battle').disabled = true;
    document.getElementById('btn-draw').disabled = true;
    
    document.getElementById('log').innerHTML = "";
    appendLog(`⚔️ 戰鬥開始！`);
    appendLog(`【玩家】${playerPokemon.nameZh} VS 【對手】${enemyPokemon.nameZh}`);
    appendLog(`-----------------------------------`);
    await sleep(1000); 

    let currentTurn = 1;

    while (playerPokemon.hp > 0 && enemyPokemon.hp > 0) {
        appendLog(`[ 第 ${currentTurn} 回合 ]`);
        await sleep(800);

        let playerDamage = Math.floor(playerPokemon.attack * (Math.random() * 0.2 + 0.4)) + 5;
        enemyPokemon.hp -= playerDamage;
        if (enemyPokemon.hp < 0) enemyPokemon.hp = 0; 
        
        document.getElementById('enemy-hp').innerText = enemyPokemon.hp; 
        appendLog(`🟢 玩家的 ${playerPokemon.nameZh} 發起攻擊！`);
        await sleep(500);
        appendLog(`💥 造成 ${playerDamage} 點傷害！(剩餘 HP: ${enemyPokemon.hp})`);
        await sleep(1200);

        if (enemyPokemon.hp <= 0) {
            appendLog(`💀 對手的 ${enemyPokemon.nameZh} 倒下了！`);
            break; 
        }

        let enemyDamage = Math.floor(enemyPokemon.attack * (Math.random() * 0.2 + 0.4)) + 5;
        playerPokemon.hp -= enemyDamage;
        if (playerPokemon.hp < 0) playerPokemon.hp = 0;

        document.getElementById('player-hp').innerText = playerPokemon.hp;
        appendLog(`🔴 對手的 ${enemyPokemon.nameZh} 發起反擊！`);
        await sleep(500);
        appendLog(`💥 造成 ${enemyDamage} 點傷害！(剩餘 HP: ${playerPokemon.hp})`);
        await sleep(1200);

        if (playerPokemon.hp <= 0) {
            appendLog(`💀 玩家的 ${playerPokemon.nameZh} 倒下了！`);
            break;
        }

        appendLog(`-----------------------------------`);
        currentTurn++;
        await sleep(800);
    }

    appendLog(`===================================`);
    await sleep(500);
    if (playerPokemon.hp > 0) {
        appendLog(`🎉 恭喜！玩家獲得了勝利！`);
    } else {
        appendLog(`🌧️ 挑戰失敗，對手贏得了這場戰鬥...`);
    }

    document.getElementById('btn-draw').disabled = false;
}
