# Frontend build stage
FROM node:22-alpine AS frontend
WORKDIR /build
# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
# Copy package files and install dependencies
COPY web/package.json web/pnpm-lock.yaml ./web/
WORKDIR /build/web
RUN pnpm install --frozen-lockfile
# Copy web source files
COPY web/ ./
# Create the output directory structure (pnpm release outputs to ../server/router/frontend/dist)
RUN mkdir -p ../server/router/frontend
# Build frontend
RUN pnpm release

# Backend build stage
FROM golang:1.25-alpine AS backend
WORKDIR /backend-build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Copy the built frontend from the frontend stage
COPY --from=frontend /build/server/router/frontend/dist ./server/router/frontend/dist
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -ldflags="-s -w" -o memos ./cmd/memos

FROM alpine:latest AS monolithic
WORKDIR /usr/local/memos

RUN apk add --no-cache tzdata
ENV TZ="UTC"

COPY --from=backend /backend-build/memos /usr/local/memos/
COPY ./scripts/entrypoint.sh /usr/local/memos/

EXPOSE 5230

# Directory to store the data, which can be referenced as the mounting point.
RUN mkdir -p /var/opt/memos
VOLUME /var/opt/memos

ENV MEMOS_MODE="prod"
ENV MEMOS_PORT="5230"
ENV OLLAMA_BASE_URL="http://localhost:11434"
ENV OLLAMA_MODEL="gpt-oss:120b"

ENTRYPOINT ["./entrypoint.sh", "./memos"]
