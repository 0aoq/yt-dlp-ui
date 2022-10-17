/**
 * @file Open socket connection
 * @name socket.ts
 * @license MIT
 */

export const socket = new WebSocket(
    window.location.host.startsWith("localhost")
        ? "ws://localhost:3047"
        : `wss://yt-ws.${window.location.origin}`
);

export let token = "";

socket.addEventListener("open", () => {
    console.log(performance.now(), "Socket opened!")!;
});

socket.addEventListener("close", () => {
    console.log(performance.now(), "Socket closed!");
});

// wait for ready...
socket.addEventListener("message", (event: any) => {
    let { data } = event as any;

    // make sure data is JSON
    if (!JSON.parse(data)) return;
    data = JSON.parse(data);

    // make sure data.action === "Ready"
    if (data.action !== "Ready") return;

    // set token
    token = data.token;
});
