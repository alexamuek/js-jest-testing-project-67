import * as cheerio from 'cheerio';
import _ from 'lodash';
import path from 'path';
import fs from 'fs/promises';
import { getContent } from './getPageData.js';


const downloadContent = async (html, contentPath, targetURL, contentFolder) => {
	console.log('contentPath=',contentPath);
	console.log('targetURL=',targetURL);
	const $ = cheerio.load(html);
	$('img').each(async (i, element) => {
		//console.log('i=', i);
		const $img = $(element);
		//const src = $img.attr('src');
		//console.log('src=', src);
		const [pathAndNameFile, extention] = $img.attr('src').split('.');
		//console.log('pathAndNameFile = ', pathAndNameFile);
		//console.log('extention = ', extention);
		const contentUrl = new URL($img.attr('src'), targetURL);
		//console.log('contentUrl = ', contentUrl);
		const URLWithoutExt = contentUrl.href.substring(0,contentUrl.href.lastIndexOf('.'));
		//console.log('URLWithoutExt=', URLWithoutExt)
		const withoutHTTP = URLWithoutExt.substring(URLWithoutExt.indexOf('//') + 2);
		const fileName = `${_.replace(withoutHTTP, /[^0-9a-zA-Z]/g, '-')}.${extention}`;
		console.log('filename = ', fileName);
		if (!contentUrl.hostname.startsWith('www.')) {
      		contentUrl.hostname = 'www.' + contentUrl.hostname;
    	}
		//console.log('contentUrlNEW=',contentUrl);
		const contentData = await getContent(contentUrl.href);
		const fullPath = path.join(contentPath, fileName);
		const newSrc = `${contentFolder}/${fileName}`;
  		//console.log('444= ', fullPath);
  		console.log('newSrc = ', newSrc);
		await fs.writeFile(fullPath, contentData);
		//const newSrc = 'google-com_files/google-com-images-branding-googlelogo-1x-googlelogo-white-background-color-272x92dp.png';
		$img.attr('src', newSrc);
		//$img.attr('src', '111111');
	});
	const updatedHtml = $.html();
	console.log(updatedHtml);
	return html;
	// подменить ссылку в html
	// сохранить html
	// вынести в отдельные функции повторяющийся код
	// проверить логику действий, последовательность
};

export { downloadContent };
