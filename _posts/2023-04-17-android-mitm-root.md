---
title: Android HTTPS MITM抓包教程（需Root）
layout: single
date: '2023-04-17 22:09:40'
categories:
- 安卓
tags:
- Android
- Magisk
- Root
- Xposed
- LSPosed
- MITM
toc: true
---

本教程的前提是有一台Root过的Android设备，需要安装Magisk和LSPosed，目的是抓取应用或游戏的HTTPS数据，手段是MITM（中间人攻击）。
没Root的话可以使用模拟器或者WSA，不过部分游戏会带有模拟器检测，也有一定风险。千万不要尝试去修改任何应用或者游戏的apk，不少应用会检查apk签名的，签名不一致有极大的封号风险。

本文不针对任何特定应用或游戏。本着授人以渔的原则，还会介绍一下每一步为什么要这样做。Android系统的操作以原生Android系统为例，其他第三方UI可以自己摸索一下。

## 抓包原理
HTTPS通信数据是加密的，会通过不对等加密进行握手后使用对等加密后续的通信，无法简单使用Wireshark、tcpdump之类的工具查看通信内容。
因此，在使用代理服务器捕获通信内容的同学，还需要一个软件对HTTPS的数据包进行解密。

与此同时，抓包者并不知道服务器的原始密钥，无法直接解密通信包，支持HTTPS抓包的软件一般会通过MITM（中间人攻击）进行流量解密。
具体而言，软件会生成一个自签名证书，使用这一证书与客户端进行通信、使用原始证书与服务器进行通信，这样就可以解密出通信内容。

进一步说，客户端会通过证书链来验证一个证书是否由已经信任的根证书签发，软件自行生成的自签名证书并不会被客户端信任。
因此，抓包软件会同时提供一个**根证书**，后续需要通过一些办法让应用信任这个根证书，这样才能正常抓包。

## 隐藏Root
部分应用或游戏会检测设备Root情况，如果无需隐藏Root可以跳过这一步。

**请勿使用Shamiko**隐藏Root，这会导致无法在被隐藏Root的应用中抓包。
推荐使用[Magisk Delta](https://huskydg.github.io/magisk-files/intro.html)，并在设置里的Magisk Hide中选定需要隐藏Root的应用。

也有部分应用会通过检测其它应用包名的方式来检测Root，还可以额外通过安装[隐藏应用列表应用](https://github.com/Dr-TSNG/Hide-My-Applist/releases)来避免这一问题。

## 选择抓包软件

有以下免费HTTPS抓包软件可以使用：

- [mitmproxy](https://mitmproxy.org/)：**开源免费强烈推荐**，需要一台macOS、Windows或Linux的电脑
- [Fiddler Classic](https://www.telerik.com/fiddler/fiddler-classic)：需要一台Windows的电脑
- [Packet Capture](https://play.google.com/store/apps/details?id=app.greyshirts.sslcapture)：可以直接在Android设备上抓包，最后更新于2019年12月26日，可能有一些功能和兼容性问题
- HttpCanary：也可以直接在Android设备上抓包，应用已不再维护，Google Play、GitHub均删除了相关内容

下文会以mitmproxy为例，其他软件大差不差。

## 安装抓包软件
1. 打开[mitmproxy官网](https://mitmproxy.org/)
2. 如果是Windows，请下载安装器（Installer）并完成安装
3. 如果是macOS，建议直接使用Homebrew命令`brew install mitmproxy`完成安装
4. 如果是Linux，下载压缩包，解压并加入PATH（软链接也可以，请自行发挥）

## 启动抓包软件
1. 如果是Windows，在开始菜单或应用中找到mitmweb，点击图标来启动
2. 如果是macOS或Linux，直接在命令后中执行`mitmweb`来启动
3. 启动之后一般会自动打开mitmweb的网页，一般是`http://127.0.0.1:8081/`
4. 网页中会显示mitmproxy代理服务器的端口，一般是`8080`

## 设置系统代理
需要设置系统代理，才能让Android系统的通信经过代理服务器。
如果是Android内部的抓包软件，可以通过设备内VPN实现。

1. 请确保Android设备连接到了WiFi，并且和电脑处于同一个局域网，如果没有WiFi可以开启手机热点或电脑热点
2. 获取当前电脑的内网IP，Windows可以通过`设置`-`网络和Internet`-`状态`-`属性`-`IPv4地址`获取、macOS和Linux可以直接通过命令`ifconfig | grep "inet "`获取，一般为`192.168.x.x`
3. 打开Android设备中的`设置`-`网络与互联网`-`互联网`、点击已连接WiFi后面的设置按钮、点击右上角设置按钮、`高级选项`-`代理`，选择`手动`，并在`代理主机名`位置输入电脑内网IP、`代理端口`位置输入代理服务器端口，完成后点击`保存`

## 添加系统凭据
绝大多数Android应用都不会信任用户根证书，因此需要先将根证书加入系统凭据。

1. 通过浏览器访问`http://mitm.it`，下载Android使用的证书
2. 打开`设置`-`安全`-`更多安全设置`-`加密与凭据`-`安装证书`-`CA证书`、点击`仍然安装`、验证PIN码后选择下载的证书，这一步会安装到用户根证书   
3. 在Magisk中安装[TrustUserCerts模块](https://github.com/NVISOsecurity/MagiskTrustUserCerts/releases)
4. 重启设备，重启完后会将证书加入系统根证书

## 强制应用信任
有些应用不会信任系统凭据，还需要LSPosed模块来强制信任。

1. 在Android系统中安装[TrustMeAlready应用](https://github.com/ViRb3/TrustMeAlready/releases)或[JustTrustMe应用](https://github.com/Fuzion24/JustTrustMe/releases)
2. 在LSPosed中启用上述模块，并在作用域中选定需要抓包的应用或游戏

## 抓包
启动需要抓包的应用或游戏后，不出意外的话，可以在mitmweb中看到解密的数据包。

## 参考文献
- [mitmproxy docs](https://docs.mitmproxy.org/stable/)
- [[PJSK] 使用fiddler抓取你的账号信息获取b30](https://www.bilibili.com/read/cv22034259)

## 发布平台
本文还发布至：

- [知乎](https://zhuanlan.zhihu.com/p/622683830)