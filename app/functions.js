const axios = require('axios');
const escapeTurkish = require("escape-turkish");
const fs = require('fs');
const logger = require('../utils/logger');
const puppeteer = require('puppeteer');

const directoryCitiesPath = `${process.env.DIRECTORY_PATH}${process.env.CITIES_PATH}`;

async function setupDataDirectory(){
    if (!fs.existsSync(directoryCitiesPath)) {
        fs.mkdirSync(directoryCitiesPath);
        await getDutyPharmacyByCity(process.env.CITY_NAME);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCityRegionByCordinates(latitude, longitude) {
    try {
        const apiKey = process.env.GOOGLE_MAP_KEY;
        const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=tr&key=${apiKey}`;
        const response = await axios.get(apiUrl);
        const result = response.data.results[0];
        if (result) {
            const regionComponent = result.address_components.find(comp => comp.types.includes('administrative_area_level_2'));
            const cityComponent = result.address_components.find(comp => comp.types.includes('administrative_area_level_1'));

            if (regionComponent && cityComponent) {
                const region = regionComponent.long_name;
                const city = cityComponent.long_name;
                logger.d('Region:', region);
                logger.d('City:', city);
                return [ convertToEnglishChars(city), convertToEnglishChars(region) ];
            } else {
                logger.e('Region or city component not found.');
                return null;
            }
        } else {
            logger.d('No results found.');
            return null;
        }
    } catch (error) {
        logger.e('Error:', error.message);
        return null;
    }
}

async function getDutyPharmacy(city, latitude, longitude) {
    try {
        const response = await getCityRegionByCordinates(latitude, longitude);
        if (response !== null && Array.isArray(response) ) {
            const apiKey = process.env.COLLECT_API_KEY;
            const apiUrl = `https://api.collectapi.com/health/dutyPharmacy?ilce=${response}&il=${city}`;
            const headers = { Authorization: `apikey ${apiKey}` };
            const axiosResponse = await axios.get(apiUrl, { headers });
            const result = axiosResponse.data.result;
            logger.d(result);
            return result;
        }
        return null;
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function getDistrictList(city) {
    try {
        const cityName = convertToEnglishChars(city);
        logger.d(cityName);
        if (!fs.existsSync(`${directoryCitiesPath}/${cityName}`)) {
            fs.mkdirSync(`${directoryCitiesPath}/${cityName}`);
        }
        const apiKey = process.env.COLLECT_API_KEY;
        const apiUrl = `https://api.collectapi.com/health/districtList?il=${cityName}`;
        const headers = { Authorization: `apikey ${apiKey}` };
        const axiosResponse = await axios.get(apiUrl, { headers });
        const result = axiosResponse.data.result;
        logger.d(result);
        const resultObject = {};
        for (const entry of result) {
            const key = entry.text;
            resultObject[key] = [];
            const filePath = `${directoryCitiesPath}/${cityName}/${convertToEnglishChars(key)}.json`;
            fs.writeFileSync(filePath, JSON.stringify(resultObject[key]));
        }
        logger.d(resultObject);
        return resultObject;
    } catch (error) {
        logger.e('Error: ' + error.message);
    }
}

async function getDutyPharmacyByCity(city){
    try {
        const cityName = convertToEnglishChars(city);
        await getDistrictList(cityName);
        const apiKey = process.env.COLLECT_API_KEY;
        const apiUrl = `https://api.collectapi.com/health/dutyPharmacy?ilce=&il=${cityName}`;
        const headers = { Authorization: `apikey ${apiKey}` };
        const axiosResponse = await axios.get(apiUrl, { headers });
        const result = axiosResponse.data.result;
        //
        const organizedData = {};
        for (const item of result) {
            const dist = item.dist;
            if (!organizedData[dist]) {
                organizedData[dist] = [];
            }
            organizedData[dist].push(item);
        }
        if( Object.keys(organizedData).length > 0 ){
            for (const key of Object.keys(organizedData)) {
                const filePath = `${directoryCitiesPath}/${cityName}/${convertToEnglishChars(key)}.json`;
                const districtArray = organizedData[key];
                const jsonData = JSON.stringify(districtArray, null, 2);
                fs.writeFileSync(filePath, jsonData);
                console.log(`Saved data for ${key} to ${filePath}`);
            }
        }
        //
        console.log(organizedData);
        return organizedData;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function getPharmacies(latitude, longitude){
    try{
        const response = await getCityRegionByCordinates(latitude, longitude);
        if (response !== null && Array.isArray(response) ) {
            logger.d('city', response[0], 'region', response[1]);
            const filePath = `${directoryCitiesPath}/${convertToEnglishChars(response[0])}` + 
                `/${convertToEnglishChars(response[1])}.json`; // Replace with the actual file path
            const filecontent = fs.readFileSync(filePath, 'utf-8');
            const parsedData = JSON.parse(filecontent);
            //logger.d(parsedData);
            return parsedData;
        }
        return null;
    }catch(error){
        console.error('Error:', error.message);
        return null;
    }
}

function convertToEnglishChars(input) {
    return escapeTurkish(input).trim().toLowerCase();
}

async function extractCoordinatesFromGoogleMapsLink(link) {
    try{
        let isSharedLink = false;
        if (link.startsWith("https://goo.gl/maps") 
            || link.startsWith("https://maps.app.goo.gl")
            || link.startsWith("https://www.google.com/maps/place/")
        ) {
            logger.w('Google map shared link received');
            isSharedLink = true;
            link = await openSharedGoogleMapLink(link);
        }
        logger.w(link);
        const url = new URL(link);
        const params = new URLSearchParams(url.search);
        let latitude, longitude;
        if( isSharedLink ){
            logger.w('inside isSharedLink');
            const regex = /@([-?\d.]+),([-?\d.]+)/;
            const match = url.href.match(regex);
            logger.d(match);
            if (match && match.length >= 3) {
                latitude = parseFloat(match[1]);
                longitude = parseFloat(match[2]);
            }
        } else if (params.has("q")) {
            const coordinates = params.get("q").split(",");
            latitude = parseFloat(coordinates[0]);
            longitude = parseFloat(coordinates[1]);
        } else if (params.has("ll")) {
            // Format: "latitude,longitude"
            const coordinates = params.get("ll").split(",");
            latitude = parseFloat(coordinates[0]);
            longitude = parseFloat(coordinates[1]);
        } else {
            const pathnameParts = url.pathname.split('/');
            const coordinatesPart = pathnameParts[pathnameParts.length - 1];
            [latitude, longitude] = coordinatesPart.split(',');
        }
        logger.d('latitude: ' + latitude, 'longitude: ' + longitude);
        return { latitude, longitude };
    }catch(error){
        return null;
    }
}

async function openSharedGoogleMapLink(link, sleepTime = 3000) {
    try{
        const browser = await puppeteer.launch({ headless: true, args: ['--disable-extensions', "--no-sandbox"] });
        const page = await browser.newPage();
        await page.goto(link);
        await page.waitForSelector('.widget-scene-canvas');
        //Some Google Map want more time to wait for getting coordinates at url
        await sleep(sleepTime);
        const url = page.url();
        await browser.close();
        return url;
    }catch(error){
        logger.e(error);
        return null;
    }
}

module.exports = {
    setupDataDirectory,
    sleep,
    getCityRegionByCordinates,
    getDistrictList,
    getDutyPharmacy,
    getDutyPharmacyByCity,
    getPharmacies,
    extractCoordinatesFromGoogleMapsLink,
    openSharedGoogleMapLink,
};