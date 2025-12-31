const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const Pino = require("pino");

let sock;
let isConnecting = false;

async function conectarWhatsApp() {
  if (isConnecting) return;
  isConnecting = true;

  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📲 Escaneie o QR Code abaixo para conectar no WhatsApp:");
      console.log(qr);
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado com sucesso!");
      isConnecting = false;
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log("⚠️ Conexão fechada. Reconectar?", shouldReconnect);
      isConnecting = false;

      if (shouldReconnect) {
        setTimeout(conectarWhatsApp, 3000);
      }
    }
  });
}

conectarWhatsApp();

module.exports = {
  enviarMensagem
};