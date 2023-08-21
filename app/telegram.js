const logger = require("../utils/logger");
const { getPharmacies, sleep, extractCoordinatesFromGoogleMapsLink } = require("./functions");

async function handleOnMessageTelegram(client, msg) {

    const chatId = msg.chat.id;
    const text = msg.text;

    logger.w('TelegtamBot start reply to', msg.from.id, msg.from.first_name, msg.from.last_name);

    logger.d(text);

    let coordinates, latitude, longitude;

    if (msg.location) {
        coordinates = msg.location;
        logger.i('Received location message');
    }else{
        if (text.startsWith("https://goo.gl/maps")) {
            client.sendMessage(chatId, 'Bu tür bağlantılarda biraz zaman alır ⏳');
        }
        logger.i('Received text message');
        coordinates = await extractCoordinatesFromGoogleMapsLink(text);
    }

    if( coordinates == null ){
        msg.reply('Lütfen bir harita linki veya konumunuzu kullanın. 🙏');
    }

    latitude = coordinates?.latitude ?? null;
    longitude = coordinates?.longitude ?? null;

    // get Duty Pharmacy from our records
    if( latitude == null && longitude == null ){
        client.sendMessage(chatId, 'Lütfen bir harita linki veya konumunuzu kullanın. 🙏');
        return;
    }

    // get Duty Pharmacy from our records
    try{
        const pharmacies = await getPharmacies(latitude, longitude);
        //logger.d('File content:', pharmacies);
        if (pharmacies == null || pharmacies.length === 0) {
            client.sendMessage(chatId, 'Konuma bağlı nöbetçi eczane kayıtlarımızda bulunmamaktadır, başka konumdan deneyin. 🙏');
            return;
        }
        await client.sendMessage(chatId, 'Nöbetçi Eczaneler 🏥');
        for (const pharmacy of pharmacies) {
            const [latitude, longitude] = pharmacy.loc.split(',').map(parseFloat);
            await client.sendLocation(chatId, latitude, longitude);
            await sleep(500);
        }
        await client.sendMessage(chatId, 'Acil şifalar dileklerimizi iletiyoruz. 💚');
    } catch (error) {
        logger.e('Error:', error.message);
        client.sendMessage(chatId, 'Konuma bağlı nöbetçi eczane kayıtlarımızda bulunmamaktadır, başka konumdan deneyin. 🙏');
    }
    
}

module.exports = {
    handleOnMessageTelegram,
};