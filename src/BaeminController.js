import express from 'express';
import BaeminService from './BaeminService.js';

import common from './common/CommonService.js';

const router = express.Router();

router.get('/login', async (req, res) => {
    try {
        const userInfo = req.query;
        if (!userInfo?.id || !userInfo.password) {
            return res.status(400).json({ success: false, message: 'ID and password must not be empty.'});
        }
        const data = await BaeminService.login(userInfo);

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
            const parsed = await common.readFile('baemin-shop-info.json');
            if (parsed) return res.status(200).json({ success: true, data: parsed });
        } catch {/* 파일 없으면 무시 */}
    }

    try {
        const data = await BaeminService.getShopInfo();

        data.browser.close(); // Close the browser after fetching shop info

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch shop info' });
        }

        await common.writeFile('baemin-shop-info.json', data.response);
        res.json({ success: true, data: data.response });
    } catch (error) {
        console.error('Get shop info error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shop info', error: error.message });
    }
});

router.get('/menu-list', async (req, res) => {
    try {
        const parsed = await common.readFile('baemin-shop-info.json'); // Ensure shop info is available before fetching menu list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.owner?.shopOwnerNumber) {
            return res.status(400).json({ success: false, message: 'Shop owner number not found in shop info' });
        }
        //const params = req.query; // Assuming query parameters are used for menu list

        const shop = parsed.shops?.[0];
        if (!shop) {
            return res.status(400).json({ success: false, message: 'Shop not found in shop info' });
        }

        const body = req.query;
        const params = {
            page: body?.page || 1,
            menuName: body?.menuName,
            shop: shop,
            shopOwnerNumber: parsed.owner.shopOwnerNumber,
        }

        const data = await BaeminService.getMenus(params);

        data.browser.close(); // Close the browser after fetching menu list

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch menu list' });
        }

        res.json({ success: true, data: data.response });
    } catch (error) {
        console.error('Get menu list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch menu list', error: error.message });
    }
});

router.get('/option-list', async (req, res) => {
    try {
        const parsed = await common.readFile('baemin-shop-info.json'); // Ensure shop info is available before fetching option list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.owner?.shopOwnerNumber) {
            return res.status(400).json({ success: false, message: 'Shop owner number not found in shop info' });
        }

        const body = req.query;
        const params = {
            page: body?.page || 0,
            optionName: body?.optionName,
            shopOwnerNumber: parsed.owner.shopOwnerNumber,
        }

        const data = await BaeminService.getOptions(params);

        data.browser.close(); // Close the browser after fetching option list

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch option list' });
        }

        res.json({ success: true, data: data.response });
    } catch (error) {
        console.error('Get option list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch option list', error: error.message });
    }
});

// 전체 메뉴, 옵션 불러오기
router.get('/all-menus', async (req, res) => {
    try {
        const parsed = await common.readFile('baemin-menu-info.json');
        if (parsed) return res.status(200).json({ success: true, data: parsed });
    } catch {/* 파일 없으면 무시 */}

    try {
        const parsed = await common.readFile('baemin-shop-info.json'); // Ensure shop info is available before fetching option list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.owner?.shopOwnerNumber) {
            return res.status(400).json({ success: false, message: 'Shop owner number not found in shop info' });
        }

        const shop = parsed.shops?.[0];
        if (!shop) {
            return res.status(400).json({ success: false, message: 'Shop not found in shop info' });
        }

        const params = {
            page: 1, // Default to page 1
            shop: shop,
            shopOwnerNumber: parsed.owner.shopOwnerNumber,
        }

        let menus = [], options = [];
        let page = null, browser = null;

        while (true) {
            const data = await BaeminService.getMenus(params, page, browser);
            const result = data.response;
            if (!result || !result.data || !result.data.content) {
                return res.status(400).json({ success: false, message: 'invalid data' });
            }

            page = data.page;
            browser = data.browser;

            menus = menus.concat(result.data.content);

            // 다음 페이지로 이동
            if (result.data.last) {
                break; // 마지막 페이지면 종료
            }
            params.page++;
        }
        params.page = 0;    // 옵션은 페이지를 0으로 줌
        while (true) {
            const data = await BaeminService.getOptions(params, page, browser);
            const result = data.response;
            if (!result || !result.data || !result.data.content) {
                return res.status(400).json({ success: false, message: 'invalid data' });
            }

            page = data.page;
            browser = data.browser;

            options = options.concat(result.data.content?.reduce((acc, group) => {
                if (group.options && group.options.length > 0) {
                    group.options.forEach(option => {
                        acc.push({
                            ...option,
                            groupName: group.name,
                            groupId: group.id,
                        });
                    });
                }
                return acc;
            }, []));

            // 다음 페이지로 이동
            if (result.data.last) {
                break; // 마지막 페이지면 종료
            }
            params.page++;
        }
        
        browser.close();

        const response = {menus, options};

        await common.writeFile('baemin-menu-info.json', response);
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
        const parsed = await common.readFile('baemin-shop-info.json');
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.owner?.shopOwnerNumber) {
            return res.status(400).json({ success: false, message: 'Shop owner number not found in shop info' });
        }

        const params = {
            menuIds: menuIds,
            optionIds: optionIds,
            restockedAt: body.restockedAt,
            shopOwnerNumber: body.shopOwnerNumber || parsed.owner.shopOwnerNumber,
        }

        const menus = await BaeminService.soldoutMenus(params);
        const options = await BaeminService.soldoutOptions(params, menus.page, menus.browser);
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
        const parsed = await common.readFile('baemin-shop-info.json');
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.owner?.shopOwnerNumber) {
            return res.status(400).json({ success: false, message: 'Shop owner number not found in shop info' });
        }

        const params = {
            menuIds: menuIds,
            optionIds: optionIds,
            shopOwnerNumber: body.shopOwnerNumber || parsed.owner.shopOwnerNumber,
        }

        const menus = await BaeminService.activeMenus(params);
        const options = await BaeminService.activeOptions(params, menus.page, menus.browser);
        options.browser.close();

        const response = {menus, options};

        res.json({ success: true, data: response });
    } catch (error) {
        console.error('active menus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active', error: error.message });
    }
});

export default router;
