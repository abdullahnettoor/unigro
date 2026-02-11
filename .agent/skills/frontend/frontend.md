---
name: avant-garde-ui-architect 
description: Premium frontend skill focused on distinctive aesthetics. Rejects "AI slop" in favor of unique typography, atmospheric depth, and orchestrated motion.**
---
# **Avant-Garde Frontend Architecture**

This skill is designed to create frontends that feel "designed," not "generated." It prioritizes character, high-impact motion, and sophisticated color theory.

## **1\. Aesthetic Guardrails (Anti-AI Slop)**

### **Typography: The Character First Rule**

**Forbidden:** Inter, Roboto, Arial, Open Sans, System-ui.  
**Mandatory Selection:**

* **Display/Headers:** *Syne*, *Clash Display*, *Fraunces*, or *Cabinet Grotesk*. Use tight letter-spacing for headings.  
* **Body:** *Satoshi*, *General Sans*, or *Caladea*.  
* **Code:** *JetBrains Mono* or *Fira Code*.

### **Color & Depth: Beyond the Gradient**

* **Reject:** Generic purple/blue gradients on white backgrounds.  
* **Adopt:** High-contrast "Cultural" palettes. (e.g., "Nordic Noir": Deep charcoals, slate blues, and sharp neon amber accents).  
* **Surface Depth:** Use backdrop-filter: blur(), box-shadow with spread/offset combinations that mimic physical depth, and subtle noise textures.

## **2\. Motion & Interaction**

### **Orchestrated Reveals**

Avoid scattered animations. Use a single "Grand Reveal" on page load:

1. **Container:** Fade in background noise/atmosphere.  
2. **Typography:** Staggered Y-axis slide-up for headers.  
3. **Elements:** Sequential opacity fade for cards.

### **Motion Library Standards**

* Use **Framer Motion** for React.  
* **Springs over Easing:** Use type: "spring" with custom stiffness and damping for a tactile, physical feel.  
* **Micro-interactions:** Add a subtle "magnetic" effect to primary buttons using whileHover.

## **3\. Structural Reusability**

Follow an Atomic Design System using Tailwind CSS and CSS Variables.  
```
:root {  
  /\* Atmosphere \*/  
  \--bg-app: \#050505;  
  \--surface-elevated: \#0f0f12;  
  \--noise-opacity: 0.03;  
    
  /\* Brand \*/  
  \--accent-vivid: \#ff3e00;  
  \--text-primary: \#e4e4e7;  
  \--text-muted: \#71717a;  
    
  /\* Typography \*/  
  \--font-display: 'Clash Display', sans-serif;  
}
```

## **4\. Example: The Atmospheric Component**

```
import { motion } from "framer-motion";

export const HeroCard \= ({ title, subtitle }) \=\> {  
  return (  
    \<motion.div   
      initial={{ opacity: 0, y: 20 }}  
      animate={{ opacity: 1, y: 0 }}  
      transition={{ duration: 0.8, ease: \[0.16, 1, 0.3, 1\] }}  
      className="relative p-10 overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl"  
    \>  
      {/\* Background Pattern Layer \*/}  
      \<div className="absolute inset-0 opacity-10 pointer-events-none bg-\[url('/noise.svg')\]" /\>  
        
      \<h1 className="text-6xl font-display font-bold tracking-tight text-zinc-100"\>  
        {title}  
      \</h1\>  
      \<p className="mt-4 text-zinc-400 font-medium max-w-md"\>  
        {subtitle}  
      \</p\>  
        
      \<motion.button  
        whileHover={{ scale: 1.05, x: 5 }}  
        className="mt-8 flex items-center gap-2 text-accent-vivid uppercase tracking-widest text-sm font-bold"  
      \>  
        Explore Interface \<ArrowRight size={16} /\>  
      \</motion.button\>  
    \</motion.div\>  
  );  
};  
```