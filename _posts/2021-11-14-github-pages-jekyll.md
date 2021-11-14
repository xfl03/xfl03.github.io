---
title: 在GitHub Pages上部署Jekyll静态博客
layout: single
date: '2021-11-14 21:03:39'
categories:
- 建站
tags:
- Jekyll
- Minimal-Mistakes
- GitHub-Pages
toc: true
---

本篇文章将简单介绍一下如何使用Minimal Mistakes主题在GitHub Pages上部署Jekyll静态博客。
虽然搭建静态博客的过程比较折腾，但可以免费使用GitHub提供的静态网页托管服务。

## 组件一览
静态博客所使用的组件主要包括能生成静态网页的博客系统、博客主题、静态网页托管服务与博客系统的扩展：

| 名称 | 类型 | 说明 |
| -------- | -------- | -------- |
| [Jekyll](https://jekyllrb.com/) | 博客系统 | 可以生成静态网页的博客系统 |
| [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) | 博客主题 | 可以高度自定义的简洁Jekyll主题  |
| [GitHub Pages](https://pages.github.com/) | 网页托管 | 自带了Jekyll构建与部署功能 |
| [giscus](https://giscus.app/zh-CN) | 评论系统 | 使用GitHub Discussion作为评论系统，支持贴表情 |
| [Google分析](https://analytics.google.com/analytics/web/?hl=zh_cn) | 统计分析 | 对博客的流量进行统计分析 |

## 搭建方法

### 创建GitHub Pages
这一步可以使用Minimal Mistakes提供的模板简化操作：
- 打开Minimal Mistakes的[模板创建页面](https://github.com/mmistakes/mm-github-pages-starter/generate)
- 请在`Repository name`中输入`用户名.github.io`；如果之前创建过GitHub Pages，请自定义仓库名
- 点击`Create repository from template`按钮完成创建
- 如果使用了自定义仓库名，请在仓库的设置中打开GitHub Pages功能

完成创建后，可以使用`用户名.github.io`或`用户名.github.io/自定义仓库名`访问博客。

值得注意的是，GitHub Pages使用了Jekyll的`3.9.0`版本。如果要使用其他版本，需要手动设置GitHub Action来构建，可以参考[这个issue](https://github.com/github/pages-gem/issues/651)。

### 安装本地预览环境
如果不需要在本地实时预览或构建博客，可以不安装环境。

需要安装版本控制工具Git、Ruby语言的开发环境以及Ruby的包管理器：
- Git：[官方中文文档](https://git-scm.com/book/zh/v2/%E8%B5%B7%E6%AD%A5-%E5%AE%89%E8%A3%85-Git)
- Ruby：[官方中文文档](https://www.ruby-lang.org/zh_cn/documentation/installation/)
- RubyGems：一般来说安装Ruby时都会附带，如果需要手动安装的话请参阅[官方说明](https://rubygems.org/pages/download)
- Bundler：使用命令`gem install bundler`安装

将GitHub上的仓库克隆到本地并安装依赖：
- 克隆仓库：寻找合适的位置执行`git clone https://github.com/用户名/仓库名.git`
- 安装依赖：进入`仓库名`文件夹执行`bundle install`
- 实时预览：可以使用`bundle exec jekyll serve`打开博客的实时预览，启动后可以通过`http://127.0.0.1:4000`访问

作者在安装环境时所使用的版本：
- GitHub Pages Ruby Gem: 221
- Jekyll: 3.9.0
- Minimal Mistakes: 4.24.0

### 配置博客
博客相关的配置文件位于`_config.yml`，Minimal Mistakes为我们带来了丰富的[配置项](https://mmistakes.github.io/minimal-mistakes/docs/configuration/)。

值得一提的是，如果更改了配置项中的语言选项`locale`，需要将[语言文件](https://raw.githubusercontent.com/mmistakes/minimal-mistakes/master/_data/ui-text.yml)放置于`_data/ui-text.yml`才能生效。

右上角的导航栏可以通过编辑`_data/navigation.yml`修改。

如果这些常规配置仍然不能满足自定义的需求，还可以在自己的仓库中直接创建[Minimal Mistakes GitHub仓库](https://github.com/mmistakes/minimal-mistakes)里面的同名文件，这样可以直接覆盖相关的代码。

### 编写博客
博客内容使用Markdown进行编写，尚不熟悉Markdown的读者建议阅读[GitHub提供的中文教程](https://docs.github.com/cn/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)。文章一般命名为`_posts/年-月-日-标题.md`。

编写文章的方法众多，可以使用[Visual Studio Code](https://code.visualstudio.com/)、[Typora](https://typora.io/)等Markdown编辑器。如果配置好了本地环境，也可以使用[Jekyll Admin](https://jekyll.github.io/jekyll-admin/)。除此之外，还可以使用[Visual Studio Code for the Web](https://vscode.dev/)、[GitHub Codespaces](https://github.dev/)等在线编辑器进行编写。

文章可以通过在页首设定一些内容来改变文章的显示方式：
- `layout`：使用预先设定好的布局，可以选择的布局请看[官方文档](https://mmistakes.github.io/minimal-mistakes/docs/layouts/)，也可以在`_layout`中自定义布局。一般使用`layout: single`，如果需要显示目录，可以添加`toc: true`
- `title`：文章标题
- `date`：最后更新时间
- `tags`：文章标签
- `categories`：文章分类

编写好了文章以后，只需要更新启用了GitHub Pages功能的仓库，等待自动构建与部署完成便可。如果读者尚不熟悉Git操作，可以使用Visual Studio Code等工具自带的Git GUI，也可以在命令行中直接执行以下内容：
```sh
git add .
git commit -m "更新内容"
git push
```
