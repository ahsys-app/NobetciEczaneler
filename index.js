const express = require('express');
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const cron = require('node-cron');
const logger = require('./utils/logger');
const { setupDataDirectory, getDutyPharmacyByCity, } = require('./app/functions');
const { handleOnMessage, handleOnReady, handleOnQr, handleOnAuthenticated, handleOnAuthfailure, } = require('./app/whatsapp');
const str = require('./utils/str');

const app = express();
const port = process.env.PORT || 3000;

//Server
app.listen(port, async () => {
    await setupDataDirectory();
    logger.d(`Server is running on port`, port);
});

// cron job at exactly midnight (00:00)
cron.schedule('10 0 * * *', async () => {
    logger.d('Running a task at 00:10 (10 minutes after midnight)');
    await getDutyPharmacyByCity(process.env.CITY_NAME);
});

// Whatsapp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.initialize();
client.on(str.ready, handleOnReady);
client.on(str.qr, handleOnQr);
client.on(str.authenticated, handleOnAuthenticated);
client.on(str.auth_failure, handleOnAuthfailure);
client.on(str.message, async msg => {
    await handleOnMessage(client, msg);
});