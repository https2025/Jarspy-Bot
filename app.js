}
My app.js code:

const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");


async function QueryMessage(message) {
  // performs certain task:
}

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.initialize();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("ready", () => {
  console.log("Client is ready!");
});

const sendMessage = async (chat, message) => {
  await chat.sendMessage(await QueryMessage(message));
};

//Replying Messages with image from url
client.on("message", async (message) => {
  const chat = await message.getChat();

  if (!chat.isGroup) {
    sendMessage(chat, message.body);
  }
});
