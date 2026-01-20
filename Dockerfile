FROM oven/bun:1
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy everything
COPY . .

# Install all dependencies
RUN bun install

# Expose port
EXPOSE 4000

# Run the API directly (bun handles TypeScript)
CMD ["bun", "run", "apps/api/src/index.ts"]
