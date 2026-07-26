# Focus.AI Design System — Visual Generation Styles

Two distinct image generation aesthetics — one per brand. **Never mix them.**

- **Client** → Renaissance drafting (da Vinci, Dürer, celestial maps, cartography)
- **Labs** → Bell Labs / Tufte / RAND Corporation data visualization

---

## Client: Renaissance Visual Style

Inspired by Leonardo da Vinci's technical notebooks, Albrecht Dürer's engravings, and Renaissance-era scientific illustration. Connects to precision, clarity, the intersection of art and science.

### The Five Client Styles

#### 1. Da Vinci Diagram — DEFAULT

**Use for:** System architecture, data flows, technical explainers, general brand imagery.

```
[Subject/concept] drawn in the style of Leonardo da Vinci's technical notebooks.
Sepia ink on aged parchment paper. Hand-drawn construction lines, annotations in
italic script along the margins, cross-hatching for shadows. [Specific labels].
Red chalk accent marks on key intersection points. Renaissance engineering drawing
aesthetic, warm brown tones, visible paper grain texture.
```

#### 2. Dürer Engraving

**Use for:** Dense knowledge maps, comprehensive overviews, encyclopedic visuals.

```
[Subject/concept] in the style of Albrecht Dürer's engravings. Extremely fine
crosshatched lines creating rich tonal depth. Woodcut and copper engraving aesthetic.
[Central element] radiates connections to surrounding elements. Meticulous detail,
black ink on off-white paper. Northern Renaissance printmaking style. Dense parallel
hatching lines for shadow. Gothic letterforms for labels.
```

#### 3. Celestial Map

**Use for:** Data architecture layers, hierarchical systems, infrastructure diagrams.

```
[Subject/concept] drawn in the style of Renaissance astronomical charts.
Copernicus and Kepler inspired orbital diagrams. Concentric circles showing
layers of [system/architecture]. Constellation-like connection lines between nodes.
Aged parchment with compass rose. Celestial cartography aesthetic, copper engraving
style. Stars as [endpoints], orbits as [flows/relationships].
```

#### 4. Cartography

**Use for:** Network topology, connection maps, ecosystem visuals, marketplace diagrams.

```
[Subject/concept] in the style of Renaissance cartography and portolan charts.
Network map showing [routes/connections] like trade routes between ports. Compass
roses at intersections. Rhumb lines connecting nodes. Decorative cartouche frame.
Wind heads in corners. Aged vellum texture. Sea monsters in margins representing
[obstacles]. Warm sepia and blue ink.
```

#### 5. Distillation Machine

**Use for:** Process flows, transformation pipelines, ETL, the "distill the signal" narrative.

```
Leonardo da Vinci style technical drawing of a machine that [transforms/processes
concept]. Intricate mechanical apparatus with gears, tubes, and chambers.
[Raw input] enters from the left as chaotic ink splatters and exits on the right
as clean organized lines. Pen and ink on aged paper with red chalk annotations.
Cross-hatching shading. Dimension lines and measurement marks. Renaissance
engineering patent drawing aesthetic.
```

### Client Style Selection

| Use Case                         | Style                                    |
| -------------------------------- | ---------------------------------------- |
| Default / general brand          | Da Vinci Diagram                         |
| System architecture              | Da Vinci Diagram                         |
| Data flow / pipeline             | Da Vinci Diagram or Distillation Machine |
| Knowledge domain overview        | Dürer Engraving                          |
| Layered architecture             | Celestial Map                            |
| Network / connections            | Cartography                              |
| Transformation / ETL             | Distillation Machine                     |
| "Distill the signal" brand story | Distillation Machine                     |
| Hero image / landing page        | Da Vinci Diagram or Celestial Map        |
| Report cover                     | Da Vinci Diagram or Dürer Engraving      |

### Client Visual Principles

- Warm parchment/paper backgrounds — never pure white or modern gradients
- Sepia/brown ink tones with red chalk or sanguine accents
- Hand-drawn quality — construction lines, cross-hatching, visible draftsmanship
- Annotation and labeling — marginalia, dimension marks
- No photography, no modern UI, no flat design

---

## Labs: Bell Labs / Tufte Visual Style

Clean data visualization, information-dense diagrams, retro-technical illustration. Maximum information, minimum ink.

### The Four Labs Styles

#### 1. Tufte Data Visualization — DEFAULT

**Use for:** Charts, data comparisons, statistical displays, analytical graphics.

```
[Subject/data] presented as a clean Edward Tufte style data visualization.
Minimal ink-to-data ratio. No chartjunk, no grid lines, no 3D effects. Small
multiples where appropriate. Thin precise lines, subtle gray tones, data labels
directly on the graphic (no legends). Warm off-white background (#f3f2ea).
Serif annotations. High data density, maximum information with minimum ink.
Print-quality statistical graphic.
```

#### 2. Bell Labs Technical Diagram

**Use for:** System architecture, network diagrams, technical documentation.

```
[Subject/system] as a 1970s Bell Labs technical diagram. Clean black ink on
white paper. Simple geometric shapes — rectangles, circles, arrows — connected
by precise straight lines. Monospaced Courier labels. No decorative elements.
Blueprint precision with a human touch. Dot matrix reproduction quality.
Slight warm paper tint. Bell Telephone Laboratories technical memoranda style.
```

#### 3. RAND Report Infographic

**Use for:** Policy diagrams, comparison matrices, decision frameworks, strategic overviews.

```
[Subject/analysis] as a RAND Corporation research report infographic from the
1960s. Clean modernist graphic design. Sans-serif type in a strict grid. Flat
color blocks in muted tones — navy blue (#0055aa), warm gray, off-white, with
red (#d93025) for emphasis. No gradients, no shadows. Information-dense but
highly organized. Government report aesthetic. Photostat print quality.
```

#### 4. Retro Computing / Terminal

**Use for:** Code-related visuals, developer tools, CLI screenshots. **Use sparingly.**

```
[Subject] displayed on a vintage computer terminal. Phosphor green text (#00ff41)
on a dark CRT screen. Visible scanlines and slight screen curvature. Monospaced
font only. Simple ASCII-art diagrams. Subtle screen glow. 1980s terminal aesthetic.
No modern UI chrome. Green-on-black or amber-on-black only.
```

### Labs Style Selection

| Use Case                       | Style                       |
| ------------------------------ | --------------------------- |
| Default / general Labs imagery | Tufte Data Visualization    |
| Data analysis or comparison    | Tufte                       |
| System architecture            | Bell Labs Technical Diagram |
| Research report figure         | Tufte or Bell Labs          |
| Strategic framework            | RAND Report Infographic     |
| Decision matrix                | RAND Report Infographic     |
| Conference analysis            | Tufte or RAND               |
| Developer tool / CLI           | Retro Computing / Terminal  |
| Blog post header               | Tufte or Bell Labs          |
| Report cover                   | RAND Report Infographic     |
| Open source project            | Bell Labs Technical Diagram |

### Labs Visual Principles

- Maximum information, minimum ink (Tufte's core principle)
- No chartjunk — no 3D effects, no gradients, no decoration
- Warm paper tones — off-white backgrounds
- Monospaced labels — Courier Prime for all annotations
- Restrained color — Rand-Blue and Alert-Red only, with grays
- Print quality — should look good photocopied
- **No Renaissance, no hand-drawn, no parchment** — that's Client territory

---

## Never Do

- Mix Renaissance imagery with Labs content
- Mix Bell Labs/Tufte imagery with Client content
- Use photography in place of generated illustrations
- Use modern flat-design illustrations (too generic)
- Use AI-generated photorealistic imagery (uncanny, off-brand)
