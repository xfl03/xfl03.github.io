---
title: macOS Monterey终端添加App权限——以QQ、腾讯会议屏幕录制为例
layout: single
date: '2021-11-23 22:50:39'
categories:
- 运维
tags:
- macOS
- QQ
- 腾讯会议
toc: true
---

在MacOS的使用过程中偶尔会遇到App需要权限，但在`系统偏好设置`-`安全性与隐私`-`隐私`的权限中无法找到对应的App。大部分情况下，点击`+`按钮手动添加App并勾选便可解决问题。如果遇到了无法添加App的情况（包括没有`+`按钮、App未显示）就需要使用终端手动添加App权限。

简单摸索macOS管理App权限的方式，会发现App权限会被写入名为`TCC.db`的数据库的`access`表中，这个数据库有两个：
- `~/Library/Application\ Support/com.apple.TCC/TCC.db`，用于存储用户相关的权限，可以直接用root权限修改。一般不会出问题，也不需要手动添加
- `/Library/Application\ Support/com.apple.TCC/TCC.db`，用于存储系统权限，需要关闭系统完整性保护（SIP）才能修改。绝大多数手动添加的情况都需要修改这个文件

本文将以QQ和腾讯会议的屏幕录制权限为例，这一权限需要关闭SIP后修改系统权限数据库。

## 环境
作为参考，作者使用的环境如下：
- macOS Monterey：12.0.1
- QQ：6.7.5
- 腾讯会议： 2.2.24

## 步骤
### 禁用SIP
- 关机
- 长按电源键，直到显示进入恢复模式
- 选择`实用工具`-`终端`
- 执行以下命令
```sh
csrutil disable
```
- 重新启动

### 添加App权限
- 用自己喜欢的方式打开`终端`（如果找不到的话请在启动台中搜索）
- 输入命令，权限和包名的解释请见下文
```sh
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('${权限}','${包名}',0,2,4,1,NULL,NULL,NULL,'UNUSED',NULL,0,1637381304);"
```
- 操作完成后，在`系统偏好设置`-`安全性与隐私`-`隐私`中可以看到权限所对应的App，如果还是没有效果的话请取消勾选后再次勾选
- 尽可能重新启动App

权限和包名两个变量请自行根据需求替换：
- 权限：辅助功能`kTCCServiceAccessibility`、摄像头`kTCCServiceCamera`、输入监听`kTCCServiceListenEvent`、麦克风`kTCCServiceMicrophone`（请修改用户数据库）、录制屏幕`kTCCServiceScreenCapture`、完全磁盘访问权限`kTCCServiceSystemPolicyAllFiles`等
- 包名：在`访达`中找到应用程序文件后（一般位于`应用程序`），右键选择`显示包内容`，使用文本编辑器打开`Contents/Info.plist`，找到`<key>CFBundleIdentifier</key>`，下面一行在`<string>`和`</string>`中间的便是包名

## 实例
### QQ 截屏
QQ除了App本身以外，在`Contents/Library/LoginItems`中还附带了一个名为`QQ jietu plugin`的子App，两者都需要加上权限：
```sh
# QQ屏幕录制权限
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','com.tencent.qq',0,2,4,1,NULL,NULL,NULL,'UNUSED',NULL,0,1637381304);"
# QQ jietu plugin屏幕录制权限
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','FN2V63AD2J.com.tencent.ScreenCapture2',0,2,4,1,NULL,NULL,NULL,'UNUSED',NULL,0,1637381304);"
```

### 腾讯会议 共享屏幕
腾讯会议除了App本身以外，在`Contents/Frameworks/WeMeetFramework.framework/Versions/3.1.2.424/Frameworks/WeMeet.framework/Versions/A/Resources`中还附带了一个名为`腾讯会议-辅助服务`的子App，两者都需要加上权限：
```sh
# 腾讯会议屏幕录制权限
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','com.tencent.meeting',0,2,4,1,NULL,NULL,NULL,'UNUSED',NULL,0,1637381304);"
# 腾讯会议-辅助服务屏幕录制权限
sudo /usr/bin/sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT or REPLACE INTO access VALUES('kTCCServiceScreenCapture','com.tencent.wemeet.WemeetLauncher',0,2,4,1,NULL,NULL,NULL,'UNUSED',NULL,0,1637381304);"
```

## 发布
本篇文章还由作者发布在以下平台：
- [知乎](https://zhuanlan.zhihu.com/p/436926519)
- [掘金](https://juejin.cn/post/7033792167362035749/)