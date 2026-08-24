# my-new-repo

`app/` に静的サイト(HTML/CSS/JS)を配置。`main` ブランチへの push で GitHub Actions が
GitHub Pages に自動デプロイする。

一部のミニアプリ(例: `app/reaction-react/`)はビルドが必要なため、ソースを
`web/` 以下に置いている。デプロイワークフロー自体はビルドを行わない
単純な静的配信のままなので、こうしたアプリは手元で `npm run build`
した成果物を `app/` 以下にコミットしている。ソースを変更したら
ビルドし直して `app/` 側も更新すること。詳細は各 `web/*/README.md` を参照。

## GitHub Pages を有効にする

初回のみ、リポジトリの Settings → Pages → Build and deployment の Source を
「GitHub Actions」に設定する必要がある。設定後は `main` に push するだけで
`https://<owner>.github.io/my-new-repo/` に反映される。

