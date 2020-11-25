# egg-validate-plugin

一个简单、易用、可扩展的 egg 应用参数校验插件

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-validate-plugin.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-validate-plugin
[travis-image]: https://img.shields.io/travis/eggjs/egg-validate-plugin.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-validate-plugin
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-validate-plugin.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-validate-plugin?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-validate-plugin.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-validate-plugin
[snyk-image]: https://snyk.io/test/npm/egg-validate-plugin/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-validate-plugin
[download-image]: https://img.shields.io/npm/dm/egg-validate-plugin.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-validate-plugin



## 安装插件

```js
npm i egg-validate-plugin -S
```


## 插件开启与配置

### 开启插件

```js
// config/plugin.js

exports.validatePlugin = {
  enable: true,
  package: 'egg-validate-plugin',
};
```

### 插件配置

```js
//config/config.default.js

exports.validatePlugin = {
  resultHandle: 'return', // 可选 return 和 throw，默认 return
};
```
1. 当 resultHandle 设为 return 时，会直接返回校验失败的提示信息，你需要用一个变量接收他，根据是否有返回值判断校验是否通过

```js
// resultHandle: 'return'

const validResultMsg = ctx.valid({
  name: [ 'required', 'type:string' ]
});

if (validResultMsg) {
  return ctx.body = validResultMsg
}

```

2. 当 resultHandle 设为 throw 时，校验失败时会抛错一个错误，错误信息就是校验失败的提示信息，你需要通过 try.catch 捕获这个错误

```js
// resultHandle: 'throw'

try {
  ctx.valid({
    name: [ 'required', 'type:string' ]
  });
} catch (err) {
  return ctx.body = err.message
}
```


## ctx.valid 校验方法说明

### 参数说明

> 第一个参数：下称 **规则对象**
> 
> 第二个参数：下称 **扩展字段对象**
> 
> 第三个参数：merge，是否合并，默认为 true

1. egg 应用开发中，需要对一些数据字段加以校验，比如是否必填、格式类型、正则匹配等；更多的时候我们可能会对 request.body 进行检验，所以插件封装了对 request.body 的默认校验，你只需要传入规则对象（字段名及其对应的校验规则）即可

2. 如果你想校验其他数据，如自定义对象 myObj 或者 request.query，只需要将其作为第二个参数（扩展字段对象）传入即可

3. 如果传入了扩展字段对象，那么也支持传入第三个参数 merge（boolean 值，为 true 时可缺省），表示是否将扩展字段对象合并到默认的***校验主体 request.body***（merge 默认为 true，即会发生合并）

4. 如果你只想对扩展字段对象进行校验，那么第三个参数传 false 即可，此时校验主体会变更为扩展字段对象，不会包含任何 request.body 中的字段

    ```js
    // 第三个参数默认为 true （缺省可不传），即 myObj 会合并到 request.body，且会覆盖 request.body 中的同名字段
    // 第三个参数传 false，则 myObj 不会合并到 request.body，而只会对 myObj 进行校验

    const myObj = {
      name: 'slient',
      age: 12
    }

    try {
      ctx.valid({
        name: [ 'required', 'type:string' ],
        age: [ 'required', 'type:number', 'min:8' ]
      }, myObj, false);
    } catch (err) {
      return ctx.body = err.message
    }
    ```

5. 仅会校验规则对象中存在的字段，额外的字段不会进行校验

    ```js
    // 如下，假设 request.body 为 { className: '小一班', classId: 9 }，由于第三个参数 merge 默认为 true， 
    // 那么合并后的校验主体为 const validObj = { name: 'slient', age: 12, className: '小一班', classId: 9 }
    // 由于规则对象中仅指定了对 name 和 classId 的校验，那么最终校验主体中的 age 和 className 字段不会被校验

    const myObj = {
      name: 'slient',
      age: 12
    }

    try {
      ctx.valid({
        name: [ 'required', 'type:string' ],
        classId: [ 'required', 'type:number' ]
      }, myObj);
    } catch (err) {
      return ctx.body = err.message
    }
    ```

### 使用说明

1. 只传入规则名，使用默认的失败提示文案

```js
ctx.valid({
  name: [ 'required', 'type:string' ]
});
```

2. 传入规则名并指定失败提示文案

```js
ctx.valid({
  name: [ { rule: 'required', msg: '缺少名称' }, { rule: 'type:string', msg: '名称需要是字符串类型' } ]
});

//可组合使用
ctx.valid({
  name: [ 'required', { rule: 'type:string', msg: '名称需要是字符串类型' } ]
});
```

3. 冒号表达式

也许你已经发现了，有些规则名中存在冒号

是的，这里我们规定，冒号前面的是规则名，后面的是校验目标，协助我们对传入的值进行校验

我们的一些校验规则是需要用到冒号表达式的，具体请看**内置规则**，这里以枚举 enum 和相等 equal 为例演示用法

```js
// enum 是枚举规则名，冒号后面是序列常量
ctx.valid({
  role: [ 'required', { rule: 'enum:[3,6,9]', msg: 'role 要是 3、6、9 其中之一' }]
});

// equal 是相等（全等）规则名，冒号后面是参照目标
ctx.valid({
  score: [ 'required', 'type:number', { rule: 'equal:100', msg: '你的分数小于 100' }]
});
```


## 内置规则

插件内置了 10 种校验规则，基本能满足一般校验场景，如需自定义规则，参见**添加自定义规则**

| 规则名 | 释义 | 使用案例 |
| --- | --- | --- |
| required | 校验非空 | ctx.valid({ name: [ 'required' ] });
| regexpPhone | 校验手机号 | ctx.valid({ phone: [ 'regexpPhone' ] });
| regexpEmail | 校验邮箱 | ctx.valid({ email: [ 'regexpEmail' ] });
| minLength | 校验最小长度 | ctx.valid({ password: [ 'minLength:8' ] });
| maxLength | 校验最大长度 | ctx.valid({ password: [ 'maxLength:10' ] });
| enum | 校验值是否匹配其一 | ctx.valid({ role: [ 'enum:[3,6,9]' ] });
| equal | 校验值是否相等 | ctx.valid({ score: [ 'equal:100' ] });
| type | 校验是否是目标类型 | ctx.valid({ age: [ 'type:number' ] });
| min | 校验最小值 | ctx.valid({ age: [ 'min:1' ] });
| max | 校验最大值 | ctx.valid({ age: [ 'max:1000' ] })



## 添加自定义规则

如果内置规则不能满足需求，我们也可以添加自定义规则，插件提供了扩展校验规则的能力，你只需要调用 `ctx.addValidRule` 方法就能很容易的添加一条自定义规则

`ctx.addValidRule` 方法接受三个参数
* 第一个参数是规则名称（必传）
* 第二个参数是校验函数（必传）
* 第三个参数是校验失败的默认提示信息（非必传）

### 添加普通规则

普通规则的校验函数接收两个参数，参 1 是需要校验的值，参 2 是校验失败的提示信息

```js
// 判断密码是否符合规则（数字字母混合且不小于 6 位字符）

ctx.addValidRule('mixNumLetter', (val, msg) => {
  if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,}$/.test(val)) {
    return msg;
  }
}, '该字段正则校验不通过')

ctx.valid({
  password: [ 'required', { rule: 'mixNumLetter', msg: '请输入不小于 6 位的数字字母混合密码' }]
});
```

### 添加冒号表达式规则

冒号表达式规则的校验函数接收三个参数，参 1 是需要校验的值，参 2 是校验目标，参 3 是校验失败的提示信息

```js
// 判断输入的字符知否以指定字符开头

ctx.addValidRule('startWith', (val, target, msg) => {
  if (val.slice(0, target.length) !== target) {
    return msg;
  }
}, '该字段正则校验不通过')

ctx.valid({
  password: [ 'required', { rule: 'startWith:abc', msg: '请输入以 abc 开始的字符' }]
});
```


## 完整案例

```js
'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
 
  async create () {
    const { ctx } = this

    ctx.addValidRule('mixNumLetter', (val, msg) => {
      if (!/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,}$/.test(val)) {
        return msg;
      }
    }, '该字段正则校验不通过')
    
    // 假设此时 request.body 为 { name: 'slient', age: 9, role: 9, password: '12345', teamName: '研发团队' }
    // 那么就会对 request.body 中的 name、age、role、password 等字段进行校验，teamName 不会被校验，因为他不在规则对象中

    // 扩展字段对象 const myObj = { name: 'slient', age: 12 }

    // 如果想校验扩展字段对象 myObj，将其作为第二个参数传入即可，默认会覆盖 request.body 中的同名字段
    // eg: ctx.valid({...}, myObj)

    // 如果只想校验扩展字段对象 myObj 而不校验 request.body，将其作为第二个参数传入的同时，再传入第三个参数为 false 即可
    // ctx.valid({...}, myObj, false)

    try {
      ctx.valid({
        name: [ 'required', 'type:string', 'minLength:6' ],
        age: [ 'required', 'type:number', 'min:10', { rule: 'max:100', msg: 'age 要大于 10 小于 100' }, ],
        role: [ 'required', { rule: 'enum:[3,6,9]', msg: 'role 要是 3、6、9 其一' }],
        password: [ 'required', { rule: 'mixNumLetter', msg: '请输入不小于 6 位的数字字母混合密码' }]
      });
    } catch (err) {
      return ctx.body = err.message
    }

    ctx.body = 'HI，EGG ~~'   
  }
}

module.exports = HomeController;
```


## 提问交流

请到 [egg issues](https://github.com/eggjs/egg/issues) 异步交流。

## License

[MIT](LICENSE)
