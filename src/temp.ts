import * as vscode from 'vscode';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Ensure this is loaded from environment variables

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "my-vscode-extension" is now active!');

    let openYouTubeViewerDisposable = vscode.commands.registerCommand('extension.openYouTubeViewer', async () => {
        const panel = vscode.window.createWebviewPanel(
            'youtubeViewer',
            'YouTube Viewer',
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

    context.subscriptions.push(openYouTubeViewerDisposable);
}

export function deactivate() { }

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
            playlistContent = playlistItems.map((item, index) => `
                <li onclick="playVideo(${index})" style="cursor: pointer;">
                    ${item.snippet.title}
                </li>
            `).join('');
        }
        if (videoId) {
            iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Viewer</title>
        </head>
        <body>
            <input type="text" id="linkInput" placeholder="Enter YouTube link" style="width: 100%; padding: 8px;" />
            <button onclick="setLink()">Set Link</button>
            <div style="display: flex; margin-top: 20px;">
                <div style="flex: 1;">
                    <ul style="list-style: none; padding: 0;">
                        ${playlistContent}
                    </ul>
                </div>
                <div style="flex: 3;">
                    <iframe id="mainVideo" width="100%" height="500" src="${iframeSrc}" frameborder="0" allowfullscreen></iframe>
                </div>
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
                    mainVideo.src = \`https://www.youtube.com/embed/\${videoId}?autoplay=1\`;
                }
            </script>
        </body>
        </html>
    `;
}

async function fetchPlaylistItems(playlistId: string): Promise<any[]> {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
        params: {
            part: 'snippet',
            maxResults: 50,
            playlistId: playlistId,
            key: YOUTUBE_API_KEY
        }
    });
    return response.data.items;
}