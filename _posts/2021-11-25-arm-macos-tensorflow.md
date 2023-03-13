---
title: arm架构macOS安装TensorFlow并开启GPU加速
layout: single
date: '2021-11-25 21:40:39'
categories:
- 运维
tags:
- macOS
- arm
- TensorFlow
toc: true
---

在M1系列的arm架构macOS上安装TensorFlow时，如果直接使用`pip install tensorflow`安装会出现如下错误：
```
ERROR: Could not find a version that satisfies the requirement tensorflow (from versions: none)
ERROR: No matching distribution found for tensorflow
```

这个错误说明了无法直接从pip上安装TensorFlow，需要一些其他办法来进行安装。除此之外，为了加快TensorFlow的执行速度，还需要安装TensorFlow Matel Plugin来启用GPU加速。

本篇文章将参考[苹果官方文档](https://developer.apple.com/metal/tensorflow-plugin/)。

## 安装步骤
### 配置虚拟环境
如果无需虚拟环境，直接将TensorFlow安装在默认环境中，可以跳过这一部分。

因为macOS自带多个版本的Python，而Homebrew也会自带Python环境，导致会有好几个Python同时存在`path`中。除此之外，pip与Python也可能会出现不对应的情况，再加上pip安装的依赖会全局有效，强烈建议使用conda统一管理Python环境。

Miniforge附带了conda，conda是一个适用于Python的依赖管理与环境管理工具。可以使用[Homebrew](https://brew.sh/)安装[Miniforge](https://github.com/conda-forge/miniforge)：
```sh
brew install miniforge
```

为shell中配置conda环境，请根据当前使用的shell选择命令：
```sh
## 如果是zsh（macOS的默认shell）
conda init zsh
## 如果是fish
conda init fish
## 如果你不知道是什么
conda init "$(basename "${SHELL}")"
```

配置完后请重新启动终端，然后在conda中安装TensorFlow所需的依赖：
```sh
conda install -c apple tensorflow-deps
```

### 安装TensorFlow
使用如下指令安装适用于macOS的TensorFlow：
```sh
pip install tensorflow-macos
``` 

### 安装TensorFlow Matel Plugin
Metal是macOS提供的图形API。如果需要GPU加速，使用如下指令安装这个插件：
```sh
pip install tensorflow-metal
```

## 常见问题
### 找不到brew
如果提示`zsh: command not found: brew`，可以考虑安装Homebrew，也可以手动安装Miniforge。

如果是fish用户，建议先使用`zsh`切换到默认shell。

Homebrew是macOS上一个常见的软件包管理器。安装Homebrew：
```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

手动安装Miniforge，先下载这个[文件](https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-MacOSX-arm64.sh)，然后执行：
```sh
chmod +x ~/Downloads/Miniforge3-MacOSX-arm64.sh
sh ~/Downloads/Miniforge3-MacOSX-arm64.sh
source ~/miniforge3/bin/activate
```
### 找不到pip
如果提示`zsh: command not found: pip`，说明`pip`不在`path`里，可以尝试`pip3`或者`python3 -m pip`来代替`pip`。

## 发布
本文还发布在以下平台：
- [CSDN](https://blog.csdn.net/gooding300/article/details/121548347)
