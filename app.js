// ============== 遊戲變數 ==============
let playerPokemon = null;
let enemyPokemon = null;
let availablePokemon = []; 

const cellCount = 5; 
const theta = 360 / cellCount; 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 【終極防呆】第九代繁體中文圖鑑字典 (906 ~ 1025)
// 確保就算 PokeAPI 伺服器沒有中文翻譯，我們也能自己顯示！
const gen9ZhDict = {
    906:"新葉喵", 907:"蒂蕾喵", 908:"魔幻假面喵", 909:"呆火鱷", 910:"炙燙鱷", 911:"骨紋巨聲鱷", 912:"潤水鴨", 913:"湧躍鴨", 914:"狂歡浪舞鴨", 915:"愛吃豚", 916:"飄香豚", 917:"團珠蛛", 918:"操陷蛛", 919:"豆蟋蟀", 920:"烈腿蝗", 921:"布撥", 922:"布土撥", 923:"巴布土撥", 924:"一對鼠", 925:"一家鼠", 926:"狗仔包", 927:"烤狗犬", 928:"迷你芙", 929:"奧利紐", 930:"奧利瓦", 931:"怒鸚哥", 932:"鹽石寶", 933:"鹽石壘", 934:"鹽石巨靈", 935:"炭小侍", 936:"紅蓮鎧騎", 937:"蒼炎刃鬼", 938:"光蚪仔", 939:"電肚蛙", 940:"電海燕", 941:"大電海燕", 942:"偶叫獒", 943:"獒教父", 944:"滋汁海黽", 945:"塗標客", 946:"納噬草", 947:"怖納噬草", 948:"原野水母", 949:"陸地水母", 950:"毛崖蟹", 951:"熱辣娃", 952:"狠辣椒", 953:"蟲滾泥", 954:"蟲甲聖", 955:"飄飄雛", 956:"超能豔鴕", 957:"小鍛匠", 958:"巧鍛匠", 959:"巨鍛匠", 960:"海地鼠", 961:"三海地鼠", 962:"下石鳥", 963:"波普海豚", 964:"海豚俠", 965:"噗隆隆", 966:"普隆隆姆", 967:"摩托蜥", 968:"拖拖蚓", 969:"晶光芽", 970:"晶光花", 971:"墓仔狗", 972:"墓揚犬", 973:"纏紅鶴", 974:"走鯨", 975:"浩大鯨", 976:"輕身鱈", 977:"吃吼霸", 978:"米立龍", 979:"棄世猴", 980:"土王", 981:"奇麒麟", 982:"土龍節節", 983:"仆斬將軍", 984:"雄偉牙", 985:"吼叫尾", 986:"猛惡菇", 987:"沙鐵皮", 988:"振翼髮", 989:"鐵轍跡", 990:"鐵包袱", 991:"鐵臂膀", 992:"鐵脖頸", 993:"鐵毒蛾", 994:"鐵荊棘", 995:"涼脊龍", 996:"凍脊龍", 997:"戟脊龍", 998:"索財靈", 999:"賽富豪", 1000:"古簡蝸", 1001:"古劍豹", 1002:"古鼎鹿", 1003:"古玉魚", 1004:"轟鳴月", 1005:"鐵武者", 1006:"鐵武者", 1007:"故勒頓", 1008:"密勒頓", 1009:"波盪水", 1010:"鐵斑葉", 1011:"裹蜜蟲", 1012:"斯魔茶", 1013:"來悲粗茶", 1014:"夠讚狗", 1015:"願增猿", 1016:"吉雉雞", 1017:"厄月椪", 1018:"鋁鋼橋龍", 1019:"蜜集大蛇", 1020:"破空焰", 1021:"猛雷鼓", 1022:"鐵磐岩", 1023:"鐵頭殼", 1024:"太樂巴戈斯", 1025:"桃歹郎"
};

// ============== 滑鼠拖曳控制 3D 旋轉變數 ==============
let isDragging = false;
let startX = 0;
let currentAngle = 0;
let lastAngle = 0;

const scene = document.getElementById('drag-scene');
const carousel = document.querySelector('.carousel');

scene.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    e.preventDefault(); 
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.pageX - startX;
    currentAngle = lastAngle + (dx * 0.5); 
    carousel.style.transform = `translateZ(-250px) rotateY(${currentAngle}deg)`;
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        lastAngle = currentAngle;
    }
});

// ============== 抓取與核心邏輯 ==============
function getRandomId() {
    return Math.floor(Math.random() * 120) + 906; // 鎖定第九代
}

// 抓取寶可夢資料
async function fetchPokemon(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        
        let nameZh = gen9ZhDict[id]; // 優先查字典

        // 如果字典沒寫到 (例如你以後想抽別代的)，再去 API 裡面找
        if (!nameZh) {
            const speciesResponse = await fetch(data.species.url);
            const speciesData = await speciesResponse.json();
            const zhHantNameObj = speciesData.names.find(n => n.language.name === 'zh-Hant');
            if (zhHantNameObj) {
                nameZh = zhHantNameObj.name; 
            } else {
                nameZh = data.name.toUpperCase(); // 都找不到才顯示英文
            }
        }

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
        console.error("讀取寶可夢失敗", error);
        return null;
    }
}

function appendLog(text) {
    const logDiv = document.getElementById('log');
    const logContainer = document.getElementById('log-container');
    logDiv.innerHTML += text + "<br>";
    logContainer.scrollTop = logContainer.scrollHeight; 
}

// 抽取 5 隻寶可夢
async function drawCards() {
    const btnDraw = document.getElementById('btn-draw');
    const btnNext = document.getElementById('btn-next-group');
    
    btnDraw.innerText = "⏳ 正在獲取寶可夢...";
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

// 玩家確認選擇
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

// 戰鬥邏輯
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
