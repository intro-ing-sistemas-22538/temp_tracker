const API_KEY = "794d79cf6bd342169a231232261509";
const LANGUAGE = "es";
const CITY = "Lima";

const form = document.querySelector("#form");
const info = document.querySelector("#info");
const main = document.querySelector(".main");

if (!form || !info || !main) {
  throw new Error("El formulario o el contenedor de información no están presentes en el DOM.");
}

const cityInput = form.querySelector("#city");

if (!cityInput) {
  throw new Error("El campo de entrada de ciudad no existe en el formulario.");
}

const infoDescription = info.querySelector("#info-description");
const infoIcon = info.querySelector("#info-icon");
const infoTemperatureValue = info.querySelector("#info-temperature-value");
const infoTemperatureCity = info.querySelector("#info-temperature-city");
const infoHumidityValue = info.querySelector("#info-humidity-value");
const infoWindValue = info.querySelector("#info-wind-value");

const normalizeCity = (city) => city.trim();

const getValidCity = (city) => {
  const normalizedCity = normalizeCity(city || "");
  return normalizedCity.toLowerCase() || CITY.toLowerCase();
};

const presentError = (message) => {
  if (infoDescription)
    infoDescription.textContent = message;

  if (infoTemperatureValue)
    infoTemperatureValue.textContent = "-- °C";

  if (infoTemperatureCity)
    infoTemperatureCity.textContent = "Ciudad no disponible";

  if (infoHumidityValue)
    infoHumidityValue.textContent = "--%";

  if (infoWindValue)
    infoWindValue.textContent = "-- km/h";

  if (infoIcon)
    infoIcon.src = "";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = getValidCity(cityInput.value);

  if (!city) {
    presentError("Ingresa una ciudad válida.");
    cityInput.focus();
    return;
  }

  try {
    const result = await fetchingData(city);
    presentInfo(result);
    cityInput.value = "";
    cityInput.setAttribute("autofocus", "");
    cityInput.focus();
  } catch (error) {
    presentError("No se pudo obtener la información de la ciudad.");
    cityInput.focus();
  }
});

const fetchingData = async (city = CITY) => {
  const response = await fetch(generateUrl(city));

  if (!response.ok) {
    throw new Error(`La petición falló con el código ${response.status}.`);
  }

  const data = await response.json();
  const {current, location} = data ?? {};

  if (!current || !location) {
    throw new Error("La respuesta de la API no contiene la estructura esperada.");
  }

  const {name, region} = location;
  const {condition, humidity, temp_c, wind_kph} = current;
  const {code, icon, text} = condition ?? {};

  return {code, icon, text, name, region, humidity, temp_c, wind_kph};
};

const generateUrl = (city = CITY) => {
  return `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&lang=${LANGUAGE}`;
};

(async () => {
  try {
    const result = await fetchingData();
    presentInfo(result);
  } catch (error) {
    presentError("No se pudo cargar la información inicial.");
  }
})();

const presentInfo = (result) => {
  const {code, icon, text, name, region, humidity, temp_c, wind_kph} = result;

  const gradient = getDynamicGradient(code, temp_c);

  if (infoDescription)
    infoDescription.textContent = text ?? "Sin información";
  if (infoIcon)
    infoIcon.src = icon ? `https:${icon}` : "";

  if (infoTemperatureValue)
    infoTemperatureValue.textContent = `${temp_c ?? "--"} °C`;
  if (infoTemperatureCity)
    infoTemperatureCity.textContent = `${name ?? "Ciudad"}/${region ?? "Región"}`;

  if (infoHumidityValue)
    infoHumidityValue.textContent = `${humidity ?? "--"}%`;
  if (infoWindValue)
    infoWindValue.textContent = `${wind_kph ?? "--"} km/h`;

  main.style.setProperty("--gradient", gradient);
};


function getWeatherType(code) {
  // Tormentas
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) {
    return "storm";
  }

  // Nieve
  if (
    [
      1066, 1114, 1117,
      1210, 1213, 1216, 1219, 1222, 1225,
      1255, 1258, 1261, 1264,
    ].includes(code)
  ) {
    return "snow";
  }

  // Lluvia
  if (
    [
      1063, 1150, 1153,
      1180, 1183, 1186, 1189,
      1192, 1195, 1240, 1243, 1246,
      1258,
    ].includes(code)
  ) {
    return "rain";
  }

  // Niebla / bruma
  if ([1030, 1135, 1147].includes(code)) {
    return "fog";
  }

  // Parcialmente nublado
  if ([1003].includes(code)) {
    return "partlyCloudy";
  }

  // Nublado
  if ([1006, 1009].includes(code)) {
    return "cloudy";
  }

  // Despejado
  if (code === 1000) {
    return "sunny";
  }

  return "cloudy";
}


function getTemperatureColor(temp) {
  if (temp <= 0)
    return "#74ebd5";

  if (temp <= 10)
    return "#56ccf2";

  if (temp <= 20)
    return "#81ecec";

  if (temp <= 28)
    return "#ffeaa7";

  if (temp <= 35)
    return "#ffb347";

  return "#ff5e62";
}

function getDynamicGradient(code, temp) {
  const type = getWeatherType(code);

  const temperatureColor = getTemperatureColor(temp);

  const secondaryColors = {
    sunny: "#ffd93d",
    partlyCloudy: "#74b9ff",
    cloudy: "#636e72",
    rain: "#0984e3",
    storm: "#6c5ce7",
    snow: "#dfe6e9",
    fog: "#b2bec3",
  };

  return `linear-gradient(
    135deg,
    ${temperatureColor} 0%,
    ${secondaryColors[type]} 100%
  )`;
}
