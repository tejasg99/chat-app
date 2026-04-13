# Design System Specification: High-End Editorial Chat Experience

## 1. Overview & Creative North Star: "The Architectural Whisper"
This design system moves beyond the "generic SaaS" aesthetic to embrace **Architectural Whisper**—a philosophy that prioritizes structural intentionality, tonal depth, and high-end editorial clarity. 

While the foundation is rooted in a professional, minimal chat application, the execution avoids "boxed-in" layouts. Instead, we utilize high-contrast typography scales and asymmetrical breathing room to create a signature experience. The interface should feel like a physical space: curated, quiet, and premium. We achieve "Modern" not through clutter, but through sophisticated layering and the radical removal of traditional UI scaffolding like dividers and harsh borders.

---

## 2. Colors & Tonal Depth
The color strategy leverages a sophisticated Material Design-inspired palette. We use warm, energetic oranges balanced against a deep, oceanic neutral base.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. 
Boundaries must be defined strictly through background color shifts or tonal transitions. To separate a sidebar from a chat feed, use `surface-container-low` against a `surface` background. The eye should perceive the edge through color change, not a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. Use the `surface-container` tiers to create organic depth:
- **Base Level:** `surface` (The foundation).
- **Secondary Level:** `surface-container-low` (Sidebars or navigation).
- **Interactive Level:** `surface-container-highest` (Hover states or active conversation threads).
- **Floating Level:** `surface-container-lowest` (Used for cards that need to "pop" against a slightly darker background).

### Signature Textures
While the brief calls for no gradients, we achieve "visual soul" through **Glassmorphism**. For floating elements like context menus or header overlays, use semi-transparent surface tokens with a `24px` backdrop blur. This allows the primary brand colors to bleed through softly, softening the edges of the digital workspace.

### Color Palette (Tokens)
- **Primary:** `#9d4300`
- **Primary Container:** `#f97316`
- **Secondary:** `#a73a00`
- **Secondary Container:** `#fd651e`
- **Tertiary:** `#006398`
- **Tertiary Container:** `#00a2f4`
- **Background:** `#f9f9ff`
- **Surface:** `#f9f9ff`
- **Surface Variant:** `#dce2f7`
- **Error:** `#ba1a1a`
- **On Primary:** `#ffffff`
- **On Secondary:** `#ffffff`
- **On Tertiary:** `#ffffff`
- **On Background:** `#141b2b`
- **On Surface:** `#141b2b`
- **On Surface Variant:** `#584237`

---

## 3. Typography: The Editorial Edge
We use a dual-font system to create a high-end, structured hierarchy.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern authority. Use `display-lg` for empty states and `headline-sm` for active chat titles to command attention.
*   **Body & Labels (Inter):** Chosen for its unparalleled legibility at small scales. This handles the "heavy lifting" of the chat bubbles and metadata.

**The Hierarchy Strategy:**
- **Primary Information:** `title-md` (Inter, Medium weight) for contact names.
- **Content:** `body-md` (Inter, Regular) for message bubbles.
- **Metadata:** `label-sm` (Inter, Medium) for timestamps and unread counts, ensuring they feel like intentional annotations rather than afterthoughts.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor layout. In this system, hierarchy is achieved through **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` (White in light mode) card on a `surface-container-low` section. This creates a natural "lift" that mimics fine paper resting on a desk.
*   **Ambient Shadows:** Where floating elements are required (e.g., Modals), use a "Sunken Shadow": 
    *   *Blur:* 40px - 60px.
    *   *Opacity:* 4% - 6%.
    *   *Color:* Use a tinted version of `on-surface` (e.g., `#141B2B` at 5% opacity) to mimic natural light.
*   **The Ghost Border Fallback:** If accessibility requirements demand a container edge, use the `outline-variant` token at **15% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons & Interaction
- **Primary:** Background `primary` (#9D4300), Text `on-primary`. Radius: `full`. No shadow.
- **Secondary:** Background `primary-container` (#F97316), Text `on-primary-container`.
- **States:** On `:hover`, shift the background to `secondary-container` (#FD651E). On `:focus`, apply a 2px outer ring using `outline` with a 4px offset.

### Input Fields
- **Container:** `surface-container-highest`.
- **Border:** None.
- **Focus State:** A bold 2px ring using the `primary` token.
- **Labeling:** Use `label-md` floating above the input, never placeholder text alone.

### Chat Bubbles (The Signature Component)
- **User Message:** `primary` background with `on-primary` text. Radius: `20px` (xl).
- **Recipient Message:** `surface-container-high` background with `on-surface` text. Radius: `20px` (xl).
- **Constraint:** Forbid the use of "tails" on bubbles. Use the `8px` grid to group messages from the same user, increasing the gap to `16px` when the sender changes.

### Unread Badges
- **Style:** Use `secondary` (#A73A00) for the background. Text `on-secondary` using `label-sm` (Bold).
- **Placement:** Positioned with asymmetrical padding (e.g., `4px` top/bottom, `8px` left/right) to feel like a high-end clothing tag.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace White Space:** If a section feels crowded, do not add a border; add 16px of padding.
- **Use Intentional Asymmetry:** Align timestamps to the far right while keeping names to the left to create a wide horizontal "landscape" within list items.
- **Layer Surfaces:** Always ask "can I define this area with a subtle color shift?" before reaching for any other tool.

### Don’t:
- **Don't use Dividers:** Never use a horizontal line to separate chat messages or list items. Use vertical spacing (`spacing-md`) or subtle background hover states.
- **Don't use Pure Black:** Even in Dark Mode, use `surface` (#111827) to maintain tonal depth. Pure `#000000` flattens the UI.
- **Don't Over-shadow:** If a component has a shadow AND a background color shift, it's over-designed. Pick one.
