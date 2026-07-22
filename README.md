# ZhangzheQuote

一屏一句、左右滑动的“长者同志经典语录”阅读器。18 条语录不会铺成长列表；每次只阅读一条，前后内容仅在屏幕边缘留下窄幅提示。

在线访问：[koutian.is-a.dev/ZhangzheQuote](https://koutian.is-a.dev/ZhangzheQuote/)

## 本地运行

```bash
npm install
npm run dev
```

## 检查与构建

```bash
npm test
npm run build
```

## 浏览方式

- 手机或触控板：左右滑动
- 鼠标：按住语录区域左右拖动，或使用滚轮
- 键盘：`←`、`→`、`Home`、`End`
- 页面控件：左右箭头或底部位置轨

当前语录会同步到 `#quote-01` 至 `#quote-18`，可以直接分享对应位置。

## 设计

视觉基准位于 [`design/quote-carousel-concept.png`](design/quote-carousel-concept.png)。界面使用中国现代主义编辑风格：矿物红底、近黑宋体、方形控件与克制的纸张纹理。
