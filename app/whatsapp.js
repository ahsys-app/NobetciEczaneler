const { Location } = require("whatsapp-web.js");
const { getPharmacies, sleep } = require("./functions");
const logger = require("../utils/logger");
var qrcode = require('qrcode-terminal');

async function handleOnReady() {
    logger.d('Client is ready!');
}

async function handleOnQr(qr) {
    qrcode.generate(qr, { small: true });
    logger.d('QR RECEIVED');
}

async function handleOnAuthenticated(){
    logger.d('AUTHENTICATED');
}

async function handleOnAuthfailure(msg){
    logger.d('AUTHENTICATION FAILURE', msg);
}

async function handleOnMessage(client, msg) {
    if( process.env.LEVEL == 'debug' && process.env.TEST_NUMBER != msg.from ){
        logger.w('Stopped BOT for responding to: ', msg.from);
        return;
    }

    logger.w('We start reply to', msg.from);

    if (msg.location) {
        msg.react('👍');
        const { latitude, longitude } = msg.location;
        logger.i('Received location:');
        logger.d('Latitude:', latitude);
        logger.d('Longitude:', longitude);

        // get Duty Pharmacy from our records
        try{
            const pharmacies = await getPharmacies(latitude, longitude);
            //logger.d('File content:', pharmacies);
            if (pharmacies == null || pharmacies.length === 0) {
                msg.reply('Konuma bağlı nöbetçi eczane kayıtlarımızda bulunmamaktadır, başka konumdan deneyin. 🙏');
                return;
            }
            client.sendMessage(msg.from, 'Nöbetçi Eczaneler 🏥');
            for (const pharmacy of pharmacies) {
                const [latitude, longitude] = pharmacy.loc.split(',').map(parseFloat);
                const location = new Location(latitude, longitude, pharmacy.name);
                //const chat = await msg.getChat();
                client.sendMessage(msg.from, location);
                await sleep(500);
            }
            client.sendMessage(msg.from, 'Acil şifalar dileklerimizi iletiyoruz. 💚');
        } catch (error) {
            logger.e('Error:', error.message);
            msg.reply('Konuma bağlı nöbetçi eczane kayıtlarımızda bulunmamaktadır, başka konumdan deneyin. 🙏');
        }
    }
}


module.exports = {
    handleOnReady,
    handleOnQr,
    handleOnAuthenticated,
    handleOnMessage,
    handleOnAuthfailure,
};