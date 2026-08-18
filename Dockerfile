FROM node:alpine
RUN mkdir -p /main/bot
WORKDIR /main/bot
ENV NODE_PATH=/usr/local/lib/node_modules
COPY package.json /main/bot
COPY tsconfig.json /main/bot
RUN npm i
RUN npm install pm2 -g
COPY . /main/bot
ENV NODE_PATH=/usr/local/lib/node_modules
ENV PM2_PUBLIC_KEY=tezv3ific2cxb0g
ENV PM2_SECRET_KEY=0d5egausoz9pnlo
LABEL name="rynote" version="1.0"
RUN npm run build
CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]
