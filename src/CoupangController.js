import express from 'express';
import CoupangService from './CoupangService.js'

import common from './common/CommonService.js';

const router = express.Router();

router.get('/login', async (req, res) => {
    try {
        const userInfo = req.query;
        if (!userInfo?.id || !userInfo.password) {
            return res.status(400).json({ success: false, message: 'ID and password must not be empty.'});
        }
        const data = await CoupangService.login(userInfo);

        data.browser.close(); // Close the browser after fetching shop info

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Login failed' });
        }
        res.json({ success: true, message: data.response });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
});

router.get('/shop-info', async (req, res) => {
    const params = req.query;
    if (!params?.reload) {
        try {
            const parsed = await common.readFile('coupang-shop-info.json');
            if (parsed) return res.status(200).json({ success: true, data: parsed });
        } catch {/* 파일 없으면 무시 */}
    }

    try {
        const data = await CoupangService.getShopInfo();

        data.browser.close(); // Close the browser after fetching shop info

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch shop info' });
        }

        await common.writeFile('coupang-shop-info.json', data.response);
        res.json({ success: true, data: data.response });
    } catch (error) {
        console.error('Get shop info error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shop info', error: error.message });
    }
});

// 전체 메뉴, 옵션 불러오기
router.get('/all-menus', async (req, res) => {
    try {
        const parsed = await common.readFile('coupang-menu-info.json');
        if (parsed) return res.status(200).json({ success: true, data: parsed });
    } catch {/* 파일 없으면 무시 */}

    try {
        const parsed = await common.readFile('coupang-shop-info.json'); // Ensure shop info is available before fetching option list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed[0]?.id) {
            return res.status(400).json({ success: false, message: 'Shop ID not found in shop info' });
        }

        const params = {
            shopId: parsed[0]?.id
        }

        let page = null, browser = null;

        const menus = await CoupangService.getMenus(params, page, browser);

        page = menus.page;
        browser = menus.browser;

        const options = await CoupangService.getOptions(params, page, browser);

        const adjOptions = options?.response?.reduce((acc, group) => {
            if (group?.optionItems && group?.optionItems?.length > 0) {
                group.optionItems.forEach(option => {
                    acc.push({
                        ...option,
                        groupName: group.optionName,
                        groupId: group.optionId,
                    });
                });
            }
            return acc;
        }, [])
        
        browser.close();

        const response = {menus: menus.response, options: adjOptions};

        await common.writeFile('coupang-menu-info.json', response);
        res.json({ success: true, data: response });
    } catch (error) {
        console.error('Get All Menuse and Options error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch get all menus and options', error: error.message });
    }
})

router.post('/soldout-menus', async (req, res) => {
    const body = req.body;

    const menuIds = body?.menuIds;
    const optionIds = body?.optionIds;

    if (menuIds?.length === 0 && optionIds?.length === 0) {
        return res.status(400).json({ success: false, message: 'Both items cannot be empty' });
    }

    try {
        const parsed = await common.readFile('coupang-shop-info.json');
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed[0]?.id) {
            return res.status(400).json({ success: false, message: 'Shop ID not found in shop info' });
        }

        const params = {
            menuIds: menuIds,
            optionIds: optionIds,
            shopId: parsed[0]?.id,
            status: 'SOLD_OUT_TODAY'
        }

        const menus = await CoupangService.updateMenus(params);
        const options = await CoupangService.updateOptions(params, menus.page, menus.browser);
        options.browser.close();

        const response = {menus, options};

        res.json({ success: true, data: response });
    } catch (error) {
        console.error('soldout menus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch soldout', error: error.message });
    }
});

router.post('/active-menus', async (req, res) => {
    const body = req.body;

    const menuIds = body?.menuIds;
    const optionIds = body?.optionIds;

    if (menuIds?.length === 0 && optionIds?.length === 0) {
        return res.status(400).json({ success: false, message: 'Both items cannot be empty' });
    }

    try {
        const parsed = await common.readFile('coupang-shop-info.json');
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed[0]?.id) {
            return res.status(400).json({ success: false, message: 'Shop ID not found in shop info' });
        }

        const params = {
            menuIds: menuIds,
            optionIds: optionIds,
            shopId: parsed[0]?.id,
            status: 'ON_SALE'
        }

        const menus = await CoupangService.updateMenus(params);
        const options = await CoupangService.updateOptions(params, menus.page, menus.browser);
        options.browser.close();

        const response = {menus, options};

        res.json({ success: true, data: response });
    } catch (error) {
        console.error('soldout menus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch soldout', error: error.message });
    }
});

export default router;
