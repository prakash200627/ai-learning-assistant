FROM node:22-alpine

WORKDIR /app

# Fix directory ownership for non-root execution
RUN chown -R node:node /app

USER node

COPY --chown=node:node package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy backend source
COPY --chown=node:node src ./src

# Pre-create uploads directory so ownership is correctly assigned to node user
RUN mkdir -p uploads

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

CMD ["node", "src/server.js"]
