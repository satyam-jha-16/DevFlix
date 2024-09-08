"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Ensure this is loaded from environment variables
function activate(context) {
    console.log('Congratulations, your extension "devflix" is now active!');
    let openDevflixDisposable = vscode.commands.registerCommand('extension.openDevflix', () => __awaiter(this, void 0, void 0, function* () {
        const panel = vscode.window.createWebviewPanel('devflix', 'Devflix', vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = yield getWebviewContent();
        panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.command) {
                case 'setLink':
                    panel.webview.html = yield getWebviewContent(message.link);
                    break;
            }
        }), undefined, context.subscriptions);
        vscode.window.showInputBox({ prompt: 'Enter YouTube Video or Playlist Link' }).then(link => {
            if (link) {
                panel.webview.postMessage({ command: 'setLink', link: link });
            }
        });
    }));
    context.subscriptions.push(openDevflixDisposable);
}
function deactivate() { }
function getStepsContent() {
    return `
        <div class="steps-container">
            <h2>Welcome to Devflix!</h2>
            <ol>
                <li>Open Youtube on your browser and find a video or playlist you want to watch.</li>
                <li>Copy the video or playlist URL from YouTube.</li>
                <li>Paste the URL into the input field above.</li>
                <li>Click the "Set Link" button or press Enter.</li>
                <li>Enjoy your video or playlist!</li>
                <li>Dont't add link from youtube share button, use the url bar.</li>
            </ol>
        </div>
    `;
}
function getWebviewContent() {
    return __awaiter(this, arguments, void 0, function* (link = '') {
        let iframeSrc = '';
        let playlistContent = '';
        let playlistItems = [];
        if (link) {
            const url = new URL(link);
            const videoId = url.searchParams.get('v');
            const playlistId = url.searchParams.get('list');
            if (playlistId) {
                playlistItems = yield fetchPlaylistItems(playlistId);
                playlistContent = playlistItems.map((item, index) => `
                <li onclick="playVideo(${index})" style="cursor: pointer;">
                    ${item.snippet.title}
                </li>
            `).join('');
                // Set the iframeSrc to the first video in the playlist if no specific video is selected
                if (!videoId && playlistItems.length > 0) {
                    const firstVideoId = playlistItems[0].snippet.resourceId.videoId;
                    iframeSrc = `https://www.youtube.com/embed/${firstVideoId}?autoplay=1&list=${playlistId}`;
                }
            }
            if (videoId) {
                iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1${playlistId ? `&list=${playlistId}` : ''}`;
            }
        }
        const mainContent = link
            ? `
            <div class="video-container">
                <iframe id="mainVideo" src="${iframeSrc}" frameborder="0" allowfullscreen></iframe>
            </div>
            <div class="playlist-container">
                <ul>
                    ${playlistContent}
                </ul>
            </div>
        `
            : getStepsContent();
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Devflix</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                    background-color: #121212;
                    color: #e0e0e0;
                    margin: 0;
                }
                .input-container {
                    display: flex;
                    margin-bottom: 20px;
                }
                #linkInput {
                    flex-grow: 1;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 8px 0 0 8px;
                    font-size: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    color: #e0e0e0;
                    transition: all 0.3s ease;
                }
                #linkInput:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.5);
                }
                button {
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #6a5acd, #483d8b);
                    color: white;
                    border: none;
                    border-radius: 0 8px 8px 0;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                button:hover {
                    background: linear-gradient(135deg, #7b6dd1, #5a4e9e);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }
                .content-container {
                    display: flex;
                    flex-direction: column;
                }
                .video-container {
                    width: 100%;
                    margin-bottom: 20px;
                }
                .playlist-container {
                    width: 100%;
                    max-height: 200px;
                    overflow-y: auto;
                }
                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    overflow: hidden;
                }
                li {
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                li:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                iframe {
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    width: 100%;
                    height: 500px;
                }
                .steps-container {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }
                h2 {
                    margin-top: 0;
                    color: #6a5acd;
                }
                ol {
                    padding-left: 20px;
                }
                ol li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="input-container">
                <input type="text" id="linkInput" placeholder="Enter YouTube link" />
                <button onclick="setLink()">Set Link</button>
            </div>
            <div class="content-container">
                ${mainContent}
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const playlistItems = ${JSON.stringify(playlistItems)};

                function setLink() {
                    const link = document.getElementById('linkInput').value;
                    vscode.postMessage({ command: 'setLink', link: link });
                }

                function playVideo(index) {
                    const videoId = playlistItems[index].snippet.resourceId.videoId;
                    const mainVideo = document.getElementById('mainVideo');
                    const playlistId = new URLSearchParams(mainVideo.src.split('?')[1]).get('list');
                    mainVideo.src = \`https://www.youtube.com/embed/\${videoId}?autoplay=1\${playlistId ? \`&list=\${playlistId}\` : ''}\`;
                }
            </script>
        </body>
        </html>
    `;
    });
}
function fetchPlaylistItems(playlistId) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
            params: {
                part: 'snippet',
                maxResults: 50,
                playlistId: playlistId,
                key: YOUTUBE_API_KEY
            }
        });
        return response.data.items;
    });
}
//# sourceMappingURL=extension.js.map