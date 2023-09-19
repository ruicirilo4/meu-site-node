import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 56189; // Use a porta fornecida pela Vercel ou a porta 3000 como padrão

// Crie um array para armazenar as músicas recentes
const recentSongs = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/now-playing', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Configurações adicionais para o Puppeteer no ambiente Vercel
    });
    const page = await browser.newPage();

    await page.goto('https://indie88.com/wp-content/themes/indie88/inc/streamon.php');

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

    // Envie os dados das músicas recentes como resposta HTTP
    res.send(grabNowPlayingInfo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error');
  }
});

app.get('/recent-songs', (req, res) => {
  // Filtrar "-" e strings vazias do array de músicas recentes
  const filteredRecentSongs = recentSongs.filter(
    (song) => song !== '-' && song !== ''
  );

  // Retornar a lista filtrada de músicas recentes
  res.json(filteredRecentSongs);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

