// OpenWeatherMap API Key (Free tier)
const API_KEY = '1a2b3c4d5e6f7g8h9i0j'; // Replace with your actual key from openweathermap.org
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// State
let currentWeatherData = null;
let currentForecastData = null;
let isCelsius = true;
let lastSearchedCity = localStorage.getItem('lastCity') || null;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const useLocationBtn = document.getElementById('useLocationBtn');
const weatherContent = document.getElementById('weatherContent');
const initialState = document.getElementById('initialState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    if (lastSearchedCity) {
        searchWeather(lastSearchedCity);
    }
});

function setupEventListeners() {
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) searchWeather(city);
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) searchWeather(city);
        }
    });

    refreshBtn.addEventListener('click', () => {
        if (currentWeatherData) {
            searchWeather(currentWeatherData.name);
        }
    });

    useLocationBtn.addEventListener('click', useGeolocation);

    celsiusBtn.addEventListener('click', () => {
        isCelsius = true;
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        updateTemperatureDisplay();
    });

    fahrenheitBtn.addEventListener('click', () => {
        isCelsius = false;
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
        updateTemperatureDisplay();
    });
}

function useGeolocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to get your location. Please search for a city.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

async function searchWeather(city) {
    showLoading();
    try {
        // Fetch current weather
        const weatherResponse = await fetch(
            `${API_BASE}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            if (weatherResponse.status === 404) {
                throw new Error('City not found. Please try another search.');
            }
            throw new Error('Unable to fetch weather data.');
        }

        const weatherData = await weatherResponse.json();
        currentWeatherData = weatherData;
        localStorage.setItem('lastCity', city);

        // Fetch forecast
        const forecastResponse = await fetch(
            `${API_BASE}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        currentForecastData = forecastData;

        // Render data
        renderWeather();
        showWeatherContent();
    } catch (error) {
        showError(error.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const weatherResponse = await fetch(
            `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const weatherData = await weatherResponse.json();
        currentWeatherData = weatherData;
        cityInput.value = weatherData.name;
        localStorage.setItem('lastCity', weatherData.name);

        const forecastResponse = await fetch(
            `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        currentForecastData = forecastData;

        renderWeather();
        showWeatherContent();
    } catch (error) {
        showError('Unable to fetch weather data for your location.');
    }
}

function renderWeather() {
    const { main, weather, wind, clouds, sys, visibility, dt } = currentWeatherData;

    // Current weather
    document.getElementById('cityName').textContent = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`;
    document.getElementById('currentDate').textContent = new Date(dt * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    document.getElementById('currentIcon').src = iconUrl;
    document.getElementById('weatherDescription').textContent = weather[0].description;

    updateTemperatureDisplay();

    document.getElementById('feelsLike').textContent = formatTemp(main.feels_like);
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`;
    document.getElementById('pressure').textContent = `${main.pressure} mb`;
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('uvIndex').textContent = 'N/A'; // UV index requires separate API call

    // Additional info
    document.getElementById('sunrise').textContent = new Date(sys.sunrise * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('sunset').textContent = new Date(sys.sunset * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('dewPoint').textContent = calculateDewPoint(main.temp, main.humidity);
    document.getElementById('precipitation').textContent = currentWeatherData.rain ? `${currentWeatherData.rain['1h']} mm` : '0 mm';
    document.getElementById('cloudCover').textContent = `${clouds.all}%`;
    document.getElementById('moonPhase').textContent = '🌙 ' + getMoonPhase(dt);

    // Forecast
    renderForecast();

    // Hourly
    renderHourly();
}

function renderForecast() {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    const dailyForecasts = {};
    currentForecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    Object.entries(dailyForecasts).slice(0, 5).forEach(([date, data]) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        const forecastDate = new Date(data.dt * 1000);
        card.innerHTML = `
            <div class="forecast-date">${forecastDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div class="forecast-icon"><img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}"></div>
            <div class="forecast-temp">${formatTemp(data.main.temp)}</div>
            <div class="forecast-desc">${data.weather[0].description}</div>
            <div class="forecast-extra">💧 ${data.main.humidity}% | 💨 ${(data.wind.speed * 3.6).toFixed(1)} km/h</div>
        `;
        forecastGrid.appendChild(card);
    });
}

function renderHourly() {
    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = '';

    currentForecastData.list.slice(0, 8).forEach(item => {
        const card = document.createElement('div');
        card.className = 'hourly-card';
        const time = new Date(item.dt * 1000);
        card.innerHTML = `
            <div class="hourly-time">${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="hourly-icon"><img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}"></div>
            <div class="hourly-temp">${formatTemp(item.main.temp)}</div>
            <div class="hourly-desc">${item.weather[0].main}</div>
        `;
        hourlyContainer.appendChild(card);
    });
}

function updateTemperatureDisplay() {
    if (currentWeatherData) {
        document.getElementById('temperature').textContent = formatTemp(currentWeatherData.main.temp);
    }
}

function formatTemp(temp) {
    if (isCelsius) {
        return `${Math.round(temp)}°C`;
    } else {
        const fahrenheit = (temp * 9/5) + 32;
        return `${Math.round(fahrenheit)}°F`;
    }
}

function calculateDewPoint(temp, humidity) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return formatTemp(dewPoint);
}

function getMoonPhase(timestamp) {
    const phases = ['🌑 New Moon', '🌒 Waxing Crescent', '🌓 First Quarter', '🌔 Waxing Gibbous', 
                   '🌕 Full Moon', '🌖 Waning Gibbous', '🌗 Last Quarter', '🌘 Waning Crescent'];
    const lunarCycle = 29.53059;
    const knownNewMoon = new Date('2000-01-06').getTime() / 1000;
    const daysSinceNewMoon = (timestamp - knownNewMoon) / (24 * 3600);
    const phaseIndex = Math.floor((daysSinceNewMoon % lunarCycle) / lunarCycle * 8);
    return phases[phaseIndex] || phases[0];
}

function showWeatherContent() {
    initialState.style.display = 'none';
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    weatherContent.style.display = 'block';
}

function showLoading() {
    initialState.style.display = 'none';
    weatherContent.style.display = 'none';
    errorState.style.display = 'none';
    loadingState.style.display = 'block';
}

function showError(message) {
    initialState.style.display = 'none';
    weatherContent.style.display = 'none';
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Retry button
document.getElementById('retryBtn')?.addEventListener('click', () => {
    initialState.style.display = 'block';
    errorState.style.display = 'none';
});
