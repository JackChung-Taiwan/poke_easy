let playerPokemon = null;
let enemyPokemon = null;

// 建立一個延遲函數，用來製造文字一行一行出現的效果 (單位：毫秒)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRandomId() {
    return Math.floor(Math.random() * 151) + 1;
}

async function fetchPokemon(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        return {
            name: data.name.toUpperCase(),
            hp: data.stats[0].base_stat * 3, // 把原始血量乘3，讓戰鬥能多打幾回合
            maxHp: data.stats[0].base_stat * 3,
            attack: data.stats[1].base_stat,
            image: data.sprites.other['official-artwork'].front_default
        };
    } catch (error) {
        return null;
    }
}

// 將文字附加到戰鬥看板，並自動捲動到最底部
function appendLog(text) {
    const logDiv = document.getElementById('log');
    const logContainer = document.getElementById('log-container');
    logDiv.innerHTML += text + "<br>";
    logContainer.scrollTop = logContainer.scrollHeight; // 自動捲動到最下面
}

async function drawCards() {
    document.getElementById('log').innerHTML = "正在召喚寶可夢...<br>";
    document.getElementById('btn-battle').disabled = true;
    document.getElementById('btn-draw').disabled = true;

    playerPokemon = await fetchPokemon(getRandomId());
    enemyPokemon = await fetchPokemon(getRandomId());

    if (playerPokemon && enemyPokemon) {
        // 更新玩家 UI
        document.getElementById('player-name').innerText = playerPokemon.name;
        document.getElementById('player-hp').innerText = playerPokemon.hp;
        document.getElementById('player-max-hp').innerText = playerPokemon.maxHp;
        document.getElementById('player-atk').innerText = playerPokemon.attack;
        document.getElementById('player-img').src = playerPokemon.image;

        // 更新對手 UI
        document.getElementById('enemy-name').innerText = enemyPokemon.name;
        document.getElementById('enemy-hp').innerText = enemyPokemon.hp;
        document.getElementById('enemy-max-hp').innerText = enemyPokemon.maxHp;
        document.getElementById('enemy-atk').innerText = enemyPokemon.attack;
        document.getElementById('enemy-img').src = enemyPokemon.image;

        appendLog("抽卡完成！請點擊「開始戰鬥！」");
        document.getElementById('btn-battle').disabled = false;
        document.getElementById('btn-draw').disabled = false;
    }
}

// 回合制戰鬥核心邏輯
async function startBattle() {
    if (!playerPokemon || !enemyPokemon) return;

    // 鎖定按鈕避免戰鬥中重複點擊
    document.getElementById('btn-battle').disabled = true;
    document.getElementById('btn-draw').disabled = true;
    
    // 清空先前的文字，顯示開戰宣言
    document.getElementById('log').innerHTML = "";
    appendLog(`⚔️ 戰鬥開始！`);
    appendLog(`【玩家】${playerPokemon.name} VS 【對手】${enemyPokemon.name}`);
    appendLog(`-----------------------------------`);
    await sleep(1000); // 停頓 1 秒

    let currentTurn = 1;

    // 只要雙方都還有血量，就持續進行回合
    while (playerPokemon.hp > 0 && enemyPokemon.hp > 0) {
        appendLog(`[ 第 ${currentTurn} 回合 ]`);
        await sleep(800);

        // 1. 玩家攻擊對手
        // 傷害公式：攻擊力 * 0.4 到 0.6 之間的浮動值 + 基礎傷害 5
        let playerDamage = Math.floor(playerPokemon.attack * (Math.random() * 0.2 + 0.4)) + 5;
        enemyPokemon.hp -= playerDamage;
        if (enemyPokemon.hp < 0) enemyPokemon.hp = 0; // 血量不低於0
        
        document.getElementById('enemy-hp').innerText = enemyPokemon.hp; // 更新畫面血量
        appendLog(`🟢 玩家的 ${playerPokemon.name} 發起攻擊！`);
        await sleep(500);
        appendLog(`💥 對 ${enemyPokemon.name} 造成了 ${playerDamage} 點傷害！ (剩餘 HP: ${enemyPokemon.hp})`);
        await sleep(1200);

        // 檢查對手是否倒下
        if (enemyPokemon.hp <= 0) {
            appendLog(`💀 對手的 ${enemyPokemon.name} 倒下了！`);
            break; 
        }

        // 2. 對手反擊玩家
        let enemyDamage = Math.floor(enemyPokemon.attack * (Math.random() * 0.2 + 0.4)) + 5;
        playerPokemon.hp -= enemyDamage;
        if (playerPokemon.hp < 0) playerPokemon.hp = 0;

        document.getElementById('player-hp').innerText = playerPokemon.hp;
        appendLog(`🔴 對手的 ${enemyPokemon.name} 發起反擊！`);
        await sleep(500);
        appendLog(`💥 對 ${playerPokemon.name} 造成了 ${enemyDamage} 點傷害！ (剩餘 HP: ${playerPokemon.hp})`);
        await sleep(1200);

        // 檢查玩家是否倒下
        if (playerPokemon.hp <= 0) {
            appendLog(`💀 玩家的 ${playerPokemon.name} 倒下了！`);
            break;
        }

        appendLog(`-----------------------------------`);
        currentTurn++;
        await sleep(800);
    }

    // 結算畫面
    appendLog(`===================================`);
    await sleep(500);
    if (playerPokemon.hp > 0) {
        appendLog(`🎉 恭喜！玩家獲得了勝利！`);
    } else {
        appendLog(`🌧️ 挑戰失敗，對手贏得了這場戰鬥...`);
    }

    // 戰鬥結束，解鎖抽卡按鈕讓玩家可以重來
    document.getElementById('btn-draw').disabled = false;
}