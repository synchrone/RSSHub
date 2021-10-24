const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const url = 'https://www.lidl.de/';
    const response = await got.get(url);
    const $ = cheerio.load(response.data);

    const items = $('#wichtige-kundeninformation')
        .map((_, item) => {
            item = $(item);
            return {
                title: item.find('h2').text(),
                guid: item.find('h2').text(),
                link: url,
                author: 'lidl.de',
                description: item.html(),
                pubDate: new Date(),
            };
        })
        .get();

    ctx.state.data = {
        title: `Lidl.de - Important Announcements`,
        link: url,
        item: items,
    };
};
