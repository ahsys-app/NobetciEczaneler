const { Location } = require("whatsapp-web.js");
const { getPharmacies, sleep, extractCoordinatesFromGoogleMapsLink } = require("./functions");
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
    if( process.env.APP_ENV == 'debug' && process.env.TEST_NUMBER != msg.from ){
        logger.w('Stopped BOT for responding to: ', msg.from);
        return;
    }

    logger.w('We start reply to', msg.from);

    let coordinates, latitude, longitude;

    if (msg.location) {
        coordinates = msg.location;
        logger.i('Received location message');
    }else{
        if (msg.body.startsWith("https://goo.gl/maps")) {
            msg.reply('Bu tür bağlantılarda biraz zaman alır ⏳');
        }
        logger.i('Received text message');
        coordinates = await extractCoordinatesFromGoogleMapsLink(msg.body);
    }

    if( coordinates == null ){
        msg.reply('Lütfen bir harita linki veya konumunuzu kullanın. 🙏');
    }

    latitude = coordinates?.latitude ?? null;
    longitude = coordinates?.longitude ?? null;

    if(   latitude == null && longitude == null ){
        msg.reply('Lütfen bir harita linki veya konumunuzu kullanın. 🙏');
        return;
    }

    // get Duty Pharmacy from our records
    try{
        msg.react('👍');
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
    // else{
    //     fs.readFile(`${process.env.DIRECTORY_PATH}\words.txt`, 'utf8', (err, data) => {
    //         if (err) {
    //             logger.error('Error reading file:', err);
    //             return;
    //         }
    //         const keyValuePairs = {};
    //         const lines = data.split('\n');
    //         lines.forEach(line => {
    //             const [key, value] = line.split(':');
    //             if (key && value) {
    //             keyValuePairs[key.trim()] = value.trim();
    //             }
    //         });
    //         const message = msg.body;
    //         Object.keys(keyValuePairs).forEach(key => {
    //             if (message.includes(key)) {
    //             const response = keyValuePairs[key];
    //             logger.debug('Message contains key:', key);
    //             logger.debug('Response:', response);
    //             msg.reply(response);
    //             }
    //         });
    //     });
    // }
}


module.exports = {
    handleOnReady,
    handleOnQr,
    handleOnAuthenticated,
    handleOnMessage,
    handleOnAuthfailure,
};