/**
 * @file Handle /#/video/
 * @name download.ts
 * @license MIT
 */

import { socket, token } from "../core/socket.js";

/**
 * @function b2ab
 *
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
function b2ab(base64: string) {
    const str = window.atob(base64);
    const len = str.length;
    let bytes = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }

    return bytes.buffer;
}

/**
 * @function showVideo
 *
 * @param {string} address
 * @returns {void}
 */
function showVideo(address: string) {
    // make sure socket is ready and we have a token
    if (socket.readyState !== 1 && token !== "") return; // 1 === ready

    // send download request and wait for message
    socket.send(
        JSON.stringify({
            action: "Get:File",
            path: address,
            token,
        })
    );

    // add event listener
    const listener = (event: any) => {
        let { data } = event as any;

        // make sure data is JSON
        if (!JSON.parse(data)) return;
        data = JSON.parse(data);

        // handle actions
        switch (data.action) {
            case "Post:File":
                // make sure it is the correct file
                if (data.path !== address) break;

                // show video
                const page = document.getElementById(
                    "page/video/"
                ) as HTMLDivElement;

                page.innerHTML = `<div class="header">
                        <h2>${address.split(".webm")[0]}</h2>
                    </div>
                    
                    <div class="core.post">
                        <video src="${/* URL.createObjectURL(
                            new Blob([b2ab(data.data)], { type: "video/webm" })
                        ) */ data.data}" controls></video>

                        <button onclick="window.vdel()" class="mt-2">Delete Video</button>
                    </div>`;

                // register window functions
                (window as any).vdel = () => {
                    // send delete request for video and thumbnail
                    socket.send(
                        JSON.stringify({
                            action: "Delete:File",
                            path: address,
                            token,
                        })
                    );

                    socket.send(
                        JSON.stringify({
                            action: "Delete:File",
                            path: address.replace("webm", "webp"),
                            token,
                        })
                    );

                    window.location.href = "?#/%"; // send home
                };

                // remove event listener
                socket.removeEventListener("message", listener);

                break;

            default:
                // remove event listener
                socket.removeEventListener("message", listener);

                break;
        }
    };

    socket.addEventListener("message", listener);
}

// listen for hashchange

/**
 * @function checkHash
 * @returns {void}
 */
const checkHash = () => {
    // make sure we're on the right page
    if (!window.location.hash.includes("#/video/%")) return;

    // check for video id in search
    const searchParams = new URLSearchParams(window.location.search);

    // wait for socket
    setTimeout(() => {
        if (searchParams.get("v")) showVideo(`${searchParams.get("v")}.webm`);
    }, 500);
};

window.addEventListener("hashchange", checkHash);
checkHash();
