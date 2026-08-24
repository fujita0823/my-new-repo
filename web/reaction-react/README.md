# reaction-react

`app/reaction/`(素のHTML/CSS/JS)の反応速度テストを、Vite + React で作り直した版。
同じ見た目・同じロジックを、ビルドツールとコンポーネントフレームワークを使うと
実際にどうなるかの比較サンプルとして用意している。

## ローカルで動かす

```
cd web/reaction-react
npm install
npm run dev
```

## ビルド

```
npm run build
```

`dist/` に静的ファイルが出力される。デプロイワークフローはビルドを
行わない単純な静的配信なので、この `dist/` の中身を手元で
`app/reaction-react/` にコピーしてコミットしている。

```
cp -r dist/* ../../app/reaction-react/
```

ソース(`src/` 以下)を変更したら、上記の手順でビルドし直して
`app/reaction-react/` 側も更新すること。

## 素のJS版との違い

- 状態管理: `let state = "idle"` などの変数直書き → Reactの `useState`
- DOM更新: `element.textContent = ...` の手動書き換え → JSXの再レンダリング
- タイマー管理: グローバル変数 → `useRef` でコンポーネントに閉じ込め
- ビルド: 素のJS版はブラウザがそのまま読める1ファイル。こちらは `npm run build`
  でJSX変換・バンドル・ミニファイを経て静的ファイルが生成される
