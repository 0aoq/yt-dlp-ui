/**
 * @file Handle /#/download/
 * @name download.ts
 * @license MIT
 */

import { socket, token } from "../core/socket.js";

/**
 * @function submitDownload
 * @description Handle download form submit
 *
 * @param {SubmitEvent} event
 * @returns {void}
 */
function submitDownload(event: SubmitEvent) {
    event.preventDefault();

    // make sure socket is ready and we have a token
    if (socket.readyState !== 1 && token !== "") return; // 1 === ready

    // send download request and wait for message
    socket.send(
        JSON.stringify({
            action: "DL:Download",
            videourl: (event.target! as any).url.value,
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
            case "DL:ErrorReport":
                document.getElementById("downloadErrorReport")!.innerText =
                    data.message;

                // remove event listener
                socket.removeEventListener("message", listener);

                break;

            case "DL:Downloaded":
                // remove event listener
                socket.removeEventListener("message", listener);

                break;

            case "DL:ProcessSerial":
                document.getElementById("downloadSerial")!.innerText +=
                    data.chunk;

                document
                    .getElementById("downloadSerial")!
                    .scrollIntoView(false);

                break;

            default:
                // remove event listener
                socket.removeEventListener("message", listener);

                break;
        }
    };

    socket.addEventListener("message", listener);
}

// get form
const form = document.getElementById("download") as HTMLFormElement;

// listen for hashchange

/**
 * @function checkHash
 * @returns {void}
 */
const checkHash = () => {
    // make sure we're on the right page
    if (!window.location.hash.includes("#/download/%")) {
        form.removeEventListener("submit", submitDownload); // make sure we're not listening for this anymore
        return;
    }

    // bind form submit
    form.addEventListener("submit", submitDownload);
};

window.addEventListener("hashchange", checkHash);
checkHash();
