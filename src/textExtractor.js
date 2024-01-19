import cheerio from 'cheerio';

export default (text) => {
  const $ = cheerio.load(text);
  return $.text().trim();
};
