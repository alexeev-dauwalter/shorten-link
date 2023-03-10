FROM node
WORKDIR /app
COPY . .
RUN npm install
RUN npm run prisma:postgres
CMD npm start
EXPOSE 3000