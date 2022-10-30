/**
 * @file Handle /#/
 * @name download.ts
 * @license MIT
 */

import { socket, token } from "../core/socket.js";

/**
 * @function downloadFeed
 * @returns {void}
 */
function downloadFeed() {
    // make sure socket is ready and we have a token
    if (socket.readyState !== 1 && token !== "") return; // 1 === ready

    // send download request and wait for message
    socket.send(
        JSON.stringify({
            action: "Get:Library",
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
            case "Post:Library":
                // display videos
                for (let video of data.data) {
                    if (video === "logs") continue;
                    if (video.includes(".webp")) continue;

                    // display
                    const feed = document.getElementById(
                        "core.home"
                    ) as HTMLDivElement;

                    const name = video.split(".webm")[0];

                    feed.insertAdjacentHTML(
                        "beforeend",
                        `<div class="core.post" id="post-${name}">
                            <h2 class="post.title">
                                <a href="?v=${name}#/video/%">${name}</a>
                            </h2>
                        </div>`
                    );

                    // request thumbnail
                    socket.send(
                        JSON.stringify({
                            action: "Get:File",
                            path: `${name}.webp`,
                            token,
                        })
                    );

                    socket.addEventListener("message", (event: any) => {
                        let { data } = event as any;

                        // make sure data is JSON
                        if (!JSON.parse(data)) return;
                        data = JSON.parse(data);

                        // handle actions
                        if (
                            data.action === "Post:File" &&
                            data.path === `${name}.webp`
                        ) {
                            // add thumbnail
                            document
                                .getElementById(`post-${name}`)!
                                .insertAdjacentHTML(
                                    "beforeend",
                                    `<img src="${
                                        /*data:image/webp;base64,${data.data}*/ data.data
                                    }" class="mt-2">`
                                );
                        }
                    });
                }

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

socket.addEventListener("open", () => {
    setTimeout(() => {
        downloadFeed();
    }, 500);
});

/**
 * @function checkHash
 * @returns {void}
 */
const checkHash = () => {
    // make sure we're on the right page
    if (!window.location.hash.includes("#/%")) return;
};

window.addEventListener("hashchange", checkHash);
checkHash();
