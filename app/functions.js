const axios = require('axios');
const escapeTurkish = require("escape-turkish");
const fs = require('fs');
const logger = require('../utils/logger');

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
        console.log('GOOGLE_MAP_KEY API key:', apiKey);
        
        const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=tr&key=${apiKey}`;
        const response = await axios.get(apiUrl);
        const result = response.data.results[0];
        if (result) {
            const regionComponent = result.address_components.find(comp => comp.types.includes('administrative_area_level_2'));
            const cityComponent = result.address_components.find(comp => comp.types.includes('administrative_area_level_1'));

            if (regionComponent && cityComponent) {
                const region = regionComponent.long_name;
                const city = cityComponent.long_name;
                console.log('Region:', region);
                console.log('City:', city);
                return [ convertToEnglishChars(city), convertToEnglishChars(region) ];
            } else {
                console.log('Region or city component not found.');
                return null;
            }
        } else {
            console.log('No results found.');
            return null;
        }
    } catch (error) {
        console.error('Error:', error.message);
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
            return JSON.parse(filecontent);
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

module.exports = {
    setupDataDirectory,
    sleep,
    getCityRegionByCordinates,
    getDistrictList,
    getDutyPharmacy,
    getDutyPharmacyByCity,
    getPharmacies,
};