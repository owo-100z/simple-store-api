import URL from '../URL.js';
import common from './common/CommonUtils.js';

const baeminUrl = URL.baemin;

// Baemin API 모듈
const api = {
    login: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        try {
            await common.loginToBaemin(page, params);
            return {response: true, page, browser};
        } catch (error) {
            console.error('Error during Baemin login:', error);
            await browser.close();
            throw error;
        }
    },
    getProfile: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Baemin profile...');

        try {
            await common.goBaeminPage(page, browser);

            console.log('Logged in to Baemin, fetching profile...');

            const url = baeminUrl?.OWNER_INFO_URL;

            const response = await common.fetchApi(page, url, 'GET');

            console.log('Baemin profile fetched successfully:', response);
            
            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching Baemin profile:', error);
            browser.close();
            throw error;
        }
    },
    getShopInfo: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Baemin shop info...');

        try {
            await common.goBaeminPage(page, browser);

            console.log('Logged in to Baemin, fetching owner info...');
            const owner = await api.getProfile({id: 'bssi1964', password: '162121bssi'}, page, browser);

            console.log('Owner info fetched:', owner.response);
            
            const paramsWithOwner = {
                shopOwnerNo: owner.response?.shopOwnerNumber,
            };
            const url = baeminUrl?.SHOP_INFO_URL + common.makeGetParams(paramsWithOwner);

            console.log('Fetching Baemin shop info from URL:', url);

            const shopInfo = await common.fetchApi(page, url, 'GET');

            const response = {
                owner: owner.response,
                shops: shopInfo.content || [],
            }
            
            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching Baemin shop info:', error);
            browser.close();
            throw error;
        }
    },
    getOptions: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        try {
            await common.goBaeminPage(page, browser);

            const optionName = params?.optionName || '';
            const pageNo = params?.optionName ? 0 : params?.page || 0;

            const request = {
                optionName: optionName,
                page: pageNo,
                size: 20,
            };

            const menusURL = baeminUrl?.OWNER_URL_V1 + params.shopOwnerNumber + baeminUrl?.GET_OPTION_GROUP_URL;
            const url = menusURL + common.makeGetParams(request);

            const options = await common.fetchApi(page, url, 'GET');

            console.log('Baemin options generated successfully:', options);

            const response = options;

            return {response, page, browser};
        } catch (error) {
            console.error('Error during Baemin options generation:', error);
            browser.close();
            throw error;
        }
    },
    getMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('Fetching Baemin menus...');

        try {
            await common.goBaeminPage(page, browser);

            const menuName = params?.menuName || '';
            const pageNo = params?.menuName ? 0 : params?.page || 1;
            const shop = params?.shop;

            const request = {
                shopId: shop?.shopNo,
                menuName: menuName,
                page: pageNo,
                size: 20,
            };

            const optionsURL = baeminUrl?.OWNER_URL_V2 + params.shopOwnerNumber + baeminUrl?.GET_MENU_LIST_URL;
            const url = optionsURL + common.makeGetParams(request)

            const menus = await common.fetchApi(page, url, 'GET');

            console.log('Baemin options generated successfully:', menus);

            const response = menus;

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching Baemin menus:', error);
            browser.close();
            throw error;
        }
    },
    soldoutMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching soldout menu');

        const menuIds = params?.menuIds;

        try {
            if (!params?.shopOwnerNumber) {
                throw new Error('owner number must be a non-empty.');
            }
            if (!Array.isArray(menuIds) || menuIds.length === 0) {
                return {response: 'nothing changed', page, browser};
            }

            await common.goBaeminPage(page, browser);

            const url = baeminUrl?.OWNER_URL_V2 + params?.shopOwnerNumber + baeminUrl?.SOLDOUT_MENU_URL;

            const request = {
                menuIds: menuIds,
                restockedAt: null, // 입력된 일시까지 품절 처리
            };

            const response = await common.fetchApi(page, url, 'PUT', request);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching soldout', error);
            browser.close();
            throw error;
        }
    },
    activeMenus: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching active menu');

        const menuIds = params?.menuIds;

        try {
            if (!params?.shopOwnerNumber) {
                throw new Error('owner number must be a non-empty.');
            }
            if (!Array.isArray(menuIds) || menuIds.length === 0) {
                return {response: 'nothing changed', page, browser};
            }

            await common.goBaeminPage(page, browser);

            const url = baeminUrl?.OWNER_URL_V2 + params?.shopOwnerNumber + baeminUrl?.ACTIVE_MENU_URL;

            const request = {
                menuIds: menuIds,
            };

            const response = await common.fetchApi(page, url, 'PUT', request);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching soldout', error);
            browser.close();
            throw error;
        }
    },
    soldoutOptions: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching soldout menu');

        const optionIds = params?.optionIds;

        try {
            if (!params?.shopOwnerNumber) {
                throw new Error('owner number must be a non-empty.');
            }
            if (!Array.isArray(optionIds) || optionIds.length === 0) {
                return {response: 'nothing changed', page, browser};
            }

            await common.goBaeminPage(page, browser);

            const url = baeminUrl?.OWNER_URL_V2 + params?.shopOwnerNumber + baeminUrl?.SOLDOUT_OPTION_URL;

            const request = {
                optionIds: optionIds,
                restockedAt: null, // 입력된 일시까지 품절 처리
            };

            const response = await common.fetchApi(page, url, 'PUT', request);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching soldout', error);
            browser.close();
            throw error;
        }
    },
    activeOptions: async (params, page, browser) => {
        browser = await common.checkBrowser(browser);
        page = await common.checkPage(page, browser);

        console.log('fetching active options');

        const optionIds = params?.optionIds;

        try {
            if (!params?.shopOwnerNumber) {
                throw new Error('owner number must be a non-empty.');
            }
            if (!Array.isArray(optionIds) || optionIds.length === 0) {
                return {response: 'nothing changed', page, browser};
            }

            await common.goBaeminPage(page, browser);

            const url = baeminUrl?.OWNER_URL_V2 + params?.shopOwnerNumber + baeminUrl?.ACTIVE_OPTION_URL;

            const request = {
                optionIds: optionIds,
            };

            const response = await common.fetchApi(page, url, 'PUT', request);

            return {response, page, browser};
        } catch (error) {
            console.error('Error fetching soldout', error);
            browser.close();
            throw error;
        }
    },
};

export default api;