const puppeteer = require("puppeteer");

function colorize(text, colorCode) {
    return `\x1b[${colorCode}m${text}\x1b[0m`;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

if (process.argv.length < 3) {
    console.error(colorize('ERROR: Please, provide some Spotify playlist link. Notice that the playlist must be public', 31));
    process.exit(1);
}

const link = process.argv[2];
const yt_url = "https://www.youtube.com";

console.log(colorize(`Spotify Playlist Link received successful: ${link}`, 32));



const start = async () => {

    const browser = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(link, { waitUntil: "networkidle2" });

    await sleep(2000);

    await page.waitForSelector('div[data-testid="tracklist-row"]');

    const tracklist = await page.evaluate(() => {
        let list = [];
        let musics = Array.from(
            document.querySelectorAll('div[data-testid="tracklist-row"]')
        );

        musics.map((track) => {
            let divTrack = track.querySelectorAll("div")[2];
            let artistData = divTrack.querySelector("div > span > div > a");
            let songData = divTrack.querySelector("div > a.t_yrXoUO3qGsJS4Y6iXX");
            let artist = artistData ? artistData.textContent.trim() : '';
            let song = songData ? songData.textContent.trim() : '';

            list.push({
                song,
                artist,
            });
        });
        return list;
    })

    // Check the playlist
    // TODO 
    // There is something going wrong with my playlist selector. 
    // Most part of the songs are not included by my query selector. Has to be fixed.


    console.log("track:", tracklist);
    await page.goto(yt_url, { waitUntil: "networkidle2" });

    for (const track of tracklist) {

        // Search song

        let song = `${track.artist} ${track.song}`;
        await page.waitForSelector("input[name=search_query]");
        await page.evaluate(() => (document.querySelector("input[name=search_query]").value = ""));

        // Type song name

        await page.type("input[name=search_query]", song, { delay: 50 });
        await sleep(1500);

        // Click 
        await page.click("#search-icon-legacy");
        await page.waitForSelector("#contents");
        await sleep(3000);

        await page.waitForSelector("yt-icon-button#button");
        await page.evaluate(() => {
            let buttons = Array.from(document.querySelectorAll("div.style-scope.ytd-video-renderer yt-icon-button#button"))
            buttons[1].click();
        });

        // Search add to queue button

        const textContent = "Add to queue";

        await page.evaluate((textContent) => {

            const elements = document.querySelectorAll('.style-scope.ytd-menu-service-item-renderer');
            const element = Array.from(elements).find(el => el.textContent.trim() === textContent);

            // Avoid code break
            if (element) {
                element.click();
            }

        }, textContent);

        await sleep(500);
    }

}


// Initialize the code
start();