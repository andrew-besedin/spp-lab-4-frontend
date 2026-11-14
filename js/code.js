import api from "./utils/api.js";
import getCookie from "./utils/cookie.js";
import socket from "./utils/socket.js";
import loadMonaco from "./utils/monaco.js";

const DEFAULT_LANG = "javascript";
const POPOVER_GAP = 8;
const SCREEN_PADDING = 16;

const hash = new URLSearchParams(window.location.search).get("hash");

const langSelect = document.getElementById("lang-select");
const inviteButton = document.getElementById("invite-button");
const runButton = document.getElementById("run-button");
const usersButton = document.getElementById("users-button");
const invitePopup = document.getElementById("invite-popup");
const usersPopup = document.getElementById("users-popup");
const inviteCodeInput = document.getElementById("invite-code");
const inviteLinkInput = document.getElementById("invite-link");
const editorContainer = document.getElementById("editor");
const userTemplate = document.getElementById("user-template");
const noUsersText = usersPopup.querySelector(".header__users-popup__no-users");

let text = "";
let lang = DEFAULT_LANG;
let editor = null;
let applyingRemoteText = false;

function setupPopover(button, popup) {
    function position() {
        const rect = button.getBoundingClientRect();
        const maxLeft = document.documentElement.clientWidth - popup.offsetWidth - SCREEN_PADDING;
        const left = Math.max(SCREEN_PADDING, Math.min(rect.left + rect.width / 2 - popup.offsetWidth / 2, maxLeft));
        popup.style.top = `${rect.bottom + window.scrollY + POPOVER_GAP}px`;
        popup.style.left = `${left + window.scrollX}px`;
    }

    button.addEventListener("click", () => {
        popup.hidden = !popup.hidden;
        if (!popup.hidden) position();
    });

    document.addEventListener("mousedown", (event) => {
        if (!popup.contains(event.target) && !button.contains(event.target)) popup.hidden = true;
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") popup.hidden = true;
    });

    window.addEventListener("resize", () => {
        if (!popup.hidden) position();
    });
}

function setLang(newLang) {
    lang = newLang || DEFAULT_LANG;
    langSelect.value = lang;
    runButton.hidden = lang !== "javascript";
    if (editor) window.monaco.editor.setModelLanguage(editor.getModel(), lang);
}

function setText(newText) {
    text = newText || "";
    if (!editor || editor.getValue() === text) return;

    applyingRemoteText = true;
    editor.executeEdits("remote", [{
        range: editor.getModel().getFullModelRange(),
        text,
        forceMoveMarkers: true
    }]);
    editor.pushUndoStop();
    applyingRemoteText = false;
}

function renderLangs(langs) {
    langSelect.replaceChildren(...Object.entries(langs).map(([value, label]) => new Option(label, value)));
    langSelect.value = lang;
}

function renderParticipants(participants) {
    if (!participants.length) {
        usersPopup.replaceChildren(noUsersText);
        return;
    }

    let counter = 1;
    usersPopup.replaceChildren(...participants.map((role) => {
        const user = userTemplate.content.cloneNode(true);
        user.querySelector("p").textContent = role === "admin" ? "Admin" : `Participant ${counter++}`;
        return user;
    }));
}

async function loadParticipants() {
    const result = await api.getOpponentOnline(hash);
    if (result.success && result.data) renderParticipants(result.data.participants);
}

async function loadLangs() {
    const result = await api.getLangs();
    if (result.success && result.data) renderLangs(result.data.langs);
}

async function initEditor() {
    let monaco;

    try {
        monaco = await loadMonaco();
    } catch {
        editorContainer.textContent = "Failed to load editor";
        return;
    }

    editor = monaco.editor.create(editorContainer, {
        value: text,
        language: lang,
        theme: "code-online",
        automaticLayout: true
    });

    editor.onDidChangeModelContent(() => {
        if (applyingRemoteText) return;
        text = editor.getValue();
        socket.emit("change-text", { hash, text });
    });
}

function joinRoom() {
    socket.emit("join-room", { hash, token: getCookie("token") });
}

function leaveRoom() {
    socket.emit("leave-room", { hash, token: getCookie("token") });
}

async function init() {
    if (!hash) {
        window.location.replace("/");
        return;
    }

    if (!getCookie("token")) await api.register();

    const result = await api.getRoom(hash);

    if (!result.success || !result.data) {
        window.location.replace("/");
        return;
    }

    setText(result.data.text);
    setLang(result.data.lang);
    langSelect.disabled = !result.data.isAdmin;

    inviteCodeInput.value = hash;
    inviteLinkInput.value = window.location.href;

    setupPopover(inviteButton, invitePopup);
    setupPopover(usersButton, usersPopup);

    for (const input of [inviteCodeInput, inviteLinkInput]) {
        input.addEventListener("focus", () => input.select());
    }

    langSelect.addEventListener("change", () => {
        setLang(langSelect.value);
        api.setLang(hash, lang);
    });

    runButton.addEventListener("click", () => window.eval(text));

    socket.on("connect", joinRoom);
    if (socket.connected) joinRoom();

    socket.on("lang-changed", (data) => setLang(data.lang));
    socket.on("text-changed", (data) => setText(data.text));

    window.addEventListener("beforeunload", leaveRoom);

    setInterval(() => {
        if (socket.disconnected) socket.connect();
    }, 1000);

    loadParticipants();
    setInterval(loadParticipants, 1000);

    loadLangs();
    initEditor();
}

init();
