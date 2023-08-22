<div align="center">
    <img src="./assets/images/logo.png" alt="Nöbetçi Eczaneler" />
</div>
<h3 align="center">
WhatsApp/Telegram BOT sending Nearby Locations for Nöbetçi Eczaneler
</h3>

WhatsApp/Telegram BOT, İstanbul Nöbetçi Eczaneler için Yakın Konumlar gönderiyor

Now works for only İstanbul, All turkey cities will come soon in the next update.

## WhatsApp

This project connects through the WhatsApp Web browser app
It uses Puppeteer to run a real instance of Whatsapp Web to avoid getting blocked.

NOTE: I can't guarantee you will not be blocked by using this method, although it has worked for me. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

## Telegram
using Telegram Bot API.
### Installation
```
npm i
```
### Usage
```
node . | nodemon
```
- After that scan QR code `using your whatsapp` from console area, then BOT will start work on your account and reply to any location available with nearby Nöbetçi Eczaneler.

### Screenshots

- QR code for scan step after run command `nodemon`

![Nöbetçi Eczaneler](./assets/images/run.png)

- [1] Location sent to WhatsApp number / Telegram BOT.
- [2] All `Nöbetçi Eczaneler` founds nearby your area.

![Nöbetçi Eczaneler](./assets/images/run-2.png)
![Nöbetçi Eczaneler](./assets/images/run-3.png)

### To-Do Tasks
* Incoming enhancements  :
    * <del>Disable/Enable BOTs</del>
    * <del>Dealing with Google map links. </del>
    * <del>Cron jobs update time from env file. </del>
    * Welcome message for first-time usage.
    * User search limitation.
    * All cities of Türkiye.
    * Frontend interface for management.