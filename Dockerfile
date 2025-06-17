# puppeteer + chromium + 모든 의존 패키지가 포함된 공식 이미지
FROM ghcr.io/puppeteer/puppeteer:latest

# 1) 잠깐 root 권한으로 전환
USER root

WORKDIR /app

# 2) package.json*만 먼저 복사하면서 바로 소유권 지정
COPY --chown=pptruser:pptruser package*.json ./

# 3) 의존성 설치를 root 권한으로 실행
RUN npm install

# 4) 나머지 소스도 한꺼번에 복사하면서 소유권 지정
COPY --chown=pptruser:pptruser . .

# 5) 빌드 이후엔 다시 안전한 일반 사용자로 전환
USER pptruser

CMD ["npm", "start"]
