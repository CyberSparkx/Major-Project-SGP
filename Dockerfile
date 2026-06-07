FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy the core package files
COPY package.json package-lock.json ./
# Copy the iot-camera package files as postinstall depends on it
COPY iot-camera/package.json iot-camera/package-lock.json ./iot-camera/

# Run install with clean cache
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Copy the node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/iot-camera/node_modules ./iot-camera/node_modules
# Copy all source files
COPY . .

# Next.js telemetry is disabled
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy necessary files for production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Start next app
# NOTE: Since package.json only specifies "next start" for the start script, this will start the Next.js application.
# If you also need to run the `iot-camera` websocket server in this container for production,
# consider adding a specific script in package.json (e.g. "start:all": "concurrently \"next start\" \"...\"") 
# and update the CMD instruction below.
CMD ["npm", "start"]
