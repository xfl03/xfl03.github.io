---
title: Docker安装Nextcloud AIO并配置反向代理
layout: single
date: '2023-04-26 15:00:08'
categories:
- 运维
tags:
- Docker
- Nextcloud
- Linux
- Rocky
- Caddy
toc: true
---

Nextcloud是一种主流的私有云方案，可以提供在线网盘、在线文档、在线会议等功能。在使用Docker时，Nextcloud AIO（All-In-One）是一种更为便捷的Nextcloud安装方法。

有公网IP（需要正常使用80、443端口）和无公网IP的方法并不相同，本文会分别讨论这两种情况。Nextcloud强制使用HTTPS，无论是否是公网IP，还需要一个可以正常解析的域名。除此之外，本文还会顺带教学一下如何将Nextcloud的网盘文件存储于外置硬盘。

## 版本参考

作为参考，笔者使用以下软件版本：

- Rocky：9.1
- Docker：23.0.4
- Nextcloud AIO：4.9.0
- Nextcloud：25.0.5
- Caddy：2.6.4

## 挂载硬盘

如果已经挂载好硬盘或者不需要挂载硬盘的话，可以跳过此步骤。

首先获取硬盘UUID，执行以下命令：

```shell
blkid
```

记录下所需挂载硬盘的UUID，如果需要格式化硬盘（**会删除所有数据**），可以使用以下命令格式化为ext4：
```shell
mkfs.ext4 -U 硬盘的UUID
```

然后执行以下命令：

```shell
nano /etc/fstab
```

在文件结尾另起一行，写入（请注意替换硬盘的UUID与挂载点）：

```text
UUID=硬盘的UUID /data ext4 defaults 0 0
```

重启后，可以使用以下命令检查是否正确挂载：

```shell
df -h
```

最后，执行命令为Nextcloud网盘数据创建存储文件夹：

```shell
mkdir /data/nextcloud
```

## 运行Nextcloud AIO

首先请准备好Docker。

案例中的Nextcloud网盘数据文件夹为`/data/nextcloud`，如果打算安装到默认的`/var/lib/docker/volumes/nextcloud_aio_nextcloud_data/_data`文件夹的话，请去掉参数中的环境变量`NEXTCLOUD_DATADIR`。

### 无需反代

如果服务器**有公网IP**，且可以正常使用80、443端口，此时如果不需要额外的反向代理，可以执行以下命令运行Nextcloud AIO：

```shell
docker run \
    --sig-proxy=false \
    --name nextcloud-aio-mastercontainer \
    --restart always \
    --publish 80:80 \
    --publish 8080:8080 \
    --publish 8443:8443 \
    --volume nextcloud_aio_mastercontainer:/mnt/docker-aio-config \
    --volume /var/run/docker.sock:/var/run/docker.sock:ro \
    --env NEXTCLOUD_DATADIR=/data/nextcloud \
    nextcloud/all-in-one:latest
```

会在以下端口开启服务：

- 80：Nextcloud HTTP服务，用于重定向到HTTPS
- 8080：Nextcloud AIO HTTPS服务，使用自签名证书
- 8443：Nextcloud AIO HTTPS服务，自动签发Let's Encrypt证书

在后续安装时，还会在443端口开启Apache的HTTPS服务，自动签发Let's Encrypt证书。

将域名绑定到**公网IP**后，访问`https://你的域名:8443`进入Nextcloud AIO。如果无法访问或证书错误，请检查80端口是否正常开放。

### 需要反代

如果服务器非公网IP，或者公网IP的80和443端口不可用，又或者不想暴露服务器真实IP地址，此时需要设置反向代理，使用以下命令运行Nextcloud AIO：

```shell
docker run \
    --sig-proxy=false \
    --name nextcloud-aio-mastercontainer \
    --restart always \
    --publish 8080:8080 \
    --volume nextcloud_aio_mastercontainer:/mnt/docker-aio-config \
    --volume /var/run/docker.sock:/var/run/docker.sock:ro \
    --env SKIP_DOMAIN_VALIDATION=true \
    --env APACHE_PORT=11000 \
    --env APACHE_IP_BINDING=0.0.0.0 \
    --env NEXTCLOUD_DATADIR=/data/nextcloud \
    nextcloud/all-in-one:latest
```

会在以下端口开启服务：

- 8080：Nextcloud AIO HTTPS服务，使用自签名证书
- 11000：Apache HTTP服务，用于反代

访问`https://服务器IP:8080`进入Nextcloud AIO，此时会提示证书不受信任，可以忽略。

## 反代服务

如果打算使用公网IP直连，就不需要反向代理了，请跳过这一部分。

反代有很多种办法，本文讲解一下最简单的办法，请根据实际情况自行选择。

### CDN

CDN也是一种反代。如果需要公网访问Nextcloud，通过CDN可以有效隐藏真实服务器IP地址。

使用CDN的前提条件是有公网IP让CDN回源。
如果运行Nextcloud的服务器没有公网IP，也可以通过frp转发等方式创造公网IP。

CDN的回源地址为`http://服务器IP:11000`，请注意是**HTTP回源**。
将域名解析到CDN后，还需要启用HTTPS并配置证书。

### Caddy

如果只需要局域网内使用Nextcloud，可以自己使用Caddy启动一个简单的反代服务。

首先将域名解析到服务器上，将域名对应的HTTPS证书（`pem`和`key`格式）上传至服务器，在证书文件夹中执行以下命令：

```shell
nano Caddyfile
```

在打开的文件中写入（请注意替换）：

```text
https://你的域名:443 {
    tls /etc/caddy/pem.pem /etc/caddy/key.key
    reverse_proxy localhost:11000
}
```

保存后执行命令（请注意替换）：

```shell
docker run -d \
    --name caddy \
    --network host \
    --restart always \
    -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
    -v $PWD/证书文件名.pem:/etc/caddy/pem.pem \
    -v $PWD/密钥文件名.key:/etc/caddy/key.key \
    -v caddy_data:/data \
    caddy
```

如果开启了防火墙，还需要开放443端口的访问，Rocky（CentOS）系统可以使用以下命令：

```shell
firewall-cmd --zone=public --add-port=443/tcp --permanent
firewall-cmd --reload 
```

通过上述操作，Caddy会直接使用主机网络，并在443端口开启HTTPS服务。

## 安装Nextcloud

虽然准备工作较为繁琐，不过后续安装可以一键完成。

做好准备工作后，在Nextcloud AIO中设置你的域名、选择需要安装的内容后更新并启动容器即可。

待容器启动完成后，会出现Nextcloud默认管理员的账户密码，点击`Open your Nextcloud`便可以进入Nextcloud。

## 参考文档

- [Nextcloud All-in-One](https://github.com/nextcloud/all-in-one/blob/main/readme.md#nextcloud-all-in-one)
- [Reverse Proxy Documentation](https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md#reverse-proxy-documentation)

## 发布平台

本文中还发表在：

- [知乎](https://zhuanlan.zhihu.com/p/625138865)