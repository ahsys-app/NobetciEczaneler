const express = require('express');
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const cron = require('node-cron');
const logger = require('./utils/logger');
const { setupDataDirectory, getDutyPharmacyByCity, openSharedGoogleMapLink, } = require('./app/functions');
const { handleOnMessage, handleOnReady, handleOnQr, handleOnAuthenticated, handleOnAuthfailure, } = require('./app/whatsapp');
const str = require('./utils/str');
const TelegramBot = require('node-telegram-bot-api');
const { handleOnMessageTelegram } = require('./app/telegram');

const app = express();
const port = process.env.PORT || 3000;

//Server
app.listen(port, async () => {
    await setupDataDirectory();
    logger.d(`Server is running on port`, port);
});

// cron job at exactly midnight (00:00)
cron.schedule(process.env.CRON_SCHEDULE, async () => {
    logger.d('Running a task at 00:10 (10 minutes after midnight)');
    await getDutyPharmacyByCity(process.env.CITY_NAME);
});

// Whatsapp Bot
if( process.env.WHATSAPP_ENABLED === 'true' ) {
    logger.w(`Starting WhatsApp BOT Enabled`);
    const whatsAppClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { headless: true, args: ['--disable-extensions', "--no-sandbox"] }
    });
    whatsAppClient.initialize();
    whatsAppClient.on(str.ready, handleOnReady);
    whatsAppClient.on(str.qr, handleOnQr);
    whatsAppClient.on(str.authenticated, handleOnAuthenticated);
    whatsAppClient.on(str.auth_failure, handleOnAuthfailure);
    whatsAppClient.on(str.message, async msg => {
        await handleOnMessage(whatsAppClient, msg);
    });
}

//Telegram Bot
if( process.env.TELEGRAM_ENABLED === 'true' ){
    logger.w(`Starting Telegram BOT Enabled`);
    const telegramClient = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
    telegramClient.on(str.location, async (msg) => {
        await handleOnMessageTelegram(telegramClient, msg);
    });
    telegramClient.on(str.text, async (msg) => {
        await handleOnMessageTelegram(telegramClient, msg);
    });
}
