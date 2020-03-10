# 手势解锁库

## Roadmap

- [x] 绘制功能;

- [x] 完善功能(成功回调);

- [x] 添加连线;

- [x] mouseleave 事件 bug;

- [ ] 美化设计;

- [x] 错误响应;

- [x] 支持异步(promise) 检测;

- [ ] 代码结构优化(分离功能);

- [ ] 添加 error, success, loading 方法, 支持外部调用;

## Doc

```js
import Lock from '@czs/lock';
new Lock({
  container: document.querySelector('dom'),
  callback: result => {}
})
```

## Example

```shell
cd project
npm i
npm run start
```
