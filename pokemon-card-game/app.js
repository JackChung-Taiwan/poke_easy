// 用來儲存雙方寶可夢資料的變數
let playerPokemon = null;
let enemyPokemon = null;

// 隨機產生 1~151 的寶可夢 ID (這裡以初代寶可夢為例)
function getRandomId() {
    return Math.floor(Math.random() * 151) + 1;
}

// 呼叫 PokeAPI 抓取寶可夢資料
async function fetchPokemon(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        
        // 只提取我們需要的資料：名字、HP、攻擊力、圖片
        return {
            name: data.name.toUpperCase(),
            hp: data.stats[0].base_stat,      // 陣列第 0 項是 HP
            attack: data.stats[1].base_stat,  // 陣列第 1 項是 Attack
            image: data.sprites.other['official-artwork'].front_default // 高畫質圖片
        };
    } catch (error) {
        console.error("讀取資料失敗:", error);
        return null;
    }
}

// 抽卡功能
async function drawCards() {
    const logDiv = document.getElementById('log');
    const battleBtn = document.getElementById('btn-battle');
    
    logDiv.innerText = "正在召喚寶可夢...";
    battleBtn.disabled = true;

    // 同時抓取兩隻寶可夢
    playerPokemon = await fetchPokemon(getRandomId());
    enemyPokemon = await fetchPokemon(getRandomId());

    if (playerPokemon && enemyPokemon) {
        // 更新玩家卡牌 UI
        document.getElementById('player-name').innerText = playerPokemon.name;
        document.getElementById('player-hp').innerText = playerPokemon.hp;
        document.getElementById('player-atk').innerText = playerPokemon.attack;
        document.getElementById('player-img').src = playerPokemon.image;

        // 更新對手卡牌 UI
        document.getElementById('enemy-name').innerText = enemyPokemon.name;
        document.getElementById('enemy-hp').innerText = enemyPokemon.hp;
        document.getElementById('enemy-atk').innerText = enemyPokemon.attack;
        document.getElementById('enemy-img').src = enemyPokemon.image;

        logDiv.innerText = "抽卡完成！請點擊「開始戰鬥！」";
        battleBtn.disabled = false; // 啟用戰鬥按鈕
    } else {
        logDiv.innerText = "召喚失敗，請再試一次。";
    }
}

// 戰鬥功能 (這個範例直接比拼攻擊力大小)
function battle() {
    if (!playerPokemon || !enemyPokemon) return;

    let resultMsg = `玩家的 ${playerPokemon.name} (攻擊力: ${playerPokemon.attack})\n💥 對決 💥\n對手的 ${enemyPokemon.name} (攻擊力: ${enemyPokemon.attack})\n\n`;

    // 判斷勝負
    if (playerPokemon.attack > enemyPokemon.attack) {
        resultMsg += "🎉 玩家獲勝！";
    } else if (playerPokemon.attack < enemyPokemon.attack) {
        resultMsg += "💀 對手獲勝！";
    } else {
        resultMsg += "🤝 雙方平手！";
    }

    // 顯示結果
    document.getElementById('log').innerText = resultMsg;
    // 戰鬥結束後將戰鬥按鈕鎖定，要求重新抽卡
    document.getElementById('btn-battle').disabled = true;
}