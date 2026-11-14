import api from "./utils/api.js";
import getCookie from "./utils/cookie.js";

if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
    window.location.replace("/404.html");
}

const introText = document.getElementById("intro-text");
const introButtons = document.getElementById("intro-buttons");
const createRoomButton = document.getElementById("create-room-button");
const showConnectButton = document.getElementById("show-connect-button");
const createError = document.getElementById("create-error");
const connectForm = document.getElementById("connect-form");
const roomCodeInput = document.getElementById("room-code");
const connectButton = document.getElementById("connect-button");
const backButton = document.getElementById("back-button");
const connectError = document.getElementById("connect-error");

const registered = getCookie("token") ? Promise.resolve() : api.register();

function goToRoom(hash) {
    window.location.href = `/code.html?hash=${encodeURIComponent(hash)}`;
}

function showConnectForm(visible) {
    introText.hidden = visible;
    introButtons.hidden = visible;
    createError.hidden = visible;
    connectForm.hidden = !visible;
    connectError.hidden = !visible;
    if (visible) roomCodeInput.focus();
}

createRoomButton.addEventListener("click", async () => {
    createRoomButton.textContent = "Loading...";
    createRoomButton.disabled = true;

    await registered;
    const result = await api.createRoom();

    if (result.success && result.data) {
        goToRoom(result.data.hash);
        return;
    }

    createRoomButton.textContent = "Create Room";
    createRoomButton.disabled = false;
    createError.textContent = "Error while creating room";
});

showConnectButton.addEventListener("click", () => showConnectForm(true));
backButton.addEventListener("click", () => showConnectForm(false));

connectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const hash = roomCodeInput.value.trim();
    connectButton.textContent = "Loading...";
    connectButton.disabled = true;

    await registered;
    const result = await api.getRoom(hash);

    if (result.success) {
        goToRoom(hash);
        return;
    }

    connectButton.textContent = "Connect";
    connectButton.disabled = false;
    connectError.textContent = "Room not found";
});
