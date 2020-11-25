'use strict';

const Validate = require('../../libs');

module.exports = {
  /**
   * 校验对象
   *
   * @param  { object } rulesObj 要校验的字段名称及其校验规则，必传
   * @param  { object } paramsObj 要校验的对象值，可不传，默认校验 request.body；若传了则可接受第三个参数 merge
   * @param  { boolean } merge 若传了对象值 paramsObj，可传 merge 指定是否将传入的对象值合并到 request.body，若为 false，则不合并，抛弃 request.body 而直接校验 paramsObj
   */
  valid(rulesObj, paramsObj, merge = true) {
    const { app } = this;

    const va = new Validate();
    let requestParamsObj = this.request.body;

    if (paramsObj instanceof Object) {
      if (merge) {
        Object.assign(requestParamsObj, paramsObj);
      } else {
        requestParamsObj = paramsObj;
      }
    }

    /**
     * 根据校验对象的 key 值获取 requestParamsObj 中的对应值，并将 key 作为第三个参数传入（校验失败时方便定位失败字段）
     */
    Object.keys(rulesObj).forEach(key => {
      va.add(requestParamsObj[key], rulesObj[key], key);
    });

    /**
     * 校验结果，若有返回值，代表校验不通过
     * 可选择 return 或者 throw 该值
     */
    const vaResult = va.start();

    if (vaResult) {
      const resultHandleStr = app.config.validatePlugin.resultHandle || 'return';

      if (resultHandleStr === 'return') {
        return vaResult;
      }
      throw new Error(vaResult);

    }
  },

  /**
   * 添加自定义校验规则
   *
   * @param { string } ruleName 规则名称，必传
   * @param { function } validFn 该规则对应的校验方法，必传
   * @param { string } failMsg 该规则校验失败返回的错误信息，非必传
   */
  addValidRule(ruleName = '', validFn = () => {}, failMsg = '') {
    if (!ruleName) return '缺少规则名称';

    return Validate.addValidRule(ruleName, validFn, failMsg);
  },
};
