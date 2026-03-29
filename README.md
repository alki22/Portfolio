# Portfolio — Persona 3 Reload Inspired Design

A personal portfolio website restyled after the pause menu UI/UX of **Persona 3 Reload**, built on the Hyperspace template by HTML5 UP.

## Design Overview

The visual identity draws from Persona 3 Reload's bold, high-contrast pause menu — a mix of sharp geometric elements, vibrant color accents, and fluid motion that balances style with readability.

### Color Palette
- **Primary blue gradient** background inspired by P3R's deep-blue UI panels
- **Cyan (#51eefc)** accent highlights on hover states, active navigation, and subpage background text
- **Red (#e33)** used for triangular markers and active navigation underlines, echoing P3R's signature red motifs
- **White sidebar** with black typography, contrasting the blue content area

### Sidebar (Main Page)
- Diagonal right edge via CSS `clip-path`, breaking the rigid rectangular grid
- Navigation items rotated at irregular angles with red triangle markers and underline reveals on active state
- Large vertical background text ("TAKE YOUR TIME") in the sidebar margin, styled with `writing-mode: vertical-lr`

### Animations & Particles
- **Canvas particle system**: Confetti (diamonds, triangles, squares) and translucent bubbles float across the page using `requestAnimationFrame`, with weighted random color selection favoring the P3R palette
- **Caustic light flares**: Subtle drifting light spots that simulate underwater caustic reflections
- **Underwater text refraction**: Subpage side titles ("ACADEMIA", "INDUSTRIA", "PERSONA") are animated per-letter with layered sine waves at different frequencies — simulating the jitter and distortion of text seen through a water surface from above
- **Wave button**: "Explore" buttons on spotlight sections feature an animated wave-line and rising fill on hover

### Page Transitions
- **SVG wave transitions** between pages using animated sinusoidal paths in three directional variants:
  - **Bottom-up**: main page to subpage
  - **Top-down**: subpage back to main page
  - **Horizontal** (left-to-right / right-to-left): between subpages, direction based on navigation order
- New page content slides in alongside the receding wave with a gradient blend for seamless continuity
- Transition direction passed between pages via `sessionStorage`
- Back/forward browser navigation cleans up stuck overlays via `pageshow` event

### Scroll Behavior
- **Desktop**: `scroll-snap-type: y mandatory` on the main page for full-section snapping
- **Mobile**: Full-screen sections with scroll-snap at the 736px breakpoint
- Spotlight content activation via `IntersectionObserver` fallback when Scrollex doesn't trigger under snap scrolling

### Subpages
- Semi-transparent header bar with rotated nav items, red triangle markers, and active underlines
- Large fixed vertical side text with underwater refraction animation
- Transparent footer to let the side text and particle effects show through

### Responsive Design
- Sidebar collapses to a top header bar at ≤1280px
- Full P3R particle effects scale down gracefully on mobile
- Subpage side text reduces in size and opacity for readability on small screens
- `prefers-reduced-motion` respected — all animations disabled when set

## Credits

**Original Template:**
Hyperspace by HTML5 UP
html5up.net | @ajlkn
Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)

**Demo Images:**
Unsplash (unsplash.com)

**Icons:**
Font Awesome (fontawesome.io)

**Libraries:**
- jQuery (jquery.com)
- Scrollex (github.com/ajlkn/jquery.scrollex)
- Responsive Tools (github.com/ajlkn/responsive-tools)
