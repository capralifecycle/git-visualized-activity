FROM alpine:3.14@sha256:adab3844f497ab9171f070d4cae4114b5aec565ac772e2f2579405b78be67c96

RUN set -eux; \
    apk add --no-cache \
      bash \
      g++ \
      git \
      libsecret-dev \
      make \
      npm \
      perl \
      pkgconfig \
      py3-pip \
      python3 \
    ; \
    pip3 install awscli; \
    npm config --global set unsafe-perm true; \
    git config --global credential.helper cache; \
    mkdir /app

# renovate: datasource=npm depName=@capraconsulting/cals-cli
ENV CALS_CLI_VERSION=2.22.1

RUN npm install -g @capraconsulting/cals-cli@${CALS_CLI_VERSION}

ENV DATA_DIR /data

COPY . /app/

WORKDIR /app

CMD ["/app/main.sh"]
