# 手势解锁库

## Roadmap

- [x] feat: 绘制功能;

- [x] feat: 完善功能(成功回调);

- [x] feat: 添加连线;

- [x] feat: 错误响应;

- [x] feat: 支持异步(promise) 检测;

- [x] doc: 代码结构优化(分离功能);

- [x] feat: 添加 error, success, loading 方法, 支持外部调用;

- [x] feat: mouse 事件改为 touch 事件;

- [ ] feat: 拆分出多一层 canvas 作为 checking 交互展示;

- [x] feat: typescriptify;

- [x] feat: onChange event;

- [x] fix: touch 事件的 clientX 和 clientY 转为相对于容器的坐标;

- [x] fix: 父容器能滚动的情况下会导致坐标计算不准确;

## Doc

```ts
import Lock from '@czs/lock';
const ILockParams = {
  container: HTMLElement;
  onResult: Promise | (result: number[]) => void;
  onChange: (result: number[]) => {},
  keyboard: [number, number]
}
const lock = new Lock({
  container: document.querySelector('dom'),
  onResult: result => {},
  onChange: result => {},
  keyboard: [3, 3]
}: ILockParams);

// show loading
lock.loading(text: string);

// show error
lock.error();

// show success(just close loading)
lock.success();
```

## Example

```shell
cd project
npm i
npm run start
```
