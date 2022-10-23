# NFL Bot

## About
Discord bot for predicting winners of NFL games with a currency system for placing "real" bets.

Join the Discord server for any help and to keep up with updates: https://discord.gg/USxvyB9QTz
  
 
  
  
## Requirements
1: Node 16+ installed on server

2: Discord bot with:
  - Server Members Intent
  - Message Content Intent
  - Manage emoji perms
  - Read/write perms in channels

3: Database with user access

 
  
  
## Install
```
git clone https://github.com/RagingRectangle/nfl_bot.git
cd nfl_bot
cp -r config.example config
npm install
<FILL OUT CONFIG>
node emojis.js (Create team emojis)
node database.js (Create db tables)
```  
 
  
  

## Config Setup
- **token:** Discord bot token.
- **emojiGuildID:** ID of trash server where team emojis should be uploaded.
- **slashGuildIDs:** Server IDs where slash commands should be registered.
- **selectPicksCommand:** Command to show games for the current week.
- **showoffPicksCommand:** Command to show your bets for the current week.
- **userStatsCommand:** Command for looking up stats of a user.
- **betsCommand:** Command to see your pending bets.
- **cashDefault:** How much money users start with.
- **database:** Basic db info.
```  
 
  
  

## Usage
- Start the bot in a console with `node nfl.js`
- Can (*should*) use PM2 to run instead with `pm2 start nfl.js`