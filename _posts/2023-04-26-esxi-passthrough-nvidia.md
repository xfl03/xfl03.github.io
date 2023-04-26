---
title: ESXi 8直通NVIDIA显卡至Linux系统
layout: single
date: '2023-04-26 12:55:08'
categories:
- 运维
tags:
- VMWare
- ESXi
- Linux
- Ubuntu
- NVIDIA
toc: true
---

VMWare ESXi（也称为VMware vSphere Hypervisor、以下简称ESXi）是一个常用的服务器虚拟化平台。在ESXi中使用显卡有两种方式，一种方法是通过显卡虚拟化（例如NVIDIA vGPU）在ESXi中管理并分配显卡资源，另一种方法是将显卡直通到一台虚拟机中使用。前者可以让多个虚拟机共享显卡、需要购买额外的许可证且仅限专业卡，后者只能一个虚拟机独占显卡、无需额外付费、游戏卡也可以用。后者更加贴近普通用户的场景，本文将介绍后者的方法。

## 版本参考

不同版本的操作方法差异较大。作为参考，笔者使用的软硬件版本如下：

- ESXi：8.0 Update 1
- 显卡：NVIDIA GeForce RTX 4080
- Ubuntu Server：22.04.2
- NVIDIA驱动：530.30.02

## 配置PCI设备直通

1. 进入ESXi Host Client中
2. 在左侧菜单选择`主机`-`管理`
3. 右侧选择`硬件`-`PCI`设备
4. 在右上角`搜索`中输入`NVIDIA`
5. 在表格中选中所有名字中带有`NVIDIA`的设备 
6. 点击`切换直通`按钮。

完成后，表格中的`直通`将变为`活动`。

## 配置虚拟机

关闭虚拟机后，进入虚拟机设置，进行如下操作：

1. 进入`虚拟硬件`选项卡
2. `内存`-`预留`中选择`预留所有客户机内存 (全部锁定)`
3. 点击`添加其他设备`按钮，选择`PCI设备`
4. 在`新PCI`设备中选择需要使用的显卡
5. 如果有多个PCI设备请重复第3、4步
6. 进入`虚拟机选项`选项卡
7. **关闭**`引导选项`-`启动UEFI安全引导`中的`是否为此虚拟机启用 UEFI 安全引导`

完成后，可以开机并进入虚拟机。

## 禁用nouveau显卡驱动

nouveau是第三方开发的开源显卡驱动，安装NVIDIA官方的显卡驱动之前，需要先禁用它。执行命令：

```shell
sudo nano /etc/modprobe.d/blacklist.conf
```

在文件末尾另起一行，写入：

```text
blacklist nouveau
options nouveau modeset=0
```

执行命令：

```shell
sudo update-initramfs -u
```

重启后，可以通过以下命令验证：
```shell
lsmod | grep nouveau
```

如果没有输出就是禁用成功。

## 安装NVIDIA显卡驱动

安装显卡驱动的方法很多，比如`ubuntu-drivers autoinstall`、`apt install`等。
无论使用哪种方法，请注意需要安装**开源Linux内核**（Open Linux Kernel）版本。

笔者使用的是`run`文件安装法，最新版的下载链接可以在[官方网站](https://www.nvidia.cn/Download/index.aspx?lang=cn)找到，以`530.30.02`为例。执行命令：

```shell
# 下载run文件
wget http://download.nvidia.com/XFree86/Linux-x86_64/530.30.02/NVIDIA-Linux-x86_64-530.30.02.run
# 删除原有驱动
# 视安装方法不同，卸载方法也不同，以下3个命令可以都试试
sudo nvidia-uninstall
sudo apt remove --purge '^nvidia-.*'
sudo sh ./NVIDIA-Linux-x86_64-530.30.02.run --uninstall
# 安装过程的必要依赖
sudo apt install gcc make
# 运行run文件
# 参数m是kernel-module-build-directory的缩写，用于选择内核
sudo sh ./NVIDIA-Linux-x86_64-530.30.02.run -m=kernel-open
```

安装完成后，还需要进行一个**额外步骤**，执行命令：

```shell
sudo nano /etc/modprobe.d/nvidia.conf
```

写入以下内容：

```text
options nvidia NVreg_OpenRmEnableUnsupportedGpus=1
```

重启后，执行以下命令验证驱动：

```shell
nvidia-smi
```

这个命令会输出显卡信息，笔者显示的内容为：

```text
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 530.30.02              Driver Version: 530.30.02    CUDA Version: 12.1     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                  Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf            Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA GeForce RTX 4080         Off| 00000000:03:00.0 Off |                  N/A |
| 33%   37C    P0               34W / 320W|      0MiB / 16376MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
                                                                                         
+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|  No running processes found                                                           |
+---------------------------------------------------------------------------------------+
```

## 总结

想要正常在ESXi 8中的Linux虚拟机中使用显卡直通，以下三个步骤缺一不可：

- 关闭UEFI安全引导
- 使用开源Linux内核版本驱动
- 设置`NVreg_OpenRmEnableUnsupportedGpus`为`1`

## 参考资料

- [COMPLETE GUIDE - ESXI | UBUNTU 22.04 WITH NVIDIA GPU PASSTHROUGH](https://www.youtube.com/watch?v=rhNCtsmVC30)
- [Ubuntu安装NVIDIA驱动 run方式](https://huazhe1995.github.io/2020/01/01/ubuntu-an-zhuang-nvidia-qu-dong-run-fang-shi/)
- [NVIDIA Accelerated Linux Graphics Driver README and Installation Guide](http://download.nvidia.com/XFree86/Linux-x86_64/530.41.03/README/)

## 发布平台

本文章还发布至：
- [知乎专栏](https://zhuanlan.zhihu.com/p/625069980)