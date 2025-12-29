# Frontend Design Reference & Learning Guide
## Enterprise Project Analysis & Management Self-Learning System

This document provides visual references, component recommendations, and technical learning paths based on the macOS Big Sur / iOS 17 design language implemented in the code.

---

### 1. Visual References (Search Keywords)

Use these keywords on **Dribbble**, **Pinterest**, or **Behance** to find specific visual inspiration:

*   **Login/Portal:**
    *   *Keywords:* "Glassmorphism Login Screen", "Abstract 3D Blob Background", "Clean Minimalist Sign In", "iOS 17 Lock Screen UI".
*   **Dashboard:**
    *   *Keywords:* "Bento Grid Layout UI", "Fitness Rings Dashboard", "Apple Health UI Concept", "Data Visualization Cards".
*   **Learning Hub:**
    *   *Keywords:* "Streaming Service UI", "Course Card Hover Effect", "iOS Segmented Control UI", "Clean Grid Layout".
*   **Classroom:**
    *   *Keywords:* "Immersive Video Player UI", "Collapsible Sidebar UX", "Focus Mode Education App", "Dark Mode Video Interface".
*   **Profile:**
    *   *Keywords:* "Apple Wallet UI", "Stacked Cards Interaction", "Skeuomorphic Certificate Design", "Transparent Radar Chart".

---

### 2. Recommended Tech Stack (Vue 3 + Tailwind)

Since you asked for Vue 3 specific recommendations (even though the code provided is React), here are the best matches for this design style:

1.  **Headless UI (Vue) + Tailwind CSS**
    *   *Verdict:* **Best Choice.** It provides the logic (accessibility, keyboard nav) for complex components like Listboxes and Tabs (Segmented Controls) without imposing styles. You style it 100% with Tailwind to match the "Apple" look exactly.
2.  **Radix Vue (or Shadcn-Vue)**
    *   *Verdict:* **Excellent.** Shadcn is React-first but the community port for Vue is robust. It's essentially "copy-paste" code that uses Tailwind. Very easy to customize radius and shadows to match Big Sur.
3.  **PrimeVue (Tailwind Passthrough Mode)**
    *   *Verdict:* Good if you need complex data tables, but might be overkill for a clean "B2C" style app.

**Glassmorphism Generator:**
*   **Tool:** [Glassmorphism.com](https://glassmorphism.com/)
*   **Usage:** Adjust transparency and blur, then copy the CSS `backdrop-filter` and `background` properties into your Tailwind `layer` or custom class.

---

### 3. Key Technical Learning Materials

#### A. High-Performance Glassmorphism (Backdrop Filter)
*   **Concept:** Using `backdrop-filter: blur()` can be CPU intensive.
*   **Optimization:**
    *   Use `will-change: transform` on animated elements behind the glass.
    *   Avoid layering multiple glass elements on top of each other.
    *   **Tailwind:** `backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl`.

#### B. Smooth Charts (Round Corners)
*   **Library:** Chart.js or ECharts.
*   **Technique:**
    *   For **Chart.js**: Set `borderWidth` and `borderRadius` in your dataset config.
    *   For **ECharts**: Use `itemStyle: { borderRadius: [10, 10, 0, 0] }` for bars.
    *   *Note:* The provided React code uses **Recharts**, which supports `cornerRadius` props on RadialBars directly.

#### C. Smooth Page Transitions (Vue 3)
*   **API:** `<Transition>` and `<TransitionGroup>`.
*   **Technique:**
    1.  Wrap your `<router-view>` in a `<Transition name="fade" mode="out-in">`.
    2.  Define CSS:
        ```css
        .fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
        .fade-enter-from, .fade-leave-to { opacity: 0; }
        ```
    3.  For more complex "Folder" or "Slide" animations (like iOS navigation), look into **Vue UseMotion**.

---

### 4. Responsive Strategy (Mobile Adaptation)

*   **Sidebar:** Convert from a left/right column to a **Bottom Sheet (Drawer)** on mobile.
*   **Bento Grid:** Switch from `grid-cols-4` to `grid-cols-1` (stack vertically).
*   **Hover Effects:** Disable `hover:scale` on touch devices to prevent sticky hover states.
*   **Navigation:** Move the Top Navbar to a Bottom Tab Bar (fixed position) for easier thumb reach on mobile.
