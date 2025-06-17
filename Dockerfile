FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY package.json package-lock.json ./

# 권한 변경 추가
RUN chown -R pptruser:pptruser /app

# Puppeteer 이미지는 USER pptruser 로 실행됨 → install도 같은 유저로
USER pptruser

RUN npm install

COPY . .

CMD ["npm", "start"]
