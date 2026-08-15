# Attention Visual Slides

An interactive slide collection that explains attention mechanisms by theme.

## Project structure

```text
.
|-- index.html
`-- slides/
    |-- 01-self-attention/
    |   |-- index.html
    |   |-- 01-encoder-decoder.html
    |   |-- 02-word-vectors.html
    |   |-- ...
    |   |-- 19-context-update.html
    |   |-- css/
    |   |   `-- styles.css
    |   `-- js/
    |       `-- app.js
    |-- 02-masked-attention/
    |   `-- README.md
    `-- 03-cross-attention/
        `-- README.md
```

## Topics

1. **Self-Attention** — The current slide deck visualizes word vectors, similarity scores, softmax weights, and contextualization.
2. **Masked Attention** — A planned deck about preventing a decoder from attending to future tokens.
3. **Cross-Attention** — A planned deck about how a decoder attends to encoder outputs.

## Usage

Open the repository-level `index.html` in a browser. It currently redirects to the Self-Attention deck.

Each slide is a standalone HTML page. Slides in the same deck share the deck's CSS, JavaScript, and assets, while navigation dots and arrow/Page Up/Page Down keys move between pages.

Each deck is self-contained. Place topic-specific HTML, CSS, JavaScript, and assets inside its corresponding directory.

## Acknowledgements

This project was developed with assistance from OpenAI Codex.
