---
title: 使用WinDbg排查DPC_WATCHDOG_VIOLATION蓝屏问题——SmartByte全责
layout: single
date: '2024-04-07 19:15:00'
categories:
- 运维
tags:
- WinDbg
- Windows
toc: true
---

发现一台Dell生产的Windows 10笔记本在高速访问网络时有概率发生蓝屏现象，错误为`DPC_WATCHDOG_VIOLATION`。

出现`DPC_WATCHDOG_VIOLATION`错误，说明**驱动有问题**，需要进一步排查出是什么驱动出现了问题。

## WinDbg排查方法

### MiniDump准备

首先需要打开MiniDump功能，启用方法如下：

- 右键「此电脑」
- 点击菜单底部「属性」
- 点击右侧「高级系统设置」
- 点击选项卡「高级」
- 点击「启动和故障恢复」的「设置」
- 在「写入调试信息」中选择「小内存转储(256 KB)」

等待蓝屏后，能在`C:\Windows\Minidump`下发现`dmp`文件。

由于访问权限问题，**建议将这一文件拷贝到普通的用户目录中**。

### WinDbg准备

WinDbg可以在Microsoft Store下载。

按理来说，还有其它下载方式，但是[官方教程](https://learn.microsoft.com/zh-CN/windows-hardware/drivers/debugger/)中的「下载WinDbg」不知道为什么显示403。

### WinDbg调试

打开WinDbg，进行如下操作：

- 点击菜单栏「文件」
- 左侧「Start Debugging」
- 中间「Open Dump File」
- 右侧「Browse…」选择上述`dmp`文件
- 点击右侧「Open」

等待下载符号链接后，执行以下命令（直接点击屏幕上的蓝色文本也一样的）：

```
!analyze -v
```

等待分析完成，可以观察到输出：

```
SYMBOL_NAME:  SmbCo10X64+7ce2
MODULE_NAME: SmbCo10X64
IMAGE_NAME:  SmbCo10X64.sys
```

可以注意到，出问题的驱动为`SmbCo10X64.sys`，经过查证是Dell预装的**SmartByte**软件的一部分。SmartByte是用来“优化”网络的，与观察到的现象也相符，直接卸载了。

## 参考文献

- [使用 WinDbg 分析 Windows 系统蓝屏日志](https://pppp.ink/blogs/7-windows_windbg.html)

## 发布平台

本文中还发表在：

- [知乎](https://zhuanlan.zhihu.com/p/691155701)