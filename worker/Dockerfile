FROM alpine:3.15@sha256:ceeae2849a425ef1a7e591d8288f1a58cdf1f4e8d9da7510e29ea829e61cf512

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
ENV CALS_CLI_VERSION=2.24.0

RUN npm install -g @capraconsulting/cals-cli@${CALS_CLI_VERSION}

ENV DATA_DIR /data

COPY . /app/

WORKDIR /app

CMD ["/app/main.sh"]
