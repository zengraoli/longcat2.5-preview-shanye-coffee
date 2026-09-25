# 错误码登记

统一响应格式：`{"code": 0, "data": ..., "message": "ok"}`；出错时 `code` 非 0，`message` 为中文原因。

| 错误码 | HTTP | 枚举名 | 含义 |
|---|---|---|---|
| 1001 | 400 | VALIDATION_FAILED | 参数校验失败 |
| 1002 | 401 | UNAUTHORIZED | 未登录或登录已过期 |
| 1003 | 401 | TOKEN_EXPIRED | 登录已过期，请重新登录 |
| 1004 | 403 | FORBIDDEN | 没有权限执行此操作 |
| 1005 | 404 | NOT_FOUND | 资源不存在 |
| 1006 | 409 | ALREADY_EXISTS | 数据已存在 |
| 2001 | 400 | INVALID_ORDER_STATUS | 非法的订单状态流转 |
| 2002 | 400 | PRODUCT_OFF_SHELF | 商品已下架 |
| 2003 | 400 | PRODUCT_SOLD_OUT | 商品已售罄 |
| 3001 | 400 | COUPON_EXPIRED | 优惠券已过期 |
| 3002 | 409 | COUPON_ALREADY_CLAIMED | 优惠券已领取 |
| 3003 | 400 | COUPON_NOT_USABLE | 优惠券不满足使用条件 |
| 4001 | 400 | ORDER_NOT_PAYABLE | 订单当前状态不可支付 |
| 9999 | 500 | INTERNAL_ERROR | 服务器内部错误 |
