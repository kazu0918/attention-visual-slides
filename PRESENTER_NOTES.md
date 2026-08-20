# Presenter notes

The session now runs across three decks, in this order:

| Deck | Slides | Covers |
|---|---|---|
| `slides/00-before-transformers/` | 4 | Why RNNs, what was wrong with them, what 2014 already fixed |
| `slides/01-self-attention/` | 30 | Embeddings, positional encoding, scaled dot-product attention, multi-head, results, significance |
| `slides/99-quiz/` | - | Interactive quiz (see that folder's README for modes) |

The chain is wired end to end: `00/01` → … → `00/04` → `01/01` → … → `01/30` → quiz.
Open `index.html` at the repo root to start from the beginning.

---

## Deck 0 - Before the Transformer

This deck exists because the paper's two opening arguments - sequential
computation and path length - are *different problems* and most explanations
merge them. Keep them apart and the rest of the session is much easier to follow.

### 0.1 - One word at a time

Establish what an RNN even is before criticising it. Step through the chain and
land the formula: `h_t = f(h_{t-1}, x_t)`.

> Everything the network knows about the sentence so far lives in one vector,
> and it updates that vector one word at a time.

Mention LSTM as the gated fix that made long sentences workable - and that it
changed how well the state survives, not the shape of the computation.

### 0.2 - The chain you can't break (problem one: parallelism)

**This is the slider slide. Drag it.** Take n to 60 and let the room look at
sixty little blocks against one bar.

> The recurrent model cannot start token 40 until token 39 has finished. Self-
> attention pays *more* total arithmetic - n²·d against n·d² - but it can spend
> it all at the same time. More work, less waiting.

Ask: *"So is the Transformer doing less computation?"* Most people say yes. It
is doing more. It just does not have to queue.

### 0.3 - How far must the signal travel (problem two: path length)

The default pair is "keys … were" - a subject–verb agreement stretched across
nine words. Click a few other pairs, including an adjacent one, so the room sees
the RNN number track the distance while attention stays at 1.

> This is a *separate* argument from parallelism. Even if RNNs were infinitely
> fast, information from word 2 would still have to survive nine transformations
> to reach word 11.

### 0.4 - Attention already existed

**The most important slide in the session.** Step through it slowly.

> Attention was not invented in this paper. Bahdanau, Cho and Bengio published
> it in 2014, and by 2017 it was standard. Two of the three problems were
> already solved. The Transformer's contribution is the third row - and it gets
> there by deleting the RNN rather than improving it.

Then read the title as what it actually is: a claim about **sufficiency**. Ask
the room to write down whether they think it holds, and tell them you will vote
at the end. **Actually run that vote** - it is the spine of the critique
discussion later.

---

## Before presenting: three important qualifications


1. Slide 1 is a simplified **pre-Transformer encoder–decoder baseline**. The
   original Transformer does not compress the source into one fixed meaning
   vector; its decoder cross-attends to the sequence of encoder outputs.
   *(Slide 1's on-screen copy now says this explicitly - it is framed as the
   bottleneck attention removed, not as how the Transformer works. You no
   longer have to correct the slide verbally, but do land the point.)*
2. Slides 12–17 use a teaching shortcut where Q and K behave like normalized
   copies of the same vectors. In the actual Transformer, Q, K, and V use
   different learned projections, so the score matrix need not be symmetric
   and self-scores are not fixed at 1.
3. Slide 17 illustrates scaling with `d_k = 512`. In the paper's base model,
   eight heads split the 512-dimensional model representation, so each head has
   `d_k = 64` and divides its scores by `sqrt(64) = 8`. Describe 512 as the
   deck's temporary single-head illustration, not the paper's per-head value.

The deck explains one scaled dot-product attention operation (slides 8–22) and
then multi-head attention (slides 23–28), which is what slides 9 and 10 promise.
**Masked decoder attention is introduced on slide 19; encoder–decoder
cross-attention is still not in the deck** - run that off Figure 1 in the paper
PDF rather than skipping it.

Slide 23 also resolves qualification 3 below: it is where `d_k = 64` is
established, so treat slide 17's 512 as the single-head illustration and let
slide 23 correct it.

## Slide 1 - The encoder–decoder model

**Main idea:** Translation requires understanding a whole sentence and then
rebuilding it in a different order.

**What to say:**

> Translation is not word-for-word replacement. The model has to identify who
> did what to whom, then generate that meaning using the grammar and word order
> of the target language. This picture is a simplified older encoder–decoder
> baseline: an encoder reads the input, creates a numerical summary, and a
> decoder generates the output.

Click through the six steps slowly. On the final step, point out the crossing
English–Japanese alignment lines. Say that articles may disappear, particles
may be introduced, and important words may move.

**Qualification:**

> This single meaning vector is useful historical intuition. Later we will see
> that attention lets the Transformer preserve and retrieve information from
> individual token representations instead of relying on only one bottleneck.

**Transition:** “So what does it mean to represent words or meaning with
numbers?”

## Slide 2 - Turning meaning into numbers

**Main idea:** A word can be represented as a list of learned numbers called a
vector.

**What to say:**

> Each word is assigned a position in a high-dimensional numerical space.
> Words used in similar contexts often end up with related vectors. The screen
> shows only two dimensions so that we can draw the idea; real representations
> use hundreds of dimensions.

Click `cat`, `dog`, and a geographically related word. Then show the
Japan–Tokyo and France–Paris analogy to explain that vector directions can
encode relationships.

**Qualification:** Word2vec is background intuition. The Transformer in this
paper learns its own embedding matrix during translation training; it does not
depend on pretrained word2vec vectors.

**Transition:** “But a starting vector by itself cannot tell us which meaning a
word has in this particular sentence.”

## Slide 3 - Meaning depends on context

**Main idea:** The same starting token can acquire different contextual
representations.

**What to say:**

> Before seeing the sentence, Apple begins from the same learned embedding.
> The surrounding words tell us whether it refers to fruit or a company.
> Attention is the mechanism that lets information from those surrounding
> tokens update Apple's representation.

Start on `Initial vector`, ask the audience where Apple should move in each
sentence, then reveal the fruit and company states.

**Qualification:** The clusters and pulling lines are an analogy. They do not
represent a literal attention head or prove what a model is reasoning about.

**Transition:** “Mathematically, how can one vector be turned into another?”

## Slide 4 - A matrix transforms a vector

**Main idea:** Matrix multiplication can transform one representation into a
different representation.

**What to say:**

> A matrix is a rule for transforming vectors. The same starting point can be
> sent in different directions by different transformations. Here the fruit
> context produces one result and the company context produces another.

Toggle between the two sentences and draw attention to the unchanged input and
changed matrix/output.

**Qualification:** The Transformer does not literally construct the displayed
2-by-2 matrix from these words. This is preparation for the real mechanism:
attention calculates context-dependent weights and uses them to mix Value
vectors.

**Transition:** “Now let us locate the real version of that process inside the
Transformer.”

## Slide 5 - Where attention begins

**Main idea:** Orient the audience inside the full architecture without trying
to explain the whole diagram yet.

**What to say:**

> This is the complete architecture from the paper. Do not try to read every
> arrow yet. We are following one path from the bottom of the encoder upward.
> The first highlighted component is the input embedding.

Keep this slide brief. Its job is orientation, not detailed teaching.

**Transition:** “Let us zoom into that first box and see what actually enters
the model.”

## Slide 6 - From a sentence to 512-dimensional vectors

**Main idea:** Token IDs select learned rows from an embedding matrix.

**What to say:**

> The sentence is first split into BPE subword tokens. Each token has an ID.
> Conceptually, a one-hot row multiplied by the embedding matrix selects one
> learned row. In practice, software simply looks that row up. The output is one
> 512-number vector for every token, so five tokens become a 5-by-512 matrix.

Point horizontally from the token matrix, through the embedding matrix, to H.
Emphasize that the dense one-hot matrix is conceptual and is not created in
real code.

**Paper detail:** In the base model, `d_model = 512`. The paper also scales the
token embeddings by `sqrt(d_model)` before adding positional encoding.

**Transition:** “We now know what each token is, but attention alone still does
not know where each token occurred.”

## Slide 7 - Positional encoding

**Main idea:** Self-attention needs explicit information about token order.

**What to say:**

> Self-attention compares a set of vectors and has no built-in left-to-right
> recurrence. Without position information, the same tokens in different
> orders are indistinguishable to the attention operation. The paper adds a
> position-dependent sinusoidal pattern to every token embedding.

Use the Encoding view to show that different sine and cosine frequencies give
each position a distinctive pattern. Then use Application to compare the word
orders.

> We add position; we do not replace the word embedding. Each input vector now
> carries both token identity and position.

**Transition:** “With token identity and position combined, we have the initial
vectors that enter self-attention.”

## Slide 8 - Starting from the initial vectors

**Say what the "self" in self-attention means - no slide does this.** Q, K and
V are all derived from the *same* sequence. That is the whole content of the
word. Flag now that there is another arrangement, cross-attention, where the
queries come from one sequence and the keys and values from another; it is how
the decoder reads the encoder, and it is not in this deck.

**Main idea:** Establish the exact point before context is mixed in.

**What to say:**

> We are now just before self-attention. Every token has an initial vector, but
> it has not yet gathered information from its neighbours. The red point is the
> same starting Apple vector we saw earlier. The two-dimensional display is
> only a drawable projection of the real 512-dimensional representation.

Mention that the slide temporarily suppresses positional addition, embedding
scaling, and dropout so that the next calculation remains readable.

**Transition:** “These vectors now enter the first attention block.”

## Slide 9 - Where context enters the encoder

**Main idea:** Multi-Head Attention is the first context-mixing component in an
encoder block.

**What to say:**

> The encoder sends every token representation into Multi-Head Attention. This
> is where tokens compare against other tokens and retrieve useful information
> from them. Multi-head means that several attention calculations run in
> parallel, but first we will understand one of them.

**Transition:** “Here is the complete calculation we are about to unpack.”

## Slide 10 - The attention roadmap

**Main idea:** Preview the full scaled dot-product attention equation.

**What to say:**

> One attention operation has four conceptual jobs: create Q, K, and V;
> compare Q with K; normalize those comparison scores; and use the resulting
> weights to mix V. The full operation is this equation. We will learn each
> piece separately and reconnect them at the end.

State the true order clearly:

> In the actual computation it is QK-transpose, divide by square-root d-k,
> softmax, then multiply by V. The deck temporarily teaches the individual
> ideas in a slightly different order before the recap.

**Transition:** “Before doing the matrix arithmetic, let us be precise about
the result we want.”

## Slide 11 - The goal of attention

**Main idea:** Attention should turn the same initial embedding into different
context-aware outputs.

**What to say:**

> Apple starts from the same learned embedding in both sentences. The desired
> output is different because the relevant context is different. Attention
> creates a mixing rule: fruit-related tokens contribute strongly in one
> sentence, while company-related tokens contribute strongly in the other.

Show the Concept map first, then the Concrete example. Point out that the
output is a new vector - not a human-readable label such as “fruit.”

**Transition:** “To decide which tokens should contribute strongly, the model
needs a compatibility score.”

## Slide 12 - Dot-product similarity

**Main idea:** A dot product produces one scalar compatibility score between
two vectors.

**What to say:**

> Multiply matching coordinates and add the products. If normalized vectors
> point in similar directions, the dot product is large. If they are
> perpendicular it is near zero, and if they point in opposite directions it
> can be negative.

Show the word examples, then let someone move an arrow in `Try it yourself`.
Ask the audience to predict whether the score will rise or fall before moving
it.

**Qualification:** In real attention, the dot product measures learned
Query–Key compatibility. It should not always be interpreted as ordinary
semantic similarity between word embeddings.

**Transition:** “The Transformer does not compare the raw input in only one
way. It first creates three learned views.”

## Slide 13 - Query, Key, and Value

**Main idea:** Q and K decide where to retrieve information; V contains the
information that will be retrieved.

**What to say:**

> We begin with H, one row per token. Three learned linear projections create
> Q, K, and V. A Query expresses what a token is looking for. A Key expresses
> how another token can be matched. A Value carries the information that can
> be collected if that match receives weight.

Replay the branching animation. Then emphasize the note at the bottom:

> The picture initially shows Q, K, and V as copies to make the shapes easy to
> follow. In the actual model they are different learned projections: H times
> W-Q, H times W-K, and H times W-V.

**Paper detail:** The base Transformer uses eight heads. Each head projects the
512-dimensional model representation into 64-dimensional Q, K, and V vectors.

**Transition:** “Now every Query must be compared with every Key.”

## Slide 14 - Q times K-transpose

**Main idea:** Matrix multiplication efficiently calculates every Query–Key
dot product.

**What to say:**

> K is transposed so that token vectors become columns. One Q row multiplied by
> one K-transpose column gives one dot product. Repeating that operation creates
> a token-by-token score matrix. Rows mean ‘who is looking’; columns mean ‘who
> is being considered.’

Replay the animation and pause after the first few cells. There is no need to
wait for every cell if time is limited.

**Qualification:** The displayed matrix is a normalized teaching example. In
the actual model Q and K are different projections, so it need not be
symmetric and a token's score with itself is not automatically 1.

**Transition:** “Let us read the matrix we just produced.”

## Slide 15 - The score map

**Main idea:** QK-transpose contains raw compatibility scores, not final
attention weights.

**What to say:**

> Each cell is one Query–Key compatibility score. A high cell means that this
> head has learned a strong match for that pair. At this stage the rows do not
> sum to one, so this is not yet a distribution of attention.

Use the matrix view to identify the Apple–juicy and Apple–laptop teaching
examples, then switch to the 2D intuition.

**Qualification:** These matrices are illustrative and deliberately symmetric.
Real learned attention heads can be asymmetric and need not organize
themselves into clean human-labelled relationships.

**Transition:** “We need to turn each row of raw scores into usable mixing
weights.”

## Slide 16 - Softmax

**Main idea:** Softmax converts one Query row into positive weights that sum to
one.

**What to say:**

> We normalize horizontally, one Query at a time. Exponentiation makes every
> value positive, and division by the row total makes the weights add to one.
> We can now read a row as how that Query distributes 100 percent of its
> attention across the Keys.

Replay one row and narrate the movement from raw score to exponentiated value,
row total, and final weight.

**Qualification:** The actual Transformer scales QK-transpose before applying
softmax. We are isolating softmax here so its job is visible.

**Transition:** “Why is that scaling step necessary?”

## Slide 17 - Scaling before softmax

**Main idea:** Large dot products can make softmax excessively sharp and hard
to train.

**What to say:**

> When the score magnitudes increase, softmax preserves their ranking but
> becomes much more confident. One token can receive almost all the weight.
> As the Query and Key dimension grows, a dot product adds more terms, so its
> typical magnitude grows. Dividing by square-root d-k keeps the scale under
> control and helps gradients remain useful.

Compare the original row, the times-ten row, and the scaled row. Stress that
scaling changes confidence, not the ranking.

**Paper correction to say aloud:**

> This screen uses 512 as a temporary single-head illustration. In the paper's
> base multi-head model, each head has d-k equal to 64, so the actual divisor is
> square-root 64, which is 8.

**Transition:** “We now have every component, so let us reconnect them in the
correct order.”

## Slide 18 - Attention summary

**Main idea:** Connect architecture, matrix shapes, and equation as three views
of the same operation.

**What to say while stepping forward:**

1. “Project H into Q, K, and V.”
2. “Compare every Query with every Key to form QK-transpose.”
3. “Divide every score by square-root d-k.”
4. “Apply softmax across each row to obtain attention weights.”
5. “Use those weights to mix the Value vectors.”

Finish with:

> Q and K determine where information should come from. V determines what
> information is carried. The last multiplication performs the actual context
> update.

**Transition:** “The last step is often the least intuitive, so we will zoom
into it.”

## Slide 19 - Attention weights times V

**Main idea:** Each output token becomes a weighted mixture of all Value rows.

**What to say:**

> Choose one row of the attention-weight matrix. That row belongs to one output
> token and says how strongly to collect every source Value row. Multiplying
> that weight row by each column of V produces the new output vector one
> dimension at a time. The shape returns from 5-by-5 times 5-by-512 to
> 5-by-512.

Use the trace to calculate the first output cell. Unless the audience wants the
full arithmetic, move quickly to the final trace page rather than narrating all
five dimensions.

> We repeat the same row-by-column operation for every output token. Each output
> row now contains a mixture of information routed from the other tokens.

**Transition:** “Here is that same calculation expressed at the whole-vector
level instead of cell by cell.”

## Slide 20 - Direct vector mixing

**Main idea:** One scalar attention weight multiplies an entire Value vector;
the weighted Value vectors are then added.

**What to say:**

> Focus only on Apple's attention row. The weight for I multiplies the entire
> Value vector for I, the weight for ate multiplies the entire Value vector for
> ate, and so on. Once those weighted vectors are added, the result is Apple's
> new contextualized vector.

Replay the construction, then click `Next: factor rows`. Emphasize:

> This is not an extra operation after slide 19. It is the same matrix
> multiplication viewed in a more intuitive vector form.

Conclude the current deck with:

> One attention head has now routed information between all tokens. Multi-Head
> Attention repeats this with several different learned Q, K, and V projections,
> concatenates the head outputs, and projects them back into the model
> dimension.

## Slide 23 - Introducing multi-head attention

**Main idea:** Everything so far was one head. Multi-head attention repeats the
same operation through several learned projections, then combines the results.

**What to say:**

> Every step we just walked through - Q, K, V, the score matrix, the scaling,
> the softmax, the weighted sum - that was *one* attention head. The paper runs
> eight. Each head gets its own learned W-Q, W-K and W-V, each projecting the
> 512 dimensions down to 64. Same sentence, eight different questions asked of
> it.

Use slide 24's five-change summary to establish the complete pipeline. Slides
25–28 then unpack projection, per-head attention, concatenation, and W^O.

**Say the paper's actual reason for multi-head**, because it is better than the
usual folk version:

> One head has to blend everything into a single weighted average, and an
> average washes out distinctions. Section 3.2.2 puts it as "jointly attend to
> information from different representation subspaces at different positions.
> With a single attention head, averaging inhibits this."

**Next step:** slides 23–28 use the existing detailed multi-head walkthrough:
the five conceptual changes, branching into learned projections, per-head
attention, concatenation, and the output projection. Slide 28 then goes to the
quiz in `slides/99-quiz/`.

## Suggested timing

- Deck 0 (before the Transformer), 4 slides: 12–15 minutes
- Slides 1–4: 8–10 minutes
- Slides 5–10: 8–10 minutes
- Slides 11–18: 15–20 minutes
- Slides 19–22: 8–12 minutes
- Slides 23–28 (multi-head): 10–15 minutes
- Questions during the section: 5 minutes

Total: roughly 70–90 minutes across both decks. For a shorter path, skip slide 4, shorten the
dragging activity on slide 12, use slide 18 as the main mathematical recap, and
show only the first calculation on slide 20. Slide 21 is optional if the
audience already understands the weighted sum. Slide 23 is **not** optional  - 
slides 9 and 10 promise multi-head attention, so cutting it leaves the deck
with a loose end the room will notice.
