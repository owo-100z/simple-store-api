import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const DATA_DIR = process.env.DATA_DIR || '/tmp';
const SESSION_DIR = `${DATA_DIR}/.my-user-data`;

const headers =  {
    'Content-Type': 'application/json; charset=utf-8',
    'service-channel': 'SELF_SERVICE_PC',
};

const loginInfo = () => {
    return {
        baemin: {
            id: process.env.BAEMIN_ID,
            password: process.env.BAEMIN_PASSWORD
        },
        coupang: {
            id: process.env.COUPANG_ID,
            password: process.env.COUPANG_PASSWORD
        },
        ddangyo: {
            id: process.env.DDANGYO_ID,
            password: process.env.DDANGYO_PASSWORD
        }
    }
};

const common = {
    checkBrowser: async (browser) => {
        console.log('Checking browser instance...');
        if (!browser) {
            browser = await common.browserOpen();
            return browser;
        }
        return browser;
    },
    checkPage: async (page, browser) => {
        if (!page) {
            page = await browser.newPage();
        }
        return page;
    },
    browserOpen: async () => {
        console.log('Opening new browser instance...');
        const browser = await puppeteer.launch({
            headless: 'new',
            userDataDir: SESSION_DIR, // 로그인 정보 등 브라우저 세션 저장
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // 서버 환경에서 권장
        });
        return browser;
    },
    makeGetParams: (params) => {
        return '?' + Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    },
    getOptions: (method = 'GET', body = null) => {
        const options = {
            method: method,
            credentials: 'include',
            headers: {...headers},
        }
        if (body) {
            options.body = JSON.stringify(body);
        }
        return options;
    },
    loginToBaemin: async (page, userInfo = {...loginInfo().baemin}) => {
        console.log('Logging in to Baemin with user:', userInfo.id);
        const baeminLoginURL = 'https://biz-member.baemin.com/login';
        if (page.url().indexOf(baeminLoginURL) < 0) {
            // 배민 로그인 페이지로 이동
            await page.goto(baeminLoginURL, { waitUntil: 'networkidle2' });

            if (page.url().indexOf(baeminLoginURL) < 0) {
                return true; // 이미 로그인된 상태이므로 true 반환
            }
        }

        await page.evaluate(() => {
            // 로그인 폼 초기화
            document.querySelector('input[name="id"]').value = '';
            document.querySelector('input[name="password"]').value = '';
        });

        // 로그인 폼 채우기
        await page.type('input[name="id"]', userInfo.id);
        await page.type('input[name="password"]', userInfo.password);

        // 로그인 버튼 클릭
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log('Login attempt completed, current URL:', page.url());

        return true;
    },
    goBaeminPage: async (page, browser) => {
        const baeminAdminURL = 'https://self.baemin.com/';
        if (page.url().indexOf(baeminAdminURL) < 0) {
            console.log('Navigating to Baemin self-service page...');
            await page.goto(baeminAdminURL, { waitUntil: 'networkidle2' });
            if (page.url().indexOf(baeminAdminURL) < 0) {
                console.log('Not logged in, attempting to log in...');
                const login = await common.loginToBaemin(page, {...loginInfo().baemin});
                if (login) {
                    await page.goto(baeminAdminURL, { waitUntil: 'networkidle2' });
                } else {
                    throw new Error('Login failed');
                }
            }
        }
    },
    loginToCoupang: async (page, userInfo = {...loginInfo().coupang}) => {
        console.log('Logging in to Coupang with user:', userInfo.id);
        const coupangLoginURL = 'https://store.coupangeats.com/merchant/login';
        if (page.url().indexOf(coupangLoginURL) < 0) {
            // 쿠팡 로그인 페이지로 이동
            await page.goto(coupangLoginURL, { waitUntil: 'networkidle2' });

            if (page.url().indexOf(coupangLoginURL) < 0) {
                return true; // 이미 로그인된 상태이므로 true 반환
            }
        }

        await page.evaluate(() => {
            // 로그인 폼 초기화
            document.querySelector('input[id="loginId"]').value = '';
            document.querySelector('input[id="password"]').value = '';
        });

        // 로그인 폼 채우기
        await page.type('input[id="loginId"]', userInfo.id);
        await page.type('input[id="password"]', userInfo.password);

        // 로그인 버튼 클릭
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log('Login attempt completed, current URL:', page.url());

        return true;
    },
    goCoupangPage: async (page, browser) => {
        const coupangAdminURL = 'https://store.coupangeats.com';
        if (page.url().indexOf(coupangAdminURL) < 0) {
            console.log('Navigating to Coupang page...');
            await page.goto(coupangAdminURL, { waitUntil: 'networkidle2' });
            if (page.url().indexOf('/management/home') < 0) {
                console.log('Not logged in, attempting to log in...');
                const login = await common.loginToCoupang(page, {...loginInfo().coupang});
                if (login) {
                    await page.goto(coupangAdminURL, { waitUntil: 'networkidle2' });
                } else {
                    throw new Error('Login failed');
                }
            }
        }
    },
    goDdangyoPage: async (page, userInfo = {...loginInfo().ddangyo}) => {
        console.log('Go to Ddangyo:', userInfo.id);
        const ddangyouLoginURL = 'https://boss.ddangyo.com';
        if (page.url().indexOf(ddangyouLoginURL) < 0) {
            // 땡겨요 로그인 페이지로 이동
            await page.goto(ddangyouLoginURL, { waitUntil: 'networkidle2' });
        }

        const isLogin = await page.evaluate(() => {
            const inputID = document.querySelector('input[id="mf_ibx_mbrId"]');
            const inputPW = document.querySelector('input[id="mf_sct_pwd"]')

            if (inputID && inputPW) {
                // 로그인 폼 초기화
                inputID.value = '';
                inputPW.value = '';

                return false;
            } else {
                return true;
            }
        });

        if (isLogin) {
            return true;
        }

        // 로그인 폼 채우기
        await page.type('input[id="mf_ibx_mbrId"]', userInfo.id);
        await page.type('input[id="mf_sct_pwd"]', userInfo.password);

        // 로그인 버튼 클릭
        await Promise.all([
            page.click('input[id="mf_btn_webLogin"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        console.log('Login attempt completed, current URL:', page.url());

        return true;
    },
    fetchApi: async (page, url, method = 'GET', body = null) => {
        console.log(`### request URL: ${url}, method: ${method}`);
        const options = common.getOptions(method, body);
        const response = await page.evaluate(async (url, options) => {
            const res = await fetch(url, options);
            return await res.json();
        }, url, options);

        console.log(`API response from ${url}:`, response);
        return response;
    }
}

export default common;