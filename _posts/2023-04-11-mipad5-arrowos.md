---
title: 小米平板5安装ArrowOS 13、Magisk Delta与LSPosed
layout: single
date: '2023-04-11 21:46:43'
categories:
- 安卓
tags:
- Android
- ArrowOS
- Magisk
- MagiskDelta
- Root
- Xposed
- LSPosed
toc: true
---

小米平板5是小米在2021年8月10日发布的平板电脑，其基本参数是：
- 高通骁龙860
- 120Hz屏幕刷新率

ArrowOS是一个类原生Android系统、Magisk Delta在Magisk基础上增加了隐藏Magisk功能、LSPosed是Xposed的一个实现。

请注意，这一过程会**丢失所有数据**，并且有**变砖风险**，请注意备份重要数据并谨慎操作。BootLoader解锁后会失去设备锁，任何人都可以随意篡改系统。

本文不使用任何懒人包、一键工具，下载链接均为各软件、工具的官方链接。

## 准备工作
### 下载解锁工具
从[MIUI官网](http://www.miui.com/unlock/download.html)下载解锁工具，官网下载的并非最新版本，可以启动后在软件内更新。

解锁工具仅限Windows系统，如果已经解锁，后续的所有过程均可以在Linux、macOS上操作。

### 下载adb与fastboot
从[Android官网](https://developer.android.com/tools/releases/platform-tools)下载包含adb和fastboot在内的工具包，解压后将文件夹路径加入系统环境变量`PATH`中。

### 下载boot镜像
- [boot_nabu_w-skippkgverification-13-arrow-beta.img](https://sourceforge.net/projects/kubersharma001/files/nabu/ArrowOS-Recovery/boot_nabu_w-skippkgverification-13-arrow-beta.img/download)
- [vendor_boot_nabu_w-skippkgverification-13-arrow-beta.img](https://sourceforge.net/projects/kubersharma001/files/nabu/ArrowOS-Recovery/vendor_boot_nabu_w-skippkgverification-13-arrow-beta.img/download)

### 下载ArrowOS
在[ArrowOS官网](https://arrowos.net/download)搜索`nabu`，下载带有GAPPS的系统，文件名形如`Arrow-v13.0-nabu-OFFICIAL-日期-GAPPS.zip`。

### 下载payload-dumper-go
在[payload-dumper-go GitHub Release](https://github.com/ssut/payload-dumper-go/releases)中根据操作系统选择对应的文件，如果是64位Windows的话，请选择`payload-dumper-go_版本_windows_amd64.tar.gz`，下载后请解压并加入系统环境变量`PATH`中。

### 下载Magisk Delta
在[Magisk Delta官网](https://huskydg.github.io/magisk-files/intro.html)下载`Stable / Beta`或者`Canary`版本，文件名为`app-release.apk`。

### 下载LSPosed
在[LSPosed GitHub Release](https://github.com/LSPosed/LSPosed/releases)中下载名字中带有`zygisk`的版本，文件名形如`LSPosed-版本-zygisk-release.zip`，不需要解压缩。

## 版本参考
作为参考，笔者使用的设备和软件版本如下：
- 小米平板5：6GB内存+128GB存储
- ArrowOS：13.0 20230117
- Magisk Delta：25210
- Lsposed：1.8.6(6712)

## 解锁BootLoader
首先需要在MIUI中点击多次`设置`-`我的设备`-`全部参数`-`MIUI版本`打开开发者选项，然后在`设置`-`更多设置`-`开发者选项`-`设备解锁状态`中绑定账号。

绑定账号后需要等待168小时（7天），再次绑定账号会重新计时。

关机后同时长按`电源键`和`音量下键`（见到小米图标即可松手）进入FastBoot，连接电脑后，使用解锁工具完成解锁。

## 安装ArrowOS

### 进入恢复模式
将设备进入FastBoot模式后连接电脑，使用以下命令：
```shell
# 清除用户数据和缓存
fastboot -w
# 刷入boot
fastboot flash boot boot_nabu_w-skippkgverification-13-arrow-beta.img
# 刷入vendor boot
fastboot flash vendor_boot vendor_boot_nabu_w-skippkgverification-13-arrow-beta.img
# 进入恢复模式
fastboot reboot recovery
```

### 进入侧载模式
等开机后（黑屏），再继续输入以下命令：
```shell
# 进入侧载模式
adb reboot sideload
```

### 侧载系统
等开机后（黑屏），再继续输入以下命令（以20230117为例，请注意修改成对应的文件名）：
```shell
# 侧载系统
adb sideload Arrow-v13.0-nabu-OFFICIAL-20230117-GAPPS.zip
```
上述命令大概会在45%左右停止，然后继续执行以下命令：
```shell
# 进入Android系统的shell
adb shell
# 清除数据，完成后会自动退出Android shell
recovery --wipe_data
# 重启设备
adb reboot
```
至此，ArrowOS已经安装完成，不出意外的话开机后应该会进入系统界面。

## 安装Magisk Delta
### 安装应用
在Android系统中，首先打开开发者模式，启用adb调试。

然后安装Magisk Delta，可以直接使用adb安装（以`app-release.apk`为例，请改为实际文件名）：
```shell
# 安装应用
adb install app-release.apk
```

### 提取boot.img
从`Arrow-v13.0-nabu-OFFICIAL-日期-GAPPS.zip`中提取`payload.bin`，并执行：
```shell
# 提取payload
payload-dumper-go payload.bin
```
从提出出来的文件中找到`boot.img`，将其传输到Android中，可以使用adb传输：
```shell
# 传输boot.img到下载文件夹
adb push boot.img /sdcard/Download
```

### 生成magisk_patched.img
打开Magisk Delta应用，点击`安装`-`选择并修补一个文件`，选择下载文件夹中的`boot.img`，会在下载文件夹中生成名为`magisk_patched-版本_随机字母.img`，通过adb将其传回电脑（请注意在命令中修改文件名）：
```shell
# 传输img到当前文件夹
adb pull /sdcard/Download/magisk_patched-版本_随机字母.img .
```

### 安装magisk_patched.img
重启平板电脑，进入FastBoot模式，再次连接电脑，使用以下命令（请注意在命令中修改文件名）：
```shell
# 刷入img
fastboot flash boot magisk_patched-版本_随机字母.img
# 重启
fastboot reboot
```
进入系统后，可以在Magisk Delta应用中确认是否安装成功。

## 安装LSPosed
首先打开Magisk Delta应用，在右上角设置中找到`Magisk`-`Zygisk`，将`Zygisk`打开。

将LSPosed通过adb传到平板电脑上（以1.8.6为例，请注意修改文件名）：
```shell
# 传输LSPosed到下载文件夹
adb push LSPosed-v1.8.6-6712-zygisk-release.zip /sdcard/Download
```

回到`主页`，点击下方`模块`，点击右下角悬浮按钮，选择LSPosed的文件，等待安装后重启设备即可。

## 参考文献
- [[ROM]ArrowOS 13.0 | 12.1/12L for Xiaomi Pad 5 (nabu) | [OFFICIAL]](https://forum.xda-developers.com/t/rom-arrowos-13-0-12-1-12l-for-xiaomi-pad-5-nabu-official.4502749/)
- [小米平板5刷机ArrowOS完整教程（附带刷入MAGISK教程）](https://www.bilibili.com/video/BV1sK411d7yH/)

## 发布平台
本篇文章还发布至以下平台：
- [知乎](https://zhuanlan.zhihu.com/p/621172856)