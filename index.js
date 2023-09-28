const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
const keepAlive = require("./server");

const secrets = require('./secrets.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences],
    partials: [Partials.Message, Partials.Channel],
})

module.exports = { client };
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if ('name' in event && 'func' in event) {
        client.on(event.name, event.func);
    } else {
        console.log(`[WARNING] The event at ${filePath} is missing a required "name" or "func" property.`);
    }
}

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

const refreshPresence = () => {
    axios.get('https://lcv2-server.danqzq.games/').then(res => {
        const text = res.data;
        const words = text.split(/[ ,]+/);
        client.user.setPresence({ activities: [{ name: words[5] + ' leaderboards', type: 3 }] });
    }).catch(err => {
        console.log('Error: ', err.message);
    });
};

keepAlive()
client.login(secrets.token).then(() => {
    console.log('Login attempted!');

    refreshPresence();
    setInterval(refreshPresence, 60000);
})
