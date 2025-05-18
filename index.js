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

  bot.on('spawn', () => {
    console.log('✅ Bot spawn bo‘ldi!');

    setTimeout(() => {
      bot.chat('/is warp end');
      console.log('📦 /is warp shop komandasi yuborildi');

      setTimeout(() => {
        bot.chat('/is shop Ores');
        console.log('📥 /is shop Ores komandasi yuborildi');
      }, 5000);
    }, 5000);
  });

  bot.on('windowOpen', async (window) => {
    console.log('🪟 Do‘kon ochildi, emeraldlar olinmoqda...');
    try {
      for (let slot of window.slots) {
        if (slot && slot.name === 'emerald') {
          await bot.clickWindow(slot.slot, 0, 1); // shift-click
        }
      }
      console.log('✅ Emeraldlar inventarga olindi');
      await goToCraftingTableAndCraft();
    } catch (err) {
      console.log('❌ Xatolik:', err.message);
    }
  });

  async function goToCraftingTableAndCraft() {
    const mcData = mcDataLoader(bot.version);
    console.log('🧭 Crafting table qidirilmoqda...');
    const table = bot.findBlock({
      matching: block => bot.isABlock(block) && block.name === 'crafting_table',
      maxDistance: 6
    });

    if (!table) {
      console.log('❌ Crafting table topilmadi');
      return;
    }

    const recipe = bot.recipesFor(mcData.itemsByName.emerald_block.id, null, 1, table)[0];
    if (!recipe) {
      console.log('❌ Emerald block recipe topilmadi');
      return;
    }

    await bot.pathfinder.setMovements(new Movements(bot, mcData));
    await bot.pathfinder.goto(new goals.GoalBlock(table.position.x, table.position.y, table.position.z));

    console.log('🎯 Crafting tablega bordi, craft qilinmoqda...');
    await bot.craft(recipe, Math.floor(bot.inventory.count(mcData.itemsByName.emerald.id) / 9), table);
    console.log('✅ Craft tugadi');

    const emeraldBlocks = bot.inventory.items().filter(i => i.name === 'emerald_block');
    for (const item of emeraldBlocks) {
      await bot.tossStack(item);
    }
    console.log('🗑️ Emerald blocklar otildi');

    setTimeout(() => {
      bot.chat('/is shop Ores');
    }, 3000);
  }

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
