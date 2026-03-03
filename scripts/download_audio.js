import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

async function downloadFile(url, dest) {
    try {
        const res = await fetch(url);
        if (res.status !== 200) return false;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(dest, buffer);
        return true;
    } catch (err) {
        console.error(`Error downloading ${url}:`, err.message);
        return false;
    }
}

async function main() {
    const WP_API = 'https://marcomunich.com/wp-json/wp/v2/posts?per_page=100&status=publish';

    console.log('Fetching post list...');
    let posts = [];
    try {
        const res = await fetch(WP_API);
        posts = await res.json();
    } catch (err) {
        console.error('Failed to fetch posts:', err.message);
        return;
    }

    console.log(`Checking audio for ${posts.length} posts...`);

    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    let downloaded = 0;
    for (const post of posts) {
        const audioUrl = `https://marcomunich.com/wp-content/uploads/text-to-speech-tts/mementor-${post.id}-it.mp3`;
        const dest = path.join(AUDIO_DIR, `mementor-${post.id}-it.mp3`);

        if (fs.existsSync(dest)) {
            console.log(`[Skip] ${post.id} (already exists)`);
            continue;
        }

        console.log(`[Check] ${post.id}...`);
        const success = await downloadFile(audioUrl, dest);
        if (success) {
            console.log(`[Done] Downloaded audio for post ${post.id}`);
            downloaded++;
        }
    }

    console.log(`Finished. Downloaded ${downloaded} new files.`);
}

main();
