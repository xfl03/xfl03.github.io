---
title: 使用TypeScript与Rollup制作ES模块
layout: single
date: '2023-03-13 21:47:53'
categories:
- 前端
tags:
- JavaScript
- TypeScript
- rollup
- ECMAScript
- ECMAScriptModule
- CommonJS
- pnpm
- Nodejs
- npm
- Jest
- ESLint
toc: true
---

ES模块（ECMAScript Module、ESM）是现代化的JavaScript模块格式，支持主流浏览器、Node.js等环境。

TypeScript为JavaScript提供了类型支持。

Rollup用于打包ES模块，还可以同时生成CommonJS等其它模块格式。

## 准备工作
### 前置依赖
推荐准备以下环境：
- [Node.js](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/installation)

使用`npm`或者`yarn`代替`pnpm`也是可以的，下文将会以`pnpm`为例。

### 初始化项目
创建新的项目文件夹，在项目文件夹中打开终端（cmd、PowerShell、Bash、Zsh、Fish等），按顺序执行以下命令：

```shell
pnpm init
```
初始化完`package.json`后，可以按需编辑，详见[官方文档](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)。

需要编辑`package.json`文件：
- 加入`module`属性作为ES模块的输出文件，例如`index.es.js`
- 加入`files`属性来控制发布到NPM的文件，例如`["index.js", "index.es.js"]`

安装TypeScript、rollup及其插件，其中`-D`代表添加到`devDependencies`：
```shell
pnpm add -D typescript tslib rollup @rollup/plugin-typescript
```
（可选）如果需要ESLint，可以使用命令行交互来进行设置，笔者配置时选择了JSON配置文件：
```
pnpm create @eslint/config
```
如果安装了ESLint，还需要在`.eslintrc.json`中的`parserOptions`里增加`project`：
```json
"project": ["./tsconfig.json"]
```

（可选）如果需要Jest，可以安装并配置，笔者配置时选择了TypeScript配置文件：
```
pnpm add -D jest @types/jest ts-node ts-jest
pnpm jest --init
```
如果安装了Jest，还需要将文件`jest.config.ts`中的`preset`改为`ts-jest`。

### 版本参考
笔者使用的版本：
| 名称 | 版本 |
| --- | --- |
| Node.js | 19.7.0 |
| pnpm | 7.29.1 |
| TypeScript | 4.9.5 |
| rollup | 3.19.1 |
| ESLint | 8.36.0 |
| Jest | 29.5.0 |

### 配置TypeScript
首先初始化TypeScript:
```shell
pnpm tsc --init
```
编辑`tsconfig.json`，修改`module`为`esnext`、`target`修改为`esnext`。

修改后的`tsconfig.json`参考：
```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### 配置Rollup
新建文件`rollup.config.ts`，写入：
```typescript
import typescript from '@rollup/plugin-typescript'
export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'index.js',
      format: 'cjs'
    },
    {
      dir: 'index.es.js',
      format: 'es'
    }
  ],
  plugins: [
    typescript()
  ]
}
```

其中，`src/index.ts`是**模块入口**的路径、`index.es.js`是ES模块的输出路径、`index.js`是CommonJS的输出路径。

## 代码编写
完成配置以后，可以自由进行模块的代码编写，代码编写与一般的TypeScript无异，需要在入口文件中导出需要导出的内容。

### 简单示例
为了方便演示，本文给出一个简单的案例。

创建`src/hello-world.ts`，写入：
```typescript
export default function helloWorld (): string {
  return 'Hello, World!'
}
```
创建`src/index.ts`作为入口文件，写入：
```typescript
import helloWorld from './hello-world'
export default { helloWorld }
```
（可选）如果安装了Jest，创建`test/hello-world.ts`，写入：
```typescript
import Test from '../src/index'
test('Hello World', () => {
  expect(Test.helloWorld()).toBe('Hello, World!')
})
```

## 模块构建
（可选）如果安装了ESLint，可以格式化一下代码：
```
pnpm eslint --fix 'src/**/*.ts'
```
（可选）如果安装了Jest，可以跑一下测试：
```
pnpm jest
```
通过Rollup进行构建，其中`-c`代表使用配置文件：
```shell
pnpm rollup -c --configPlugin typescript
```
根据上面的`rollup.config.ts`配置文件，构建的产物在`index.js`（CommonJS）以及`index.es.js`（ES模块）。

## 模块发布
在发布模块前，请先在[npm](https://www.npmjs.com/)中创建账户。
首先登录账户：
```shell
pnpm adduser
```
然后进行发布：
```shell
pnpm publish
```

## 参考文献
- [ECMAScript modules | Node.js v19.7.0 Documentation](https://nodejs.org/api/esm.html)
- [TypeScript: How to set up TypeScript](https://www.typescriptlang.org/download)
- [TypeScript: Documentation - Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [Introduction | Rollup](https://rollupjs.org/introduction)
- [pnpm add pkg | pnpm](https://pnpm.io/cli/add)
- [Create an npm package template with TypeScript and rollup.js - DEV Community](https://dev.to/0xkoji/create-an-npm-package-template-with-typescript-and-rollup-js-294a)
- [Installation | ts-jest](https://kulshekhar.github.io/ts-jest/docs/getting-started/installation/#jest-config-file)
- [Getting Started with ESLint - ESLint - Pluggable JavaScript Linter](https://eslint.org/docs/latest/use/getting-started)