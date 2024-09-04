---
title: 在Proxmox VE LXC容器中部署Tailscale并转发局域网及管理后台 
layout: single
date: '2024-09-05 00:33:33'
categories:
- 运维
tags:
- ProxmoxVE
- PVE
- Linux
- LXC
- Tailscale
- Debian
- Caddy
toc: true
---

[Proxmox Virtual Environment](https://www.proxmox.com/en/proxmox-virtual-environment/overview)（Proxmox VE、PVE）是一个开源虚拟化系统，提供[Linux Container](https://pve.proxmox.com/wiki/Linux_Container)（LXC）的轻量级容器功能。PVE本体不应安装任何额外软件，有需要的可以安装在虚拟机或者LXC中，对本体的所有操作都请做好备份。

[Tailscale](https://tailscale.com/)是一个虚拟局域网工具，主要提供流量转发功能，机器之间可以直连（IPv4或IPv6均可）或通过[DERP服务器](https://tailscale.com/kb/1232/derp-servers)中转（也可以在云服务器上自部署DERP）。

本篇文章将会指引：

- 在PVE LXC中安装Tailscale
- 使用Tailscale转发子网
- 通过Tailscale Serve远程访问PVE管理后台

# 版本参考

笔者在编写文章过程中使用的软件版本一览：

- PVE：8.2.4
- PVE的Linux内核：6.8.12-1-pve
- LXC使用的Debian：12.2-1
- Tailscale：1.72.1
- Caddy：2.6.2

# 下载LXC用的CT模板

## 切换CT模板镜像源

官方CT模板的源在大陆访问比较慢，可以考虑切换成镜像源，不在大陆或者有别的手段的读者可以直接跳过。

以中国科学技术大学（USTC）的[镜像源](https://mirrors.ustc.edu.cn/help/proxmox.html)为例：

- 在PVE管理控制台中，点击左侧「pve」
- 选择「Shell」，在Shell中执行以下内容：

```sh
sed -i.bak 's|http://download.proxmox.com|https://mirrors.ustc.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
systemctl restart pvedaemon
```

## 下载CT模板

随便下载一个新一点的CT模板，这里以Debian为例：

- 在PVE管理控制台中，点击左侧「local (pve)」
- 选择「CT模板」，再点击「模板」
- 选择「debian-12-standard」，点击「下载」
- 等待下载完成后关闭窗口

切记不要下载Alpine的CT模板，Alpine的CT模板最新只有3.19版本的，只能用旧版本（1.54.1-r3）的Tailscale，会有不少问题。（被坑过了有感而发）

# 创建LXC容器

- 在PVE管理控制台中，点击右上角「创建CT」
- 在「常规」选项卡中设置密码，并**勾选「无特权的容器」**（经过试验，即便取消勾选了「无特权的容器」，打开了所有的功能开关，也不能直接访问`/dev/net/tun`）
- 「模板」选择刚才下载的`debian-12-standard_12.2-1_amd64.tar.zst`
- 磁盘、CPU、内存看着分配就行，用不了多少（最低配置参考：128MB内存、1GB硬盘）
- 网络得有（废话）
- 创建后请勿启动，还有东西要配置

# 配置LXC容器

在启动之前，需要允许访问`/dev/net/tun`：

- 点击「pve」，打开「Shell」
- 看一眼LXC容器的编号（比如`104`）
- 编辑`/etc/pve/lxc/104.conf`（Debian自带nano，可以使用`nano /etc/pve/lxc/104.conf`，请将`104`换成正确的编号），在最后起新行写入并保存：
```conf
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file
```

还需要配置Shell：

- 在左侧选择刚才创建的LXC容器
- 点击「选项」，「控制台模式」更换为「shell」

还建议配置自动启动：

- 在「选项」界面，「自动启动」更换为「是」

如果打开了「防火墙」功能，还需要配置防火墙。点击LXC容器的「防火墙」，放行（操作为「ACCEPT」）以下「目标端口」与「协议」的组合：

- 443：tcp
- 3478：udp
- 41641：udp

# 安装Tailscale

先进入LXC容器的Shell。在LXC容器，选择「控制台」进入Shell。

## 更换apt镜像源

需要apt镜像源的可以切换一下，[USTC镜像源](https://mirrors.ustc.edu.cn/help/debian.html)可以使用以下命令：

```sh
sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
sed -i -e 's|security.debian.org/\? |security.debian.org/debian-security |g' -e 's|security.debian.org|mirrors.ustc.edu.cn|g' -e 's|deb.debian.org/debian-security|mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list
```

## （可选）更新依赖

因为是新装的系统，还是更新一下依赖吧，使用以下命令：

```sh
apt update
apt upgrade
```

## 安装Tailscale

可以使用一键安装脚本：

```sh
wget -O - https://tailscale.com/install.sh | sh
```

Debian系统自带wget，读者也可以自己安装一个curl，然后用`curl -fsSL`。

不喜欢一键安装的读者也可以参考[手动安装方法](https://tailscale.com/kb/1174/install-debian-bookworm)。

# 启动Tailscale

其实安装完就已经会把Tailscale服务启动了，不过还需要登录一下Tailscale账号：

- 在LTX容器的命令行中，执行`tailscale up`
- 打开出现的链接，登录Tailscale
- 登录后会显示`Success.`

（可选）用浏览器打开[Tailscale网页控制台](https://login.tailscale.com/admin/machines)，然后找到刚才的机器，选择「Disable Key Enpiry」，这样就不用三天两头登录了。

# （可选）通过Tailscale转发局域网

如果不愿意在所有设备都安装Tailscale的话，可以直接在一台机器上转发整个局域网（其它设备连接Tailscale后，直接使用原来的局域网IP访问对应的机器）。在LXC容器的命令行中执行命令，打开IP包转发：

```sh
echo 'net.ipv4.ip_forward = 1' | tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | tee -a /etc/sysctl.d/99-tailscale.conf
sysctl -p /etc/sysctl.d/99-tailscale.conf
```

然后执行，打开局域网转发（记得将地址换成实际局域网地址，IP地址可以通过`ip addr`查看，以`192.168.1.0/24`为例）：

```sh
tailscale up --advertise-routes=192.168.1.0/24
```

回到[Tailscale网页控制台](https://login.tailscale.com/admin/machines)，找到刚才的机器，选择「Edit route settings...」，勾选「192.168.1.0/24」，点击「Save」。

# （可选）通过Tailscale Serve服务远程访问PVE控制台

如果需要远程访问PVE控制台，有些读者可能会将PVE控制台直接暴露到公网中（比如通过IPv4或IPv6直连，也可能是Tailscale Funnel、Cloudflare Tunnel之类的）。

也有一些读者会对PVE控制台直接暴露到公网中这件事情感到不安。如果已经根据本文上一节配置了局域网转发，可以直接访问局域网内的PVE控制台，但PVE控制台强制HTTPS访问，需要自己配置用于HTTPS的TLS证书。这时候可以借助Tailscale Serve服务远程访问PVE控制台，这项服务会自动分配域名并签发用于HTTPS的TLS证书，免去了域名和证书的配置过程。（也同时支持未配置局域网转发的情况）

## 配置反向代理

因为Tailscale并不直接跑在PVE的本体上，而Tailscale Serve服务只能代理本地的HTTP服务。为了有一个能用的本地HTTP服务，需要先将PVE控制台的HTTP页面反向代理到Tailscale所在的服务器中。HTTP反向代理可以使用Nginx、Apache、Caddy等，以Caddy为例：

- 在LXC容器的终端中，执行`apt install caddy`
- 编辑`/etc/caddy/Caddyfile`（比如`nano /etc/caddy/Caddyfile`），将内容修改为（以PVE服务器在`192.168.1.100`为例）：

```
:8006 {
	reverse_proxy https://192.168.1.100:8006 {
		transport http {
			tls_insecure_skip_verify
		}
	}
}
```

- 重启Caddy：`systemctl restart caddy`

## 开启服务

- 打开Tailscale Serve：`tailscale serve --bg 8006`
- 然后就可以用域名（Tailscale里有个MagicDNS，一般是`xxx.yyy.ts.net`）通过HTTPS访问PVE控制台了

# 问题排查

一些有助于排查问题的命令：

- `systemctl status tailscaled`：查看Tailscale服务状况
- `journalctl -u tailscaled`：查看Tailscale服务日志
- `tailscale status`：查看Tailscale连接状况
- `sysctl -a`：查看系统变量

# 感想

资源多的读者还是建议用虚拟机开个Docker吧，LXC跑东西也太折腾了，不过确实很省资源（可能只需要64MB内存）。

# 参考文档

- [Tailscale in LXC containers](https://tailscale.com/kb/1130/lxc-unprivileged)
- [https://tailscale.com/kb/1082/firewall-ports](https://tailscale.com/kb/1082/firewall-ports)
- [Setting up Tailscale on Linux](https://tailscale.com/kb/1031/install-linux)
- [Configure a subnet router](https://tailscale.com/kb/1406/quick-guide-subnets)
- [Tailscale Serve examples](https://tailscale.com/kb/1313/serve-examples)