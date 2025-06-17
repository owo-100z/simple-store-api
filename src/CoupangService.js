import URL from '../URL.js';
import common from './common/CommonUtils.js';

const coupangUrl = URL.coupang;

// Coupang API 모듈
const api = {
    login: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        try {
            //await common.loginToCoupang(page, params);
            await common.goCoupangPage(page, browser);
            return {response: true, page, browser};
        } catch (error) {
            console.error('Error during Coupang login:', error);
            await browser.close();
            throw error;
        }
    },
    getShopInfo: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Coupang shop info...');

        try {
            await common.goCoupangPage(page, browser);

            const url = coupangUrl?.SHOP_INFO_URL;

            console.log('Fetching Coupang shop info from URL:', url);

            const shopInfo = await common.fetchApi(page, url, 'GET');

            const response = shopInfo?.data;
            
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
            await common.goCoupangPage(page, browser);

            const url = coupangUrl?.SHOP_INFO_URL + params.shopId + coupangUrl?.GET_OPTION_URL;

            const options = await common.fetchApi(page, url, 'GET');

            console.log('Coupang options generated successfully:', options);

            const response = options?.data;

            return {response, page, browser};
        } catch (error) {
            console.error('Error during Coupang options generation:', error);
            browser.close();
            throw error;
        }
    },
    getMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Coupang menus...');

        try {
            await common.goCoupangPage(page, browser);

            const url = coupangUrl?.SHOP_INFO_URL + params.shopId + coupangUrl?.GET_MENU_LIST_URL;

            console.log('fetching url... ', url);

            const menus = await common.fetchApi(page, url, 'GET');

            console.log('Coupang options generated successfully:', menus);

            const response = menus?.data?.menus;

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching Coupang menus:', error);
            browser.close();
            throw error;
        }
    },
    updateMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching update menus status');

        const menuIds = params?.menuIds;

        try {
            if (!params?.shopId) {
                throw new Error('Shop ID must be a non-empty.');
            }
            if (!Array.isArray(menuIds) || menuIds.length === 0) {
                return {response: 'nothing changed', page, browser};
            }

            await common.goCoupangPage(page, browser);

            const url = coupangUrl?.UPDATE_STATUS_URL + params?.shopId + coupangUrl?.CHANGE_STATUS_MENU;

            const request = menuIds?.map((t) => {
                return {dishId: t, displayStatus: params?.status}
            });

            console.log(`request menus: ${JSON.stringify(request)}`);

            const response = await common.fetchApi(page, url, 'POST', request);

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

        const optionIds = params?.optionIds;

        try {
            if (!params?.shopId) {
                throw new Error('Shop ID must be a non-empty.');
            }
            if (!Array.isArray(optionIds) || optionIds.length === 0) {
                return {response: 'nothing changed', page, browser}
            }

            await common.goCoupangPage(page, browser);

            const url = coupangUrl?.UPDATE_STATUS_URL + params?.shopId + coupangUrl?.CHANGE_STATUS_OPTION;

            const request = optionIds?.map((t) => {
                return {optionItemId: t, displayStatus: params?.status}
            });

            console.log(`request options: ${JSON.stringify(request)}`);

            const response = await common.fetchApi(page, url, 'POST', request);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching update options status', error);
            browser.close();
            throw error;
        }
    },
};

export default api;