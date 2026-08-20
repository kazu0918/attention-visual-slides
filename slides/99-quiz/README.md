# Quiz - Attention Is All You Need

A self-contained interactive quiz over Vaswani et al. (2017). No build step, no
dependencies, no network required (it pulls Google Fonts if online and falls back
to system fonts if not). Open `index.html` in a browser.

Everything lives in one file so it can be opened straight off disk during a
session, or served with the rest of the deck.

## One curated set

40 questions, in a fixed presenter-friendly order, with the same set for
everyone. The only start-screen control is topic filtering:

- **Topics** - toggle to drill a single area or keep the full 40-question run.

This version is aimed at going through the paper together live rather than
running variable-length solo practice modes.

Questions are ordered by topic, then easier-to-harder within each topic.
Difficulty is not shown - it shapes the flow, it is not a label on anyone.

## Behaviour worth knowing

- Every answer carries an explanation, most carry a `Watch out:` note for the
  thing people actually get wrong, and all carry the paper section they come from.
- Questions marked `beyond paper` are not in Vaswani et al. - they are the
  follow-ups an audience tends to ask (why not one projection matrix, what
  FlashAttention actually changed, how this relates to a decoder-only LLM).
- Results break down accuracy per topic and list every miss with its answer and
  section reference. **Retry the misses** re-runs only those.
- Keys: `1`–`9` pick an option, `Enter` submits then advances, `H` reveals a hint.

## Question types

`mcq` single choice · `multi` select-all · `num` type a number · `order` click
steps into sequence.

## Adding questions

The bank is the `QUESTIONS` array near the top of the `<script>` block. One object
per question:

```js
{
  topic:'core',        // key from the TOPICS map at the top of the script
  d:2,                 // 1 easy, 2 medium, 3 hard - orders questions, never displayed
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

40 curated questions across: Before Transformers (4), Attention core & scaling
(6), Multi-head (4), Positional encoding (4), Masking & cross-attention (4),
FFN/residual/norm (4), Full architecture (3), Complexity - Table 1 (3),
Training setup (3), Results & ablations (3), Critique & legacy (2).

Every factual answer was checked against the paper text. Twelve pure-trivia
questions were cut in a later pass (batch token counts, PE wavelength range,
dropout placement, and similar) - the bar is whether getting it wrong reveals a
misunderstanding, not whether the number appears in the paper.
