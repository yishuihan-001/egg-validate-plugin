'use strict';

/**
 * egg-validate-plugin default config
 * @member Config#validatePlugin
 * @property {String} SOME_KEY - some description
 */
exports.validatePlugin = {
  /**
   * 校验结果返回形式，可选 return 或 throw，默认 return
   * 选择 return，会将校验失败信息返回，有返回值则判定校验失败
   * 选择 throw，则需要以 try.catch 形式捕获校验失败信息
   */
  resultHandle: 'return',
};
