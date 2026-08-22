# my-new-repo

`app/` に静的サイト(HTML/CSS/JS)を配置。`main` ブランチへの push で GitHub Actions が
GitHub Pages に自動デプロイする。

## GitHub Pages を有効にする

初回のみ、リポジトリの Settings → Pages → Build and deployment の Source を
「GitHub Actions」に設定する必要がある。設定後は `main` に push するだけで
`https://<owner>.github.io/my-new-repo/` に反映される。

