const express = require("express")

const server = express()

server.get("/", (req, res) => {
    res.send("Bot is running!");
})

server.head("/", (req, res) => {
    res.set('x-user', 'abcd');
})

function keepAlive() {
    server.listen(3000, () => {
        console.log("Server is ready.");
    })
}

module.exports = keepAlive