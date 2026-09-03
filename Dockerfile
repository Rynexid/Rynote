FROM node:24-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-slim
RUN npm install pm2 -g
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .
COPY --from=builder /app/ecosystem.config.cjs .
COPY emoji.json ./
COPY languages ./languages
RUN npm install --omit=dev

LABEL name="rynote" version="1.0"

CMD ["pm2-runtime", "ecosystem.config.cjs", "--env", "production"]
