---
title: 解决Jekyll主题Minimal Mistakes中文字数统计错误
layout: single
date: '2021-11-14 21:38:33'
categories:
- 建站
tags:
- Jekyll
- Minimal-Mistakes
- GitHub-Pages
toc: true
---

当在GitHub Pages上使用Minimal Mistakes作为Jekyll主题时，会遇到中文字数统计错误的问题，一整段话被统计为1个字。本篇文章将会简单说明问题的来源和解决方案。
![202111142135](..\assets\images\202111142135.png)

## 问题来源

Minimal Mistakes在`_includes/page__meta.html`中，使用了`document.content | strip_html | number_of_words`来计算文章字数（[相关代码](https://github.com/mmistakes/minimal-mistakes/blob/master/_includes/page__meta.html#L17)），这一步将`document.content`[去除HTML标签](https://shopify.github.io/liquid/filters/strip_html/)，然后调用`number_of_words`函数计算字数。

`number_of_words`函数由Jekyll实现。GitHub Pages使用的Jekyll版本为`3.9.0`，根据其[实现](https://github.com/jekyll/jekyll/blob/v3.9.0/lib/jekyll/filters.rb#L125)，计算字数的代码仅仅为`input.split.length`，根据Ruby[文档](https://ruby-doc.org/core-3.0.2/String.html#method-i-split)，将会根据空格分割文本，然后输出分割后的文本数量。也就是说，会根据空格的数量来确定字数。这样的做法对于英文文章来说自然问题不大，但并不适合中文。

## 解决方案

解决这个问题有多种方案，前2个方案无法在GitHub Pages上独立完成，需要搭配GitHub Action或其他CI；最后1种方案可以在纯GitHub Pages的环境中使用。

如果修改了Minimal Mistakes的文件，将其放在自己仓库下便可覆盖默认文件。

### 自定义插件

这是最优雅的方法，通过自定义插件可以在不覆盖Minimal Mistakes文件的情况下修复问题。

下载[这个文件](https://github.com/iBug/iBug-source/raw/master/_plugins/number_of_words.rb)放置于`_plugins/number_of_words.rb`便可。

### 升级Jekyll

这是最简单直接的方法，在`4.1.0`版本的Jekyll中，这个问题被[修复](https://github.com/jekyll/jekyll/commit/13b72916493d9cfa22eeb0d3cae1d1bb32e2e5c1)了。

当然，除了升级以外还需要将`_includes/page__meta.html`中的`number_of_words`修改为`number_of_words: "auto"`或者`number_of_words: "cjk"`才能正常生效。

### 覆盖主题文件

这个方法使用了[Liquid模板引擎](https://shopify.github.io/liquid/)的语法，可以不依赖任何CI，直接在GitHub Pages上使用。

用以下代码替换`_includes/page__meta.html`中的`{% assign words = document.content | strip_html | number_of_words %}`：
```html
      {% assign content0 = document.content | strip_html %}
      {% assign content_size = content0 | size | minus: 1 %}
      {% assign pre_is_letter = false %}
      {% assign words = 0 %}
      {% for i in (0..content_size) %}
        {% assign character = content0 | slice: i %}
        {% case character %}
          {% when "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" %}
            {% assign pre_is_letter = true %}
          {% when "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" %}
            {% assign pre_is_letter = true %}
          {% when "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z" %}
            {% assign pre_is_letter = true %}
          {% when " ", "\t", "\r", "\n", "!", ".", "?", ",", "！", "。", "？", "，", "/", "、", "：", ":", "(", "（", ")", "）", "；", ";", "_", "—", "-" %}
            {% if pre_is_letter %}
              {% assign words = words | plus: 1 %}
            {% endif %}
            {% assign pre_is_letter = false %}
          {% else %}
            {% if pre_is_letter %}
              {% assign words = words | plus: 1 %}
            {% endif %}
            {% assign pre_is_letter = false %}
            {% assign words = words | plus: 1 %}
        {% endcase %}
      {% endfor %}
```

这部分代码是作者自己编写的，欢迎多多交流。

## 感谢
最后特别感谢[iBug](https://github.com/iBug)引导了修复方向。

## 发布平台
本篇文章还发布在以下平台，均为作者发布：
- 知乎：https://zhuanlan.zhihu.com/p/433233271
- 思否：https://segmentfault.com/a/1190000040957794
- 掘金：https://juejin.cn/post/7030428338036736037/
