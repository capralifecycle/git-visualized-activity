FROM alpine:3.16@sha256:7580ece7963bfa863801466c0a488f11c86f85d9988051a9f9c68cb27f6b7872

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
ENV CALS_CLI_VERSION=2.24.1

RUN npm install -g @capraconsulting/cals-cli@${CALS_CLI_VERSION}

ENV DATA_DIR /data

COPY . /app/

WORKDIR /app

CMD ["/app/main.sh"]
