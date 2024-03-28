import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import iconv from 'iconv-lite';

export const route: Route = {
    path: '/:id',
    categories: ['social-media'],
    example: '/vk/club1',
    parameters: { id: 'group or user name, can be found in URL' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['vk.com/:id', 'm.vk.com/:id'],
            target: ''
        },
    ],
    name: 'VK.com',
    maintainers: ['synchrone'],
    handler,
    description: ``,
};


async function handler(ctx) {
    const id = ctx.req.param('id');
    const lang = ctx.req.query('lang') ?? 'en';
    const baseUrl = 'https://vk.com';
    const currentUrl = `${baseUrl}/${id}`;
    const res = await got({
        method: 'get',
        url: currentUrl,
        responseType: 'buffer',
        headers: {
            'Accept': 'text/html',
            'Accept-Language': lang
        }
    });

    const encoding = res.headers['content-type']?.split('; ')[1]?.split('=')[1]?.replace('-', '') ?? 'windows1251';
    const body = iconv.decode(res.body, encoding);
    const $ = load(body);

    const items = $('#page_wall_posts > .post')
        .toArray()
        .map((_item) => {
            const item = $(_item);
            const link = `${baseUrl}/wall${item.attr('data-post-id')}`;
            const author = item.find('.PostHeaderTitle__authorName').text();
            const date = item.find('a .PostHeaderSubtitle__item').text();

            const postText = item.find('.wall_post_text');
            postText.find('button').remove();
            for (const span of postText.find('span')) {
                delete span.attribs.style;
            }
            for (const img of postText.find('img')) {
                img.attribs.src = `${baseUrl}${img.attribs.src}`;
            }

            let feedDescription = postText.html();

            // TODO: nonimage attachments
            for (const img of item.find('.PhotoPrimaryAttachment__imageElement')) {
                feedDescription += `<br />${$(img).toString()}`;
            }

            return {
                title: date,
                link,
                description: feedDescription,
                pubDate: parseDate(date),
                author
            };
        });

    return {
        title: $('title').text(),
        link: currentUrl,
        item: items,
    };
}
