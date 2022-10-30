/**
 * @file Handle yt-dlp-ui server
 * @name index.js
 * @license MIT
 */

// import
import { exec } from "node:child_process"; // we need this to execute yt-dlp
import crypto from "node:crypto"; // needed to generate tokens
import http from "node:http"; // we need to serve media files

import serve from "serve-handler"; // simple http server

import { fileURLToPath } from "node:url"; // we'll use this to get __filename later
import path from "node:path";
import fs from "node:fs";

import { WebSocketServer } from "ws"; // we need this to run our server
import config from "./server.config.js"; // import config

// create server
const httpServer = http.createServer((request, response) => {
    return serve(request, response, {
        public: contentLocation, // only serve content
    });
});

const wss = new WebSocketServer({
    server: httpServer,
});

let tokens = []; // <- we'll store all active connection tokens in here
httpServer.listen(config.port);

// add content folder
const contentLocation = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)), // __dirname
    "./content"
);

if (!fs.existsSync(contentLocation)) fs.mkdirSync(contentLocation);
if (!fs.existsSync(contentLocation + "/logs"))
    fs.mkdirSync(contentLocation + "/logs");

// handle server
wss.on("connection", (ws) => {
    // generate connection token
    const token = crypto.webcrypto.randomUUID();

    // send ready state
    tokens.push(token);

    ws.send(
        JSON.stringify({
            action: "Ready",
            token,
        })
    );

    // handle message
    ws.on("message", (data) => {
        data = data.toString(); // convert buffer to string
        if (!JSON.parse(data)) return ws.close(); // attempt to parse string
        data = JSON.parse(data);

        // must include token, token must also be valid
        if (!data.token) return ws.close();

        // handle token
        if (!tokens.includes(data.token)) return ws.close();

        // handle methods
        switch (data.action) {
            case "DL:Download":
                // this endpoint expects 1 parameter:
                //     videourl: string
                // we will use this to download the video, once complete we will return to the sender

                // make sure we have videourl
                if (!data.videourl) return ws.close();

                // make sure data.videourl startsWith "https://www.youtube.com/watch?v="
                if (
                    !data.videourl.startsWith(
                        "https://www.youtube.com/watch?v="
                    )
                )
                    return ws.send(
                        JSON.stringify({
                            action: "DL:ErrorReport",
                            message: "Invalid URL!",
                        })
                    );

                // send "Hello, world!"
                ws.send(
                    JSON.stringify({
                        action: "DL:ProcessSerial",
                        chunk: "[pong] server: Spawning process...\n",
                    })
                );

                // spawn process
                const cprocess = exec(
                    `cd ${contentLocation} && yt-dlp ${data.videourl} --write-thumbnail`,
                    (error, stdout, stderr) => {
                        if (error) {
                            ws.send(
                                JSON.stringify({
                                    action: "DL:ErrorReport",
                                    message: error.message,
                                })
                            );
                        } else {
                            ws.send(
                                JSON.stringify({
                                    action: "DL:Downloaded",
                                    videourl: data.videourl,
                                    stdout,
                                    stderr,
                                })
                            );
                        }
                    }
                );

                cprocess.stdout.addListener("data", (chunk) => {
                    // save log
                    fs.appendFileSync(
                        contentLocation +
                            `/logs/${new URL(data.videourl).search}.log`,
                        chunk
                    );

                    // send to client
                    ws.send(
                        JSON.stringify({
                            action: "DL:ProcessSerial",
                            chunk,
                        })
                    );
                });

                break;

            case "Get:Library":
                // this endpoint expects no parameters!

                // send back all files under contentLocation
                ws.send(
                    JSON.stringify({
                        action: "Post:Library",
                        data: fs.readdirSync(contentLocation),
                    })
                );

                break;

            case "Get:File":
                // this endpoint excepts 1 parameter:
                //     path: string
                // we will use this to know what path the client is looking for (relative to contentLocation)

                // make sure we have path
                if (!data.path) return ws.close();

                // make sure path doesn't include "/" (we shouldn't need it)
                if (data.path.includes("/")) ws.close();

                // verify file exists
                if (!fs.existsSync(path.resolve(contentLocation, data.path))) {
                    ws.send(
                        JSON.stringify({
                            action: "Post:Error:File",
                            message: "File doesn't exist!",
                        })
                    );

                    break;
                } else {
                    // send back file link
                    ws.send(
                        JSON.stringify({
                            action: "Post:File",
                            path: data.path,
                            /* data: fs.readFileSync(
                                path.resolve(contentLocation, data.path),
                                { encoding: "base64" }
                            ), */
                            data: `http://localhost:${config.port}/${encodeURI(data.path)}`,
                        })
                    );

                    break;
                }

            case "Delete:File":
                // this endpoint excepts 1 parameter:
                //     path: string
                // we will use this to know what path the client is looking for (relative to contentLocation)

                // make sure we have path
                if (!data.path) return ws.close();

                // make sure path doesn't include "/" (we shouldn't need it)
                if (data.path.includes("/")) ws.close();

                // verify file exists
                if (!fs.existsSync(path.resolve(contentLocation, data.path))) {
                    ws.send(
                        JSON.stringify({
                            action: "Post:Error:File",
                            message: "File doesn't exist!",
                        })
                    );

                    break;
                } else {
                    // delete file
                    fs.unlinkSync(path.resolve(contentLocation, data.path));

                    break;
                }

            default:
                ws.close();
                break;
        }
    });

    // handle close
    ws.on("close", () => {
        // delete token
        tokens.splice(tokens.indexOf(token), 1);
    });
});
