FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

COPY --chown=pptruser:pptruser . .

# Puppeteer가 사용하는 경로 권한 보장
RUN mkdir -p /tmp && chown -R pptruser:pptruser /tmp

USER pptruser

CMD ["npm", "start"]
