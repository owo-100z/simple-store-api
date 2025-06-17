FROM ghcr.io/puppeteer/puppeteer:latest

# pptruser의 홈 디렉토리가 /home/pptruser임을 가정합니다.
# Puppeteer가 이미 내장된 Chromium을 사용하도록 환경 변수를 설정합니다.
# /usr/bin/google-chrome-stable은 puppeteer 이미지가 Chromium을 설치하는 일반적인 경로입니다.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_DOWNLOAD=true # 이미지에 이미 Chromium이 있으므로 추가 다운로드 방지

USER root
WORKDIR /app

COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

COPY --chown=pptruser:pptruser . .

# Puppeteer가 사용하는 경로 권한 보장
# /tmp는 이미 권한이 설정되어 있을 가능성이 높지만, 명시적으로 설정하는 것이 좋습니다.
RUN mkdir -p /tmp && chown -R pptruser:pptruser /tmp

USER pptruser

CMD ["npm", "start"]