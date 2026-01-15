import axios from 'axios';
import mongoose from 'mongoose';

// Import WeatherCache model - assuming it's defined in index.js and registered with mongoose
// Since models are defined in index.js, we might need to rely on mongoose.model('WeatherCache')
// or importing them if they were in separate files.
// For this structure where everything is in index.js, we'll access via mongoose.models

const getModel = (modelName) => {
    try {
        return mongoose.model(modelName);
    } catch (e) {
        return null; // Model might not be registered yet if index.js hasn't run fully
    }
};

/**
 * Fetch weather from OpenWeatherMap and cache it
 * @param {string} templeId - Temple ObjectId
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Weather data object
 */
export const fetchAndCacheWeather = async (templeId, lat, lng) => {
    try {
        const WeatherCache = getModel('WeatherCache');
        if (!WeatherCache) {
            console.error('WeatherCache model not found');
            return null;
        }

        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.warn('OPENWEATHER_API_KEY not set');
            return null;
        }

        console.log(`Fetching fresh weather for temple ${templeId} at ${lat},${lng}`);

        // Fetch current weather and forecast
        // Using 2.5/weather and 2.5/forecast endpoints (Free tier compatible)
        // OneCall API 3.0 requires separate subscription, 2.5 is safer for general free keys

        const [currentRes, forecastRes] = await Promise.all([
            axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`),
            axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`)
        ]);

        const current = currentRes.data;
        const forecastList = forecastRes.data.list; // 3-hour steps for 5 days

        // Map Current Weather
        const weatherData = {
            current: {
                temp: Math.round(current.main.temp),
                feels_like: Math.round(current.main.feels_like),
                humidity: current.main.humidity,
                condition: current.weather[0].main.toLowerCase(),
                description: current.weather[0].description,
                icon: current.weather[0].icon,
                precipitation: current.rain ? (current.rain['1h'] || 0) * 10 : 0, // Approx prob
                windSpeed: Math.round(current.wind.speed * 3.6) // m/s to km/h
            },
            hourly: [],
            daily: []
        };

        // Calculate Multiplier based on current condition
        let multiplier = 1.0;
        const condition = weatherData.current.condition;

        if (condition.includes('rain') || condition.includes('drizzle')) multiplier = 0.6;
        else if (condition.includes('thunder')) multiplier = 0.4;
        else if (condition.includes('snow')) multiplier = 0.5;
        else if (condition.includes('clear')) multiplier = 1.1; // Good weather increases crowd slightly
        else if (condition.includes('clouds')) multiplier = 1.0;
        else if (weatherData.current.temp > 38) multiplier = 0.7; // Too hot

        // Map Hourly (next 24h) from 3h forecast
        // We'll interpolate or just take the available points
        weatherData.hourly = forecastList.slice(0, 8).map(item => ({
            hour: new Date(item.dt * 1000).getHours(),
            temp: Math.round(item.main.temp),
            condition: item.weather[0].main.toLowerCase(),
            precipitation: item.pop ? Math.round(item.pop * 100) : 0 // Prob of precipitation
        }));

        // Map Daily (next 5 days) - Simple aggregation
        const dailyMap = {};
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!dailyMap[date]) {
                dailyMap[date] = {
                    temps: [],
                    conditions: [],
                    pops: []
                };
            }
            dailyMap[date].temps.push(item.main.temp);
            dailyMap[date].conditions.push(item.weather[0].main);
            dailyMap[date].pops.push(item.pop || 0);
        });

        weatherData.daily = Object.keys(dailyMap).slice(0, 5).map(date => {
            const data = dailyMap[date];
            const getMode = (arr) => arr.sort((a, b) =>
                arr.filter(v => v === a).length - arr.filter(v => v === b).length
            ).pop();

            return {
                date,
                tempMin: Math.round(Math.min(...data.temps)),
                tempMax: Math.round(Math.max(...data.temps)),
                condition: getMode(data.conditions).toLowerCase(),
                precipitation: Math.round(Math.max(...data.pops) * 100)
            };
        });

        // Save to Cache
        // Expire in 3 hours
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

        await WeatherCache.findOneAndUpdate(
            { templeId: templeId },
            {
                templeId,
                lat,
                lng,
                forecast: weatherData,
                weatherMultiplier: multiplier,
                fetchedAt: new Date(),
                expiresAt
            },
            { upsert: true, new: true }
        );

        return {
            multiplier,
            condition: weatherData.current.condition,
            temp: weatherData.current.temp,
            precipitation: weatherData.current.precipitation
        };

    } catch (error) {
        console.error('Error in fetchAndCacheWeather:', error.message);
        // Return neutral fallback
        return { multiplier: 1.0, condition: null };
    }
};
