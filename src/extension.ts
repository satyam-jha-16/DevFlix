import * as vscode from 'vscode';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;


export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "devflix" is now active!');

    let openDevflixDisposable = vscode.commands.registerCommand('extension.openDevflix', async () => {
        const panel = vscode.window.createWebviewPanel(
            'devflix',
            'Devflix',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = await getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'setLink':
                        panel.webview.html = await getWebviewContent(message.link);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        vscode.window.showInputBox({ prompt: 'Enter YouTube Video or Playlist Link' }).then(link => {
            if (link) {
                panel.webview.postMessage({ command: 'setLink', link: link });
            }
        });
    });

    context.subscriptions.push(openDevflixDisposable);
}

export function deactivate() { }

function getStepsContent(): string {
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

async function getWebviewContent(link: string = ''): Promise<string> {
    let iframeSrc = '';
    let playlistContent = '';
    let playlistItems = [];

    if (link) {
        const url = new URL(link);
        const videoId = url.searchParams.get('v');
        const playlistId = url.searchParams.get('list');

        if (playlistId) {
            playlistItems = await fetchPlaylistItems(playlistId);
            console.log('Fetched playlist items:', playlistItems);
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
            <div id="debug"></div>
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
                document.getElementById('debug').textContent = JSON.stringify(playlistItems);
            </script>
        </body>
        </html>
    `;
}

async function fetchPlaylistItems(playlistId: string): Promise<any[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log('API Key in fetchPlaylistItems:', apiKey);
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
            params: {
                part: 'snippet',
                maxResults: 50,
                playlistId: playlistId,
                key: apiKey
            }
        });
        return response.data.items;
    } catch (error) {
        console.error('Error fetching playlist items:', error);
        return [];
    }
}