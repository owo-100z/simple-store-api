import URL from '../URL.js';
import common from './common/CommonUtils.js';

const ddangyoUrl = URL.ddangyo;

// Coupang API 모듈
const api = {
    login: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        try {
            await common.goDdangyoPage(page, params);
            return {response: true, page, browser};
        } catch (error) {
            console.error('Error during Ddangyo login:', error);
            await browser.close();
            throw error;
        }
    },
    getShopInfo: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Coupang shop info...');

        try {
            await common.goDdangyoPage(page);

            const url = ddangyoUrl?.SHOP_INFO_URL;

            console.log('Fetching Coupang shop info from URL:', url);

            const shopInfo = await common.fetchApi(page, url, 'POST');

            const response = shopInfo?.dma_result;
            
            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching Coupang shop info:', error);
            browser.close();
            throw error;
        }
    },
    getOptions: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        try {
            await common.goDdangyoPage(page);

            const url = ddangyoUrl?.GET_OPTION_URL;

            console.log('request parameters... ', params);

            const options = await common.fetchApi(page, url, 'POST', params);

            console.log('Ddangyo options generated successfully:', options);

            const response = options?.dlt_menuOption;

            return {response, page, browser};
        } catch (error) {
            console.error('Error during Ddangyo options generation:', error);
            browser.close();
            throw error;
        }
    },
    getMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Ddangyo menus...');

        try {
            await common.goDdangyoPage(page);

            const url = ddangyoUrl?.GET_MENU_LIST_URL;

            console.log('fetching url... ', url);
            console.log('request parameters... ', params);

            const menus = await common.fetchApi(page, url, 'POST', params);

            console.log('Ddangyo menus generated successfully:', menus);

            const response = menus?.dlt_menuSoldOut;

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching Ddangyo menus:', error);
            browser.close();
            throw error;
        }
    },
    updateMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching update menus status');

        try {
            if (!params?.dma_req) {
                throw new Error('dma_req must be a non-empty.');
            }

            await common.goDdangyoPage(page);

            const url = ddangyoUrl?.CHANGE_STATUS_MENU;

            console.log(`request menus: ${JSON.stringify(params)}`);

            const response = await common.fetchApi(page, url, 'POST', params);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching update menus status', error);
            browser.close();
            throw error;
        }
    },
    updateOptions: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching update options status');

        try {
            if (!params?.dma_req) {
                throw new Error('dma_req must be a non-empty.');
            }

            await common.goDdangyoPage(page);

            const url = ddangyoUrl?.CHANGE_STATUS_OPTION;

            console.log(`request options: ${JSON.stringify(params)}`);

            const response = await common.fetchApi(page, url, 'POST', params);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching update options status', error);
            browser.close();
            throw error;
        }
    },
};

export default api;