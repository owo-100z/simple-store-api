# ARM64 아키텍처용 Node.js 이미지 사용 및 Chromium 수동 설치
FROM arm64v8/node:lts-slim

# 필요한 Chromium 의존성 설치 (root 권한 필요)
USER root
RUN apt-get update && apt-get install -yq --no-install-recommends \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst \
    --force-yes \
    && rm -rf /var/lib/apt/lists/*

# Chromium 실행 파일 경로 설정
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# npm install 전에 파일을 COPY (root 권한으로 복사됨)
COPY package*.json ./

# COPY된 파일들의 소유권을 'node' 사용자에게 부여 (root 권한 필요)
RUN chown -R node:node .

# Puppeteer 캐시 디렉토리 권한 보장 (root 권한 필요)
# /tmp 디렉토리는 보통 모든 사용자가 쓸 수 있도록 되어있으나,
# 명시적으로 'node' 사용자에게 소유권을 주려면 root 권한이 필요합니다.
# 이미지는 기본적으로 /tmp에 쓰기 권한이 있을 수 있으므로,
# 이 줄 자체가 필요 없을 수도 있지만, 일단 root에서 실행하도록 합니다.
RUN mkdir -p /tmp && chown -R node:node /tmp

# 이제 npm install 및 나머지 명령을 비-root 사용자로 실행합니다.
USER node

RUN npm install

# 나머지 파일 복사 (node 사용자 권한으로 복사)
COPY . .

# 컨테이너 실행 시 사용할 사용자 (생략 가능, 이미 USER node 상태)
# USER node
CMD ["npm", "start"]