const logger = require("../utils/logger");
const { getPharmacies, sleep } = require("./functions");

async function handleOnMessageTelegram(client, msg) {

    const chatId = msg.chat.id;

    logger.w('TelegtamBot start reply to', msg.from.id, msg.from.first_name, msg.from.last_name);

    if (msg.location) {
        const { latitude, longitude } = msg.location;
        logger.i('Received location:', 'Latitude:', latitude, 'Longitude:', longitude);

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
}


module.exports = {
    handleOnMessageTelegram,
};