# Puppeteer 공식 이미지 사용 (모든 시스템 라이브러리 포함)
FROM ghcr.io/puppeteer/puppeteer:latest

# 작업 디렉토리 지정
WORKDIR /app

# 소스 복사
COPY . .

# 의존성 설치
RUN npm install

# 앱 실행
CMD ["node", "index.js"]