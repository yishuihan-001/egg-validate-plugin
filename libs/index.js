'use strict';

const Rules = {
  // 必填
  required(v, msg) {
    if (v === '' || v === undefined || v === null || !v) {
      return msg;
    }
  },

  // 校验手机号
  regexpPhone(v, msg) {
    if (!/^((13|14|15|16|17|18|19)[0-9]{1}\d{8})$/.test(v)) {
      return msg;
    }
  },

  // 校验邮箱
  regexpEmail(v, msg) {
    if (!/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(v)) {
      return msg;
    }
  },

  // 最小长度
  minLength(v, len, msg) {
    if (v.length < len) {
      return msg;
    }
  },

  // 最大长度
  maxLength(v, len, msg) {
    if (v.length > len) {
      return msg;
    }
  },

  // 枚举
  enum(v, arr, msg) {
    arr = JSON.parse(arr);
    
    if (arr.indexOf(v) < 0) {
      return msg;
    }
  },

  // 相等
  equal(v, ov, msg) {
    if (typeof v === 'number') {
      ov = +ov
    }

    if (v !== ov) {
      return msg;
    }
  },

  // 验证类型
  type(v, type, msg) {
    if (typeof v !== type) {
      return msg;
    }
  },

  // 最小值
  min(v, tv, msg) {
    if (v < tv) {
      return msg;
    }
  },

  // 最大值
  max(v, tv, msg) {
    if (v > tv) {
      return msg;
    }
  },
};


const DefaultMsg = {
  required: key => `${key} 不能为空`,
  regexpPhone: key => `${key} 不符合手机号格式`,
  regexpEmail: key => `${key} 不符合 email 格式`,
  minLength: key => `${key} 字符长度不符合要求`,
  maxLength: key => `${key} 字符长度不符合要求`,
  enum: key => `${key} 不在限定项内`,
  equal: key => `${key} 不等于目标字符`,
  type: key => `${key} 类型有误`,
  min: key => `${key} 数值大小不符合要求`,
  max: key => `${key} 数值大小不符合要求`,
};


class Validate {
  constructor() {
    this.list = [];
  }

  /**
   * 为同一个值添加多个校验规则
   *
   * @param { number|boolean|string } value 校验值，必传
   * @param { array } rules 针对校验值要执行的校验规则，必传
   * @param { string } key 校验值的字段名，在没有传入指定错误提示的情况下，检验失败时方便定位字段，非必传
   */
  add(value, rules, key) {
    const that = this;

    rules.forEach(rule => {
      (function(item) {
        /**
         * item 是传入的每一条规则名称/规则对象，可以是字符串，也可以是对象
         *
         * 传入字符串，即只传入校验规则名称，这种情况下缺省校验失败的错误提示
         * @param { string } eg: required 或 type:number
         *
         * 传入对象，即传入校验规则名称和校验失败的错误提示
         * @param { object } eg: { rule: 'required', msg: '请输入 xxx' } 或 { rule: 'type:number', msg: '传入的不是数值类型' }
         */
        item = typeof item === 'string' ? { rule: item } : item;

        /**
         * 如果传入的规则名包含英文冒号:，则规定冒号 : 前面的是规则名，后面的是校验目标
         *
         * eg: { rule: 'type:number', msg: '传入的不是数值类型' }
         * 如果传入的校验值不是 number 类型，则会抛出错误提示
         */
        const dataArr = item.rule.split(':');

        /**
         * 校验规则名称
         */
        const ruleName = dataArr.shift();

        /**
         * 将校验值、校验目标(有则传入)放入同一数组中
         * 若校验目标存在：数组中第一位是校验值，第二位是校验目标，第三位是错误提示
         * 若校验目标不存在：数组中第一位是校验值，第二位是错误提示
         */
        dataArr.unshift(value);

        /**
         * 如果传入了错误提示，则使用传入的；
         * 如果没有传入错误提示，若 DefaultMsg 中存在该规则的默认错误提示（可为函数返回值），则使用默认提示，否则使用兜底提示
         */
        const errorMsg = item.msg ? item.msg
          : DefaultMsg[ruleName]
            ? (typeof DefaultMsg[ruleName] === 'function' ? DefaultMsg[ruleName](key || '参数') : DefaultMsg[ruleName])
            : '参数校验失败，请检查后重新尝试';

        /**
         * 将错误提示推入数组末尾
         */
        dataArr.push(errorMsg);

        /**
         * 将校验函数推入校验列表
         */
        that.list.push(function() {
          return Rules[ruleName] ? Rules[ruleName].apply(null, dataArr) : `验证失败，请检查校验规则 ${ruleName} 是否存在`;
        });

      })(rule);
    });
  }

  /**
   * 启动函数，校验值及其规则添加完毕，可执行此方法启动校验
   * 如果某个校验函数存在返回值，表示该值校验失败，中止校验并返回错误信息
   * 如果不存在返回值，表示全部校验通过
   */
  start() {
    for (let i = 0, len = this.list.length; i < len; i++) {
      const res = this.list[i]();

      if (res) {
        return res;
      }
    }
  }

  /**
   * 添加新的校验规则，如果该规则名称已存在，不会覆盖原有规则
   *
   * @param { string } ruleName 规则名称，必传
   * @param { function } validFn 该规则对应的校验方法，必传
   * @param { string } failMsg 该规则校验失败返回的错误信息，非必传
   */
  static addValidRule(ruleName, validFn, failMsg) {
    if (Rules[ruleName]) {
      return `规则 ${ruleName} 已存在`;
    }

    Rules[ruleName] = validFn;

    if (failMsg) {
      DefaultMsg[ruleName] = failMsg;
    }
  }
}

module.exports = Validate;

