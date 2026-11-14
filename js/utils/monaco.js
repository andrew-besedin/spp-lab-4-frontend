const MONACO_ROOT = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min";

window.MonacoEnvironment = {
    getWorkerUrl: () => "data:text/javascript;charset=utf-8," + encodeURIComponent(
        `self.MonacoEnvironment = { baseUrl: "${MONACO_ROOT}/" };` +
        `importScripts("${MONACO_ROOT}/vs/base/worker/workerMain.js");`
    )
};

window.require.config({ paths: { vs: `${MONACO_ROOT}/vs` } });

export default function loadMonaco() {
    return new Promise((resolve, reject) => {
        window.require(["vs/editor/editor.main"], () => {
            window.monaco.editor.defineTheme("code-online", {
                base: "vs-dark",
                inherit: true,
                rules: [],
                colors: { "editor.background": "#0c001f" }
            });
            resolve(window.monaco);
        }, reject);
    });
}
