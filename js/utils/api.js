const BASE_URL = "/api";

async function request(path, body) {
    const options = body === undefined ? {} : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };

    try {
        const response = await fetch(BASE_URL + path, options);
        return await response.json();
    } catch {
        return { success: false, error: "Server is unavailable" };
    }
}

const api = {
    register: () => request("/register"),
    createRoom: () => request("/create-room"),
    getRoom: (hash) => request("/get-room", { hash }),
    getLangs: () => request("/get-langs"),
    setLang: (hash, lang) => request("/set-lang", { hash, lang }),
    getOpponentOnline: (hash) => request("/get-opponent-online", { hash })
};

export default api;
