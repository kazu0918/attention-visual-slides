# Quiz - Attention Is All You Need

A self-contained interactive quiz over Vaswani et al. (2017). No build step, no
dependencies, no network required (it pulls Google Fonts if online and falls back
to system fonts if not). Open `index.html` in a browser.

Everything lives in one file so it can be opened straight off disk during a
session, or served with the rest of the deck.

## How it works

There is one quiz. All questions are included by default. Topics can be toggled
on the start screen if you want to drill a single area. Shuffle is off by
default so a run is repeatable; turn it on for a second pass.

## Behaviour worth knowing

- **Answer options are shuffled on every render.** Position carries no signal,
  and the same question looks different on a re-run.
- Every answer carries an explanation, most carry a `Watch out:` note for the
  thing people actually get wrong, and all carry the paper section they come from.
- Questions marked `beyond paper` are not in Vaswani et al. They are the
  follow-ups an audience tends to ask (why not one projection matrix, what
  FlashAttention actually changed, how this relates to a decoder-only LLM).
- Results break down accuracy per topic and list every miss with its answer and
  section reference. **Retry the misses** re-runs only those.
- Keys: `1`-`9` pick an option, `Enter` submits then advances, `H` reveals a hint.

## Question types

`mcq` single choice · `multi` select-all · `num` type a number · `order` click
steps into sequence.

## Adding questions

The bank is the `QUESTIONS` array near the top of the `<script>` block. One object
per question:

```js
{
  topic:'core',        // key from the TOPICS map at the top of the script
  d:2,                 // 1-3: used only to sort easier questions first
  beyond:true,         // flag as not-from-the-paper (optional)
  type:'mcq',          // mcq | multi | num | order
  q:'Question text, HTML allowed',
  sub:'Optional smaller line under the question',
  opts:['…','…'],      // mcq/multi
  a:0,                 // mcq: index · multi: [indices] · num: the number
  tol:0,               // num only: accepted absolute error
  unit:'hours',        // num only: label beside the input
  items:['…','…'],     // order only: the correct sequence
  why:'Explanation shown after answering',
  trap:'Optional - the thing people get wrong',
  hint:'Optional - shown on H',
  ref:'§3.2.1'
}
```

`a` indexes the **original** `opts` order, so shuffling never affects grading.

To add a topic, add a key to `TOPICS`; the start-screen chips and the results
breakdown pick it up automatically.

## Coverage

68 questions across: Before Transformers (5), Attention core & scaling (10),
Multi-head (6), Positional encoding (6), Masking & cross-attention (5),
FFN/residual/norm (7), Full architecture (4), Complexity (Table 1) (5),
Training setup (6), Results & ablations (7), Critique & legacy (7).

Every factual answer was checked against the paper text.
