const express = require('express');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const mcDataLoader = require('minecraft-data');

const app = express();
let bot;

const config = {
  host: 'hypixel.uz',
  port: 25566,
  version: '1.12',
  username: 'AT_nether_bot6',
  password: 'abdu2006',
  loginPassword: '87787787',
};

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function collectEmeraldsFromChest(window) {
  const mcData = mcDataLoader(bot.version);
  const emeraldId = mcData.itemsByName.emerald.id;

  let emeraldSlots = window.slots.filter(slot => slot && slot.type === emeraldId);

  console.log(`🟢 ${emeraldSlots.length} ta emerald slot topildi.`);

  for (const slot of emeraldSlots) {
    try {
      await bot.clickWindow(slot.slot, 0, 1); // 1 = shift-click
      await delay(150);
    } catch (err) {
      console.log(`❌ clickWindow xatolik: ${err.message}`);
    }
  }

  window.close();
  console.log('🧰 Chest yopildi. Endi craft qilinadi...');
  await delay(1000);
  await goToCraftingTableAndCraft();
}

async function goToCraftingTableAndCraft() {
  const mcData = mcDataLoader(bot.version);
  const table = bot.findBlock({
    matching: block => block.name === 'crafting_table',
    maxDistance: 6
  });

  if (!table) {
    console.log('❌ Crafting table topilmadi');
    return;
  }

  const emeraldCount = bot.inventory.count(mcData.itemsByName.emerald.id);
  const craftAmount = Math.floor(emeraldCount / 9);
  if (craftAmount < 1) {
    console.log('❌ Yetarli emerald yo‘q');
    return;
  }

  const recipe = bot.recipesFor(mcData.itemsByName.emerald_block.id, null, 1, table)[0];
  if (!recipe) {
    console.log('❌ Emerald block recipe topilmadi');
    return;
  }

  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  console.log('🚶 Crafting tablega borilmoqda...');
  await bot.pathfinder.goto(new goals.GoalBlock(table.position.x, table.position.y, table.position.z));

  try {
    await bot.craft(recipe, craftAmount, table);
    console.log(`✅ ${craftAmount} dona emerald block craft qilindi.`);

    const emeraldBlocks = bot.inventory.items().filter(i => i.name === 'emerald_block');
    for (const item of emeraldBlocks) {
      await bot.tossStack(item);
    }
    console.log('🗑️ Emerald blocklar otildi');

    setTimeout(() => {
      bot.chat('/is shop Ores');
    }, 3000);
  } catch (err) {
    console.log(`❌ Craft xatolik: ${err.message}`);
  }
}

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    version: config.version,
    username: config.username,
  });

  bot.loadPlugin(pathfinder);

  bot.on('messagestr', (message) => {
    console.log(message);
    if (message.includes('/register')) {
      bot.chat(`/register ${config.password} ${config.password}`);
    }
    if (message.includes('/login')) {
      bot.chat(`/login ${config.loginPassword}`);
    }
  });

  bot.once('spawn', () => {
    console.log('✅ Bot spawn bo‘ldi!');

    setTimeout(() => {
      bot.chat('/is warp end');
      console.log('📦 /is warp end komandasi yuborildi');

      setTimeout(() => {
        bot.chat('/is shop Ores');
        console.log('📥 /is shop Ores komandasi yuborildi');
      }, 5000);
    }, 5000);
  });

  bot.on('windowOpen', async (window) => {
    if (window.type === 'chest') {
      console.log('🧱 Chest ochildi — emeraldlar olinmoqda...');
      await collectEmeraldsFromChest(window);
    }
  });

  bot.on('death', () => {
    console.log('☠️ Bot o‘ldi. /back yozilmoqda...');
    setTimeout(() => {
      bot.chat('/back');
    }, 3000);
  });

  bot.on('end', () => {
    console.log('⚠️ Bot serverdan chiqdi. Qayta ulanmoqda...');
    setTimeout(startBot, 5000);
  });

  bot.on('error', err => {
    console.log('❌ Bot xatolik berdi:', err.message);
  });
}

startBot();

app.get('/', (req, res) => {
  res.send('✅ Bot ishlayapti!');
});

app.listen(3000, () => {
  console.log('🌐 Web server ishga tushdi (port 3000)');
});
