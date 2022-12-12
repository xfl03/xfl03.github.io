---
title: Spring Boot 3.0 升级 实战踩坑记录
layout: single
date: '2022-12-12 17:58:08'
categories:
- 后端
tags:
- Java
- Spring
- SpringBoot
- gRPC
- SpringSecurity
- SpringDataJPA
toc: true
---

Spring Boot常用于Java后端开发，于2022年11月24日正式发布了3.0.0版本，带来了全新的特性、升级了依赖版本乃至Java版本，与此同时也弃用或更改了一些旧版本中的写法，导致了需要修改代码或配置文件。  
笔者尝鲜去升级了一下Spring Boot 3.0，本篇文章将会简要归纳总结一下笔者在升级的时候需要进行的操作、遇到的问题和解决方案，希望能对各位读者有所帮助。

## 版本信息
作为参考，笔者升级后各版本信息如下：
- Spring Boot 3.0.0
- Spring 6.0.2
- Spring Security 6.0.0
- Spring Data JPA 3.0.0
- Java 17
- Gradle 7.6

## 确认依赖
Spring框架的版本可以通过Gradle插件`io.spring.dependency-management`来进行自动管理，升级Spring Boot版本时会带着Spring框架以及Spring生态全家桶一起升级。  
推荐安装依赖Spring Boot Properties Migrator来检查是否有被弃用的Spring Boot配置文件属性，可以在`build.gradle`文件里的`dependencies`闭包中添加：
```gradle
implementation 'org.springframework.boot:spring-boot-properties-migrator'
```
在升级完成后，可以移除这个依赖。
### 升级MySQL JDBC驱动（可选）
这一步不是必须的，MySQL的JDBC驱动在2022年10月份的时候更改过名称，虽然不改也能继续用，不过还是建议顺路一起改一下吧，在`build.gradle`文件中的`dependencies`，将`mysql:mysql-connector-java`更改为`com.mysql:mysql-connector-j`，例如：
```gradle
runtimeOnly 'com.mysql:mysql-connector-j'
```
## 升级到2.7
为了确保升级顺利，不要急着一步到位直接升级3.0，建议先将Spring Boot升级到2.7版本确认2.x时代的兼容性，截止发稿时最新的版本为2.7.6，可以将`build.gradle`中的`plugins`闭包内的`org.springframework.boot`版本改为`2.7.6`，例如：
```gradle
plugins {
	id 'org.springframework.boot' version '2.7.6'
	id 'io.spring.dependency-management' version '1.1.0'
	id 'java'
}
```
构建并启动服务端确认没有问题后，可以关闭服务端，进行下一步升级。
## 升级Java版本
从Spring Boot 3.0开始，最低支持的Java版本变为**Java 17**、最高支持Java 19，如果还在使用Java 8或者Java 11的话，首先需要升级Java。  
推荐使用LTS版本的Java 17，Oracle官方的JDK可以在[这里下载](https://www.oracle.com/java/technologies/downloads/#java17)，也可以使用诸如[Eclipse Temurin](https://adoptium.net/zh-CN/temurin/releases/)之类的第三方构建OpenJDK，还可以使用Docker镜像`openjdk:17.0.2`。如果使用的是IntelliJ IDEA，可以在`文件`-`项目结构`-`平台设置`-`SDK`中点击`+`自动下载JDK，下载完毕后在`项目设置`-`项目`中更换`SDK`与`语言级别`。  
如果对自己的代码能否在高版本Java正常运行没有信心，可以使用[Eclipse Migration Toolkit for Java(EMT4J)
](https://github.com/adoptium/emt4j)之类的工具检查一下是否存在不兼容高版本的写法。  
## 升级Gradle版本
高版本的Java也需要高版本的Gradle进行构建，为了成功构建，还需要升级Gradle版本，对应的最低支持版本如下：
|Java|Gradle|
|--|--|
|17|7.3|
|18|7.5|
|19|7.6|

例如，上一步安装了Java 17，这一步可以选择Gradle 7.3.3、7.4.2、7.5.1、7.6等版本，如果没有特殊需求的话，建议一步到位选择最新版本（可以在[发布页面](https://gradle.org/releases/)找到），截至发稿时的最新版本为7.6。  
如果使用的是Gradle Wrapper，可以直接修改`gradle/wrapper/gradle-wrapper.properties`中的`distributionUrl`，例如：
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-bin.zip
```
升级完毕后，使用Java 17或Java 19构建并启动Spring Boot 2.7的服务端，如果没有问题可以关闭后进行下一步。
## 升级到3.0
与升级到2.7类似，修改`build.gradle`中的插件版本即可，截止发稿时最新的版本为3.0.0（最新版本可以在[发布页面](https://github.com/spring-projects/spring-boot/releases)找到），例如：
```gradle
plugins {
	id 'org.springframework.boot' version '3.0.0'
	id 'io.spring.dependency-management' version '1.1.0'
	id 'java'
}
```
## 迁移到Jakarta EE
从Spring Boot 3.0开始，原有的Java EE被彻底弃用，换用Jakarta EE，也就是说，所有包名为`javax.*`的引用都需要更换为`jakarta.*`。如果使用的是IntelliJ IDEA，可以点击`重构`-`迁移软件包和类`-`Java EE to Jakarta EE`来自动完成扫描和迁移。  
此时可以尝试构建并启动服务端，如果能成功启动，恭喜Spring Boot 3.0升级成功。如果无法正常构建或启动，还需要继续阅读问题排查。

## 构建问题排查
以下是笔者遇到的一些会导致通不过构建的问题。
### gRPC
#### 找不到`javax.annotation.Generated`
如果使用了gRPC，会根据proto文件生成一些Java文件，生成的Java文件中会有`@javax.annotation.Generated`注解，而上文提到了Spring Boot 3.0已经全面换成Jakarta EE，如果还需要使用Java EE的类，必须得自己手动引入依赖。  
依赖引入到`build.gradle`文件中的`dependencies`，需要添加：
```gradle
implementation 'javax.annotation:javax.annotation-api:1.3.2'
```
### Spring Security
Spring Security 6.0也是一个大升级，光这部分又能单独写一篇文章，本文简单讲一下最关键的变更。
#### 找不到类`org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter`
几乎是大家都会用去的`WebSecurityConfigurerAdapter`被删除了，原先继承这个的类现在无需继承任何类，只需要带上`@Configuration`注解。  
原本配置`WebSecurity`和`HttpSecurity`的`configure`方法变为普通的`@Bean`方法，分别返回`WebSecurityCustomizer`和`SecurityFilterChain`。  
原先的方法`authorizeRequests`变为`authorizeHttpRequests`、方法`antMatchers`变为`requestMatchers`。  
修改自Spring Security官方博客的例子：
```java
// 以前的写法
@Configuration
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {
    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers("/ignore1", "/ignore2");
    }
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .anyRequest().authenticated()
            .and()
            .httpBasic(withDefaults());
    }
}
```

```java
// 现在的写法
@Configuration
// 不再继承于WebSecurityConfigurerAdapter
public class SecurityConfiguration {
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        // WebSecurityCustomizer是一个类似于Consumer<WebSecurity>的接口，函数接受一个WebSecurity类型的变量，无返回值
        // 此处使用lambda实现WebSecurityCustomizer接口，web变量的类型WebSecurity，箭头后面可以对其进行操作
        // 使用requestMatchers()代替antMatchers()
        return (web) -> web.ignoring().requestMatchers("/ignore1", "/ignore2");
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            //使用authorizeHttpRequests()代替authorizeRequests()
            .authorizeHttpRequests((authz) -> authz
                //这种写法被称为Lambda DSL，代替原来的and()链式操作
                .anyRequest().authenticated()
            )
            .httpBasic(withDefaults());
        // 需要进行build()，返回SecurityFilterChain
        return http.build();
    }
}
```

## 运行问题排查
以下是笔者遇到的一些会导致无法启动服务端的问题。
### Spring Data JPA
#### 找不到类`org.hibernate.dialect.MySQL5InnoDBDialect`
一般用于`spring.jpa.properties.hibernate.dialect`，如果使用的是MySQL，请将其更改为`org.hibernate.dialect.MySQLDialect`，例如：
```properties
org.hibernate.dialect.MySQL5InnoDBDialect=org.hibernate.dialect.MySQLDialect
```
#### 找不到类`org.springframework.boot.orm.jpa.hibernate.SpringPhysicalNamingStrategy`
一般用于`spring.jpa.hibernate.naming.physical-strategy`，如果需要将驼峰转换为下划线，请其将更改为`org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy`，例如：
```properties
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy
```

## 参考链接
- [Spring Boot 3.0.0 - GitHub Release](https://github.com/spring-projects/spring-boot/releases/tag/v3.0.0)
- [Spring Boot 3.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Release-Notes)
- [Spring Boot 3.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide)
- [Spring Security without the WebSecurityConfigurerAdapter](https://spring.io/blog/2022/02/21/spring-security-without-the-websecurityconfigureradapter)
- [Gradle Compatibility Matrix](https://docs.gradle.org/current/userguide/compatibility.html)

## 发布平台
本文还发布至以下平台：
- (知乎)[https://zhuanlan.zhihu.com/p/591283166]
- (掘金)[https://juejin.cn/post/7176204472082038840]
- (思否)[https://segmentfault.com/a/1190000043043122]
- (CSDN)[https://blog.csdn.net/gooding300/article/details/128291396]