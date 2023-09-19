import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';
import express from 'express';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 56189;

// Crie um array para armazenar as músicas recentes
const recentSongs = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/now-playing', async (req, res) => {
  try {
    const response = await axios.get('https://api.allorigins.win/raw?url=https://indie88.com/wp-content/themes/indie88/inc/streamon.php');
    const html = response.data;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Carregue o conteúdo HTML obtido da página
    await page.setContent(html);

    await page.waitForSelector('.cobrp-ticker-info', { timeout: 180000 });

    const grabNowPlayingInfo = await page.evaluate(() => {
      const nowPlayingElements = document.querySelectorAll('.cobrp-ticker-info');
      const recentSongs = [];

      nowPlayingElements.forEach((element) => {
        const artistElement = element.querySelector('.cobrp-ticker-artist');
        const songElement = element.querySelector('.cobrp-ticker-songtitle');

        const artistText = artistElement ? artistElement.textContent.trim() : '';
        const songText = songElement ? songElement.textContent.trim() : '';

        if (artistText && songText) {
          recentSongs.push(`${artistText} - ${songText}`);
        }
      });

      return recentSongs;
    });

    await browser.close();

    res.send(grabNowPlayingInfo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error');
  }
});

app.get('/recent-songs', (req, res) => {
  const filteredRecentSongs = recentSongs.filter(
    (song) => song !== '-' && song !== ''
  );

  res.json(filteredRecentSongs);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


