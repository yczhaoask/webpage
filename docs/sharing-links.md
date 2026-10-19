# 分享链接与效果查看

以下链接已加入 UTM 来源标记，可直接复制。每个位置使用对应链接；不要把它们放在网站内部导航中，也不要在参数里填写个人姓名、群名、账号或计算器数据。

| 分享位置 | 首页计算器链接 |
| --- | --- |
| 微信群 | https://veteranpayguide.com/?utm_source=wechat&utm_medium=social&utm_campaign=va_pay_202610&utm_content=group#calculator |
| 微信朋友圈 | https://veteranpayguide.com/?utm_source=wechat&utm_medium=social&utm_campaign=va_pay_202610&utm_content=moments#calculator |
| Facebook 帖子 | https://veteranpayguide.com/?utm_source=facebook&utm_medium=social&utm_campaign=va_pay_202610&utm_content=post#calculator |
| Reddit 帖子 | https://veteranpayguide.com/?utm_source=reddit&utm_medium=social&utm_campaign=va_pay_202610&utm_content=post#calculator |

发放日期指南（微信）：

https://veteranpayguide.com/va-disability-payment-dates/?utm_source=wechat&utm_medium=social&utm_campaign=va_pay_202610&utm_content=payment_dates

`va_pay_202610` 表示 2026 年 10 月这批分享，下个月换成 `va_pay_202611` 即可。相同活动名便于比较各渠道。同一个位置保持相同链接，不必每次分享都新建活动。

## 在 Ahrefs 中查看

项目 Veteranpayguide → Web Analytics → Traffic sources → Campaigns。选择完整日期范围，查看 campaign `va_pay_202610`，再按 Source、Medium、Content 比较来源。微信即使不传 referrer，保留 UTM 参数的点击仍可按活动查看。转发时参数被删掉的访问仍可能归入 Direct。

Web Analytics → Tracked events：

- `calculator_used` / Calculator used：有效计算器输入变化或手动提交后的使用事件；初始自动显示结果不计入。
- `payment_calendar_downloaded` / Payment calendar downloaded：点击生成并发起 .ics 下载的事件，不能确认用户最终保存文件。

这两个事件各自每次页面加载最多发送一次。SDK 延迟加载时，先把事件名留在当前页面内存，加载完成后发送；被拦截或离开页面前仍未加载时可能无法统计。没有 cookie 或跨页面去重；不会发送评级、家庭信息、金额或自定义事件属性。

从新链接和事件上线后开始观察，旧访问无法补回来源。优先比较完整 7 天与前一个完整 7 天，并检查访问量和计算器使用人数，避免拿未结束的一天与完整日期比较。
