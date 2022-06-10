---
title: macOS使用Il2CppDumper、ILSpy和Ghidra逆向Unity
layout: single
date: '2022-01-10 15:49:08'
categories:
- 逆向
tags:
- macOS
- Unity
- dotNET
- Il2CppDumper
- ILSpy
- Ghidra
toc: true
---

[Il2CppDumper](https://github.com/Perfare/Il2CppDumper)是一个常用的Unity逆向工具、[ILSpy](https://github.com/icsharpcode/ILSpy)是一个.NET逆向工具、[Ghidra](https://ghidra-sre.org/)是一个免费开源的二进制逆向工具（与IDA类似）。

本篇文章将会简单介绍一下如何在macOS上使用Il2CppDumper和Ghidra逆向Unity，经过测试即使在ARM架构上也可以正常运行。

## 获取程序
请确认已安装[Homebrew](https://brew.sh/)，笔者使用的版本为`3.3.9`。
### .NET运行时环境
Il2CppDumper是一个使用.NET编写的程序，为了在macOS上执行，需要先安装.NET运行时环境。如果有.NET开发的需求，也可以选择安装`dotnet-sdk`。
```sh
brew install dotnet
```
笔者使用的是`6.0.101`版本。
### Il2CppDumper
请从[GitHub Release](https://github.com/Perfare/Il2CppDumper/releases)中获取最新版本，下载时请注意选择`net6`文件。

笔者下载的文件为`Il2CppDumper-net6-v6.7.6.zip`。
### ILSpy
可以直接使用Homebrew安装Avalonia ILSpy。如果不需要独立程序，也可以在Visual Studio Code中安装`ilspy-vscode`插件。
```sh
brew install ilspy
```
笔者使用的是`7.0-rc2`版本。
### Ghidra
可以直接使用Homebrew安装。
```sh
brew install ghidra
```
笔者使用的是`10.1.1`版本。

## Unity Dump
首先准备好需要逆向的二进制文件，一般Android是`libil2cpp.so`、iOS是`UnityFramework`，下文以`UnityFramework`为例。除此之外，还需要准备Global Matadata，一般名为`global-metadata.dat`。

准备好需要逆向的文件后，将Il2CppDumper解压到相同文件夹（即`Il2CppDumper.dll`、`UnityFramework`、`global-metadata.dat`在同一文件夹中），然后在此文件夹中打开终端执行命令：
```sh
dotnet Il2CppDumper.dll UnityFramework global-metadata.dat
```

如果正常执行，会输出类似内容：
```sh
Dumping...
Done!
Generate struct...
Done!
Generate dummy dll...
Done!
Press any key to exit...
```

## .NET逆向
如果需要进一步逆向Dump得到的`DummyDll`文件夹中的dll文件，可以使用ILSpy。

ILSpy可以直接在启动台中启动，点击`File`-`Open`，选择`DummyDll`中的所有文件，然后在`Assembly-CSharp`中查看结构。

## 二进制逆向

- 在Il2CppDumper文件夹中执行命令`python il2cpp_header_to_ghidra.py`处理好`il2cpp_ghidea.h`。
- 在终端中使用命令`ghidraRun`启动Ghidra，点击`File`-`New Project...`新建一个项目，然后点击`File`-`Import File...`选择`UnityFramework`，然后在弹出的`Analyze`对话框选择`No`不进行分析。
- 然后在`File`-`Parse C Source`中添加`il2cpp_ghidea.h`，点击`Parse to Program`。
- 等待处理完成后，将`ghidra_with_struct.py`放入`～/ghidra_scripts`文件夹，点击`Window`-`Script Manager`，点击右上角`Manage Script Directories`，勾选`$USER_HOME/ghidra_scripts`，点击刷新按钮。回到上一界面，选择`ghidra_with_struct.py`后点击`Run`图标，在弹出的文件选择器中选择`script.json`，等待执行、分析完毕。
- 最后可以在`Code Browser`的`Symbol Tree`中查看需要的代码。