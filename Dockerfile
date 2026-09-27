FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "backend/server.js"]