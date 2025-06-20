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

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({
                'accept-language': 'en-US,en;q=0.9',
                // 필요한 추가 헤더가 있으면 넣기
            });

            page.on('response', async response => {
                const url = response.url();
                const status = response.status();
                if (status !== 200 && url.includes('https://self-api.baemin.com')) {
                    console.log('Filtered Response:', response.status(), url);
                    try {
                        const data = await response.json();
                        console.log('Response JSON:', data);
                    } catch (e) {
                        // JSON이 아니거나 파싱 실패 시 무시
                    }
                }
            });
        }
        return page;
    },
    browserOpen: async () => {
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath();

        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: executablePath,
            userDataDir: SESSION_DIR, // 로그인 정보 등 브라우저 세션 저장
            args: [
                // 기존 옵션들
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--single-process',
                '--no-zygote',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080',
            ],
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

        console.log(`check page url: ${page.url()}`);

        const html = await page.content();
        console.log(`current page: ${html}`);

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
        console.log(`### current page: ${page.url()}`);
        console.log(`### request URL: ${url}, method: ${method}`);

        const alreadyExposed = await page.evaluate((name) => {
            return typeof window[name] === 'function';
            }, '_page_console');

        if (!alreadyExposed) {
            await page.exposeFunction('_page_console', (data) => {
                console.log(data);
            })
        }

        const options = common.getOptions(method, body);
        const response = await page.evaluate(async (url, options) => {
            window._page_console(`url: ${url}\noptions: ${JSON.stringify(options)}`);
            let res;
            try{
                res = await fetch(url, options);
            } catch (e) {
                window._page_console(e.message);
                window._page_console('#####################################');
                window._page_console(`error: ${JSON.stringify(e)}`);
                window._page_console('#####################################');
                throw new Error(e);
            }
            return await res?.json();
        }, url, options);

        console.log(`API response from ${url}:`, response);
        return response;
    }
}

export default common;