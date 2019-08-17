# docker build \
#   --tag autobdd-run:1.0.1 \
#   --build-arg AutoBDD_Ver=1.0.1 \
#   --file autobdd-run.dockerfile \
#   ${PWD}
#
# run test:
# docker-compose run -d autobdd-run "--project=$BDD_PROJECT --parallel=1"
# docker-compose logs -f autobdd-run

FROM ubuntu:18.04
USER root
ENV USER root
ENV DEBIAN_FRONTEND noninteractive
ARG AutoBDD_Ver

RUN sed -i 's#http://archive.ubuntu.com/#http://tw.archive.ubuntu.com/#' /etc/apt/sources.list;

# apt install essential tools for apt install/upgrade
RUN apt clean -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"; \
    apt update -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"; \
    apt full-upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"; \ 
    apt install -q -y --allow-unauthenticated --fix-missing --no-install-recommends -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
		apt-utils curl wget software-properties-common sudo tzdata; \
# Set the timezone.
    sudo dpkg-reconfigure -f noninteractive tzdata; \
# install standard linux tools needed for automation framework
    apt install -q -y --allow-unauthenticated --fix-missing --no-install-recommends -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
    autofs \
    binutils \
    build-essential \
    dirmngr \
    ffmpeg \
    fonts-liberation \
    git \
    gpg-agent \
    imagemagick \
    java-common \
    less \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libopencv-dev \
    libpng++-dev \
    libpython2.7-stdlib \
    libpython3-stdlib \
    libxss1 \
    libxtst-dev \
    locales \
    lsof \
    lubuntu-core \
    maven \
    net-tools \
    ntpdate \
    openjdk-8-jdk \
    python2.7-dev \
    python2.7-minimal \
    python3-dev \
    python3-minimal \
    python3-pip \
    python-pip \
    rdesktop \
    rsync \
    tdsodbc \
    tesseract-ocr \
    tree \
    unixodbc \
    unixodbc-dev \
    unzip \
    wmctrl \
    xclip \
    xdg-utils \
    xdotool \
    xvfb \
    zlib1g-dev; \
# final autoremove
    apt update -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" && \
    apt --purge autoremove -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"; \
# update ca certs
    update-ca-certificates

# install nodejs 8.x
RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - && \
    apt update -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"  && \
    apt install -q -y --allow-unauthenticated --fix-missing -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
    nodejs

# instal google-chrome
RUN rm -f /etc/apt/sources.list.d/google-chrome.list && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    wget -qO- --no-check-certificate https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    apt update -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"  && \
    apt install -q -y --allow-unauthenticated --fix-missing -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
    google-chrome-stable && \
    mkdir -p /etc/opt/chrome/policies/managed && \
    echo "{\"CommandLineFlagSecurityWarningsEnabled\": false}" > /etc/opt/chrome/policies/managed/managed_policies.json

# run finishing set up
RUN update-alternatives --set java /usr/lib/jvm/java-8-openjdk-amd64/jre/bin/java; \
    ln -s /usr/lib/jni/libopencv_java*.so /usr/lib/libopencv_java.so; \
    /usr/sbin/locale-gen "en_US.UTF-8"; echo LANG="en_US.UTF-8" > /etc/locale.conf; \
    mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# download AutoBDD
# install tinydb used for autorunner framework
RUN pip install tinydb && \
    mkdir -p /${USER}/Projects && cd /${USER}/Projects && \
    curl -Lo- https://github.com/xyteam/AutoBDD/archive/${AutoBDD_Ver}.tar.gz | gzip -cd | tar xf - && \
    mv AutoBDD-${AutoBDD_Ver} AutoBDD && \
    cd /${USER}/Projects/AutoBDD && \
    npm config set script-shell "/bin/bash" && \
    npm install && \
    xvfb-run -a npm test

# insert entry point
COPY ./autobdd-run.startup.sh /startup.sh
RUN chmod +x /startup.sh

ENTRYPOINT ["/startup.sh"]
CMD ["--help"]