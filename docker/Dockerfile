# Build the Vite pitch site at site root (/), then serve with nginx.
FROM node:22-alpine AS build

WORKDIR /opt/src

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY public/ public/
COPY src/ src/

# Homelab custom domain serves at /. GitHub Pages keeps vite base /website/.
ARG VITE_BASE=/
ENV VITE_BASE=${VITE_BASE}
RUN npm run build

FROM nginx:alpine

COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /opt/src/dist /usr/share/nginx/html

EXPOSE 80
