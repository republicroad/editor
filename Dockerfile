FROM registry.cn-qingdao.aliyuncs.com/geetest_cb/nginx:1.21.3
MAINTAINER boge <chengbo@geetest.com>

RUN mkdir -p /mnt/nginx/conf.d \
    && mkdir /mnt/nginx/www
WORKDIR /mnt/nginx/www

COPY . .

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
