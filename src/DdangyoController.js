import express from 'express';
import DdangyoService from './DdangyoService.js';

import common from './common/CommonService.js';

const router = express.Router();

let page, browser;

router.get('/login', async (req, res) => {
    try {
        const userInfo = req.query;
        if (!userInfo?.id || !userInfo.password) {
            return res.status(400).json({ success: false, message: 'ID and password must not be empty.'});
        }
        const data = await DdangyoService.login(userInfo, page, browser);

        data.browser.close(); // Close the browser after fetching shop info

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Login failed' });
        }
        res.json({ success: true, message: data.response });
    } catch (error) {
        if (browser) browser.close();
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
});

router.get('/shop-info', async (req, res) => {
    const params = req.query;
    if (!params?.reload) {
        try {
            const parsed = await common.readFile('ddangyo-shop-info.json');
            if (parsed) return res.status(200).json({ success: true, data: parsed });
        } catch {/* 파일 없으면 무시 */}
    }

    try {
        const data = await DdangyoService.getShopInfo({}, page, browser);

        data.browser.close(); // Close the browser after fetching shop info

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch shop info' });
        }

        await common.writeFile('ddangyo-shop-info.json', data.response);
        res.json({ success: true, data: data.response });
    } catch (error) {
        if (browser) browser.close();
        console.error('Get shop info error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shop info', error: error.message });
    }
});

router.get('/menu-list', async (req, res) => {
    try {
        const parsed = await common.readFile('ddangyo-shop-info.json'); // Ensure shop info is available before fetching menu list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.rpsnt_patsto_no) {
            return res.status(400).json({ success: false, message: 'rpsnt_patsto_no not found in shop info' });
        }

        const body = req.query;
        const params = {
            dma_para: {
                patsto_no: parsed.rpsnt_patsto_no,
                menu_search: body?.menuName || '',
                menu_grp_id: '',
                group_div_cd: 0,
                pos_div_cd: '',
            },
        }

        const data = await DdangyoService.getMenus(params, page, browser);

        data.browser.close(); // Close the browser after fetching menu list

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch menu list' });
        }

        res.json({ success: true, data: data.response });
    } catch (error) {
        if (browser) browser.close();
        console.error('Get menu list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch menu list', error: error.message });
    }
});

router.get('/option-list', async (req, res) => {
    try {
        const parsed = await common.readFile('ddangyo-shop-info.json'); // Ensure shop info is available before fetching option list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.rpsnt_patsto_no) {
            return res.status(400).json({ success: false, message: 'rpsnt_patsto_no not found in shop info' });
        }

        const body = req.query;
        const params = {
            dma_para: {
                patsto_no: parsed.rpsnt_patsto_no,
                optn_search: body?.optionName || '',
                optn_grp_id: '',
                group_div_cd: 0,
                optn_grp_nm: '',
                ncsr_yn: '',
                min_optn_choice_cnt: '',
                max_optn_choice_cnt: '',
                all_optn_choice_cnt: '',
            },
        }

        const data = await DdangyoService.getOptions(params, page, browser);

        data.browser.close(); // Close the browser after fetching option list

        if (!data || !data.response) {
            return res.status(400).json({ success: false, message: 'Failed to fetch option list' });
        }

        res.json({ success: true, data: data.response });
    } catch (error) {
        if (browser) browser.close();
        console.error('Get option list error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch option list', error: error.message });
    }
});

// 전체 메뉴, 옵션 불러오기
router.get('/all-menus', async (req, res) => {
    try {
        const parsed = await common.readFile('ddangyo-menu-info.json');
        if (parsed) return res.status(200).json({ success: true, data: parsed });
    } catch {/* 파일 없으면 무시 */}

    try {
        const parsed = await common.readFile('ddangyo-shop-info.json'); // Ensure shop info is available before fetching option list
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.rpsnt_patsto_no) {
            return res.status(400).json({ success: false, message: 'rpsnt_patsto_no not found in shop info' });
        }

        const params = {
            dma_para: {
                patsto_no: parsed.rpsnt_patsto_no,
                menu_search: '',
                menu_grp_id: '',
                pos_div_cd: '',
                optn_search: '',
                optn_grp_id: '',
                group_div_cd: 0,
                optn_grp_nm: '',
                ncsr_yn: '',
                min_optn_choice_cnt: '',
                max_optn_choice_cnt: '',
                all_optn_choice_cnt: '',
            },
        }

        const menus = await DdangyoService.getMenus(params, page, browser);

        page = menus.page;
        browser = menus.browser;

        const options = await DdangyoService.getOptions(params, page, browser);
        
        browser.close();

        const response = {menus, options};

        await common.writeFile('ddangyo-menu-info.json', response);
        res.json({ success: true, data: response });
    } catch (error) {
        if (browser) browser.close();
        console.error('Get All Menuse and Options error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch get all menus and options', error: error.message });
    }
})

router.post('/soldout-menus', async (req, res) => {
    const body = req.body;

    const menus = body?.menus || [];
    const options = body?.options || [];

    if (menus?.length === 0 && options?.length === 0) {
        return res.status(400).json({ success: false, message: 'Both items cannot be empty' });
    }

    try {
        const parsed = await common.readFile('ddangyo-shop-info.json');
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.rpsnt_patsto_no) {
            return res.status(400).json({ success: false, message: 'rpsnt_patsto_no not found in shop info' });
        }

        console.log(`menus: ${menus}`);

        for (const menu of menus) {
            const params = {
                dma_req: {
                    ...menu,
                    patsto_no: parsed.rpsnt_patsto_no,
                    fin_chg_id: parsed.patsto_mbr_id,
                    sldot_yn: '1',
                    hide_yn: '',
                    pckg_hide_yn: '',
                    sto_hide_yn: '',
                },
            }

            const rtn = await DdangyoService.updateMenus(params, page, browser);

            if (!page && !browser) {
                page = rtn?.page;
                browser = rtn?.browser;
            }

            if (rtn.response?.dma_error?.result !== 'SUCCESS') {
                browser.close();
                res.status(500).json({ success: false, message: 'Failed to fetch soldout', error: error.message });
                return;
            }
        }
        
        for (const option of options) {
            const params = {
                dma_req: {
                    ...option,
                    patsto_no: parsed.rpsnt_patsto_no,
                    fin_chg_id: parsed.patsto_mbr_id,
                    sldot_yn: '1',
                    hide_yn: '',
                    optn_sell_stat_cd: '',
                },
            }

            const rtn = await DdangyoService.updateOptions(params, page, browser);

            if (!page && !browser) {
                page = rtn?.page;
                browser = rtn?.browser;
            }

            if (rtn.response?.dma_error?.result !== 'SUCCESS') {
                browser.close();
                res.status(500).json({ success: false, message: 'Failed to fetch soldout', error: error.message });
                return;
            }
        }

        browser.close();

        const response = {menus, options};

        res.json({ success: true, data: response });
    } catch (error) {
        if (browser) browser.close();
        console.error('soldout menus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch soldout', error: error.message });
    }
});

router.post('/active-menus', async (req, res) => {
    const body = req.body;

    const menus = body?.menus || [];
    const options = body?.options || [];

    if (menus?.length === 0 && options?.length === 0) {
        return res.status(400).json({ success: false, message: 'Both items cannot be empty' });
    }

    try {
        const parsed = await common.readFile('ddangyo-shop-info.json');
        console.log('Parsed shop info:', parsed);
        if (!parsed || !parsed.rpsnt_patsto_no) {
            return res.status(400).json({ success: false, message: 'rpsnt_patsto_no not found in shop info' });
        }

        for (const menu of menus) {
            const params = {
                dma_req: {
                    ...menu,
                    patsto_no: parsed.rpsnt_patsto_no,
                    fin_chg_id: parsed.patsto_mbr_id,
                    sldot_yn: '0',
                    hide_yn: '',
                    pckg_hide_yn: '',
                    sto_hide_yn: '',
                },
            }

            const rtn = await DdangyoService.updateMenus(params, page, browser);

            if (!page && !browser) {
                page = rtn?.page;
                browser = rtn?.browser;
            }

            if (rtn.response?.dma_error?.result !== 'SUCCESS') {
                browser.close();
                res.status(500).json({ success: false, message: 'Failed to fetch active', error: error.message });
                return;
            }
        }

        console.log('browser info: ', browser);

        for (const option of options) {
            const params = {
                dma_req: {
                    ...option,
                    patsto_no: parsed.rpsnt_patsto_no,
                    fin_chg_id: parsed.patsto_mbr_id,
                    sldot_yn: '0',
                    hide_yn: '',
                    optn_sell_stat_cd: '',
                },
            }

            const rtn = await DdangyoService.updateOptions(params, page, browser);

            if (!page && !browser) {
                page = rtn?.page;
                browser = rtn?.browser;
            }

            if (rtn.response?.dma_error?.result !== 'SUCCESS') {
                browser.close();
                res.status(500).json({ success: false, message: 'Failed to fetch active', error: error.message });
                return;
            }
        }

        browser.close();

        const response = {menus, options};

        res.json({ success: true, data: response });
    } catch (error) {
        if (browser) browser.close();
        console.error('active menus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active', error: error.message });
    }
});

export default router;
