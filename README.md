# Attention Visual Slides

Attentionの仕組みをテーマ別に解説する、インタラクティブ・スライド集です。

## 構成

```text
.
├── index.html
└── slides/
    ├── 01-self-attention/
    │   ├── index.html
    │   ├── css/
    │   │   └── styles.css
    │   └── js/
    │       └── app.js
    ├── 02-masked-attention/
    │   └── README.md
    └── 03-cross-attention/
        └── README.md
```

## テーマ

1. **Self-Attention** — 現在のスライド。単語ベクトル、類似度、Softmax、文脈化までを可視化します。
2. **Masked Attention** — Decoderで未来のトークンを参照させない仕組みを扱う予定です。
3. **Cross-Attention** — DecoderがEncoderの出力を参照する仕組みを扱う予定です。

## 開き方

リポジトリ直下の `index.html` をブラウザーで開いてください。現在はSelf-Attention編へ案内します。

各スライドはテーマごとに独立させます。テーマ固有のHTML、CSS、JavaScriptは、それぞれのフォルダ内に配置してください。
