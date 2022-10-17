/**
 * @file Handle /#/video/
 * @name download.ts
 * @license MIT
 */

import { socket, token } from "../core/socket.js";

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
                        <video src="data:video/webm;base64,${
                            data.data
                        }" controls></video>
                    </div>`;

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
