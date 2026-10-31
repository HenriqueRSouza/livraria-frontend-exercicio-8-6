// Endereço do back-end (API REST). Rodando localmente, usa o servidor Flask da máquina.
const LOCAL = ["localhost", "127.0.0.1"].includes(globalThis.location?.hostname);

export const API_URL = LOCAL ? "http://127.0.0.1:8000" : "https://engsoft-lab86-backend.azurewebsites.net";
