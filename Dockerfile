FROM node:16-buster

LABEL MAINTAINER Mulberrysoft

LABEL "version"="1.0.0"

RUN sed -i '/jessie-updates/d' /etc/apt/sources.list

RUN apt-get update
RUN apt-get install -y apache2 && apt-get clean

RUN npm i npm@6.14.6 -g && \
   npm install -g @angular/cli@6.0.8


RUN mkdir -p /var/www/app

WORKDIR /var/www/app

COPY  --chown=root . /var/www/app
RUN npm i

RUN node --max_old_space_size=2048 ./node_modules/@angular/cli/bin/ng build --prod --base-href ./

WORKDIR /var/www/html
RUN rm -fr /var/www/html/*
RUN cp -a /var/www/app/dist/. /var/www/html/

RUN a2enmod rewrite

ADD apache-config.conf /etc/apache2/sites-enabled/000-default.conf

EXPOSE 80

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
CMD apachectl -D FOREGROUND
