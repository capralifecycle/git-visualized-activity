FROM alpine:3.13@sha256:69e70a79f2d41ab5d637de98c1e0b055206ba40a8145e7bddb55ccc04e13cf8f

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
ENV CALS_CLI_VERSION=2.21.2

RUN npm install -g @capraconsulting/cals-cli@${CALS_CLI_VERSION}

ENV DATA_DIR /data

COPY . /app/

WORKDIR /app

CMD ["/app/main.sh"]
