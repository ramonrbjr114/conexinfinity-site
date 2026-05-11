# Conexinfinity — Intelligence OS

Site institucional da **Conexinfinity** (software house · Aracaju · SE) com identidade visual cinematográfica, modelo 3D próprio gerado no Blender, modo claro/escuro e animações suaves.

**Tagline:** *Sua empresa não precisa crescer no improviso. Precisa de um sistema.*

---

## 🌐 Stack

- **HTML5 + CSS3 + JS** vanilla (zero build step, zero framework)
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll
- **[GSAP](https://gsap.com/) + ScrollTrigger** — reveal animations + counters
- **[Google model-viewer](https://modelviewer.dev/)** — renderiza GLB direto no HTML
- **Blender 5.x** — modelagem da marca 3D
- **Google Fonts** — Space Grotesk (display) + JetBrains Mono (mono/UI)

Todas as bibliotecas vêm de CDN. Sem `package.json`, sem `node_modules`. Basta servir os arquivos.

---

## 📁 Estrutura

```
Site/
├── index.html        ← Página inicial (hero com marca 3D)
├── servicos.html     ← Catálogo de 8 módulos + planos
├── sobre.html        ← Manifesto, time, trajetória
├── blog.html         ← 11 artigos
├── contato.html      ← Formulário + canais
│
├── style.css         ← Sistema de design completo (dark + light)
├── script.js         ← Lenis, GSAP, transições, toggle de tema
│
├── favicon.svg       ← Símbolo da marca recolorido
├── brand-3d.glb      ← Marca 3D (~234 KB, gerada pelo Blender)
├── conex.blend       ← Arquivo source do Blender
├── blender_brand.py  ← Script que gera o GLB do zero
│
├── README.md         ← Este arquivo
└── logo/conexInfinity/ ← Assets oficiais da marca
    ├── Conex Infinity.svg              (logo completo)
    ├── Conex Infinity - Simbolo.svg    (símbolo isolado)
    └── ... (variantes raster e PSD)
```

---

## 🎨 Design system

### Paleta (CSS variables em `:root` e `[data-theme="light"]`)

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg` | `#050810` | `#f4f6fb` | Fundo base |
| `--text` | `#ffffff` | `#050810` | Texto primário |
| `--cyan` | `#00e5ff` | `#0a8aa3` | Accent primário no dark |
| `--blue` | `#4d5cff` | `#1520BF` | Accent primário no light, secundário no dark |
| `--blue-deep` | `#1520BF` | `#0c1480` | Brand puro / hover |
| `--line` | `rgba(0,229,255,.14)` | `rgba(21,32,191,.15)` | Bordas HUD |

### Estratégia de cor

**Dark mode** (default — "Intelligence OS"): cyan elétrico domina, vibe sci-fi cinematográfica.

**Light mode** ("Software house premium"): azul-marca puro `#1520BF` vira herói, cyan vira secundário escurecido. Mesma marca, duas expressões.

### Tipografia

- **Display:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) 400/500/600/700
- **Mono:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) 400/500 — labels, eyebrow, terminal, status bar

### Componentes-chave (classes utilitárias)

- `.hud` — painel com cantos diagonais nos 4 vértices
- `.module` — card de serviço com glow radial seguindo cursor
- `.plan` — card de plano (variante `.featured` com badge "RECOMENDADO")
- `.metric` / `.metrics-strip` — display de números animados
- `.terminal` — bloco estilo console com prefixo `›`
- `.scanline` — barra horizontal animada
- `.statusbar` — barra fixa do topo com relógio ao vivo
- `.theme-toggle` — botão de alternar tema (lua/sol)

---

## 🏷️ Identidade da marca

### Símbolo
SVG inline definido como `<symbol id="brand-symbol">` no topo de cada página. **Infinito assimétrico** (fita preta) com **um único ponto azul** posicionado no laço esquerdo.

**Conceito:** o ponto azul representa o *cliente no centro do sistema infinito*.

### Marca 3D
Versão tridimensional da fita do infinito, modelada no Blender:
- Fita: material **preto metálico polido** (Metallic 0.95, Roughness 0.18, Clearcoat 0.7)
- Ponto: esfera **azul-marca emissiva** (`#1520BF` + emission `#4D5CFF` strength 3.5)
- Iluminação: 3 area lights (cyan key + azul rim + fill)
- Animação: flutuação vertical + wobble lateral em loop de 10s (240 frames @ 24fps)
- Exportada como `.glb` com Y-up, animações embedded

### Wordmark
Bicolor oficial: **`Conex`** branco/preto bold + **`infinity`** azul `#1520BF` light.

---

## 📄 Páginas

### `/index.html` — Início
1. Hero com **marca 3D flutuando** (model-viewer carregando GLB) + headline tese + lead + CTAs
2. Diagnóstico — 6 dores viscerais em grid `[01]…[06]`
3. Módulos da Solução — 6 cards (`MOD-01 ADMIN` … `MOD-06 CLOUD`)
4. Métricas strip — contadores animados
5. Protocolo de Ativação — 4 etapas
6. Planos — Basic / **Master** (featured) / Premium
7. CTA Final em painel HUD
8. Footer

### `/servicos.html` — Serviços
- Hero interno
- Catálogo de **8 módulos**
- Pricing callout
- Planos completos

### `/sobre.html` — Sobre
- Hero institucional
- Manifesto da marca
- **4 princípios operacionais**
- Métricas strip
- **2 cofundadores:** Larissa Silva (Co-CEO · Comercial) e Ramon Rodrigues (Co-CEO · CTO)
- Trajetória 2024 → 2026 → Próximo capítulo

### `/blog.html` — Blog
- Hero
- 1 card destaque + 10 posts em grid
- Tags por categoria

### `/contato.html` — Contato
- Hero
- Formulário HUD + 4 canais
- Box de horário & SLA
- Checklist de preparo para o diagnóstico

---

## ⚡ Animações e interações (`script.js`)

| Feature | Implementação |
|---|---|
| **Theme toggle** | Event delegation no document, persiste em `localStorage.conex_theme`, smooth transition de 350ms |
| **Loader** | Fade out 700ms na entrada (180ms se vier de navegação interna via `sessionStorage`) |
| **Live clock** | `setInterval(1s)` atualiza relógio no statusbar e footer |
| **Smooth scroll** | Lenis com duração 1.15s + easing customizado |
| **Anchor scroll** | Links `#xxx` usam Lenis com offset de -60px |
| **Reveal on scroll** | `.reveal` e `.reveal-stagger` via `IntersectionObserver` |
| **Counters** | `data-counter="N"` anima 0→N em 1.6s com GSAP |
| **Cursor glow** | Div radial seguindo mouse globalmente |
| **Module hover** | `--mx`/`--my` CSS vars seguem o cursor dentro do card |
| **Background parallax** | `bg-grid` translada com scrub no scroll |
| **Page transitions** | Click em link interno dispara cover slide-up (520ms) antes de navegar |
| **Form submit** | UI simulada: "Enviando..." → "Mensagem enviada ✓" |

---

## 🛠️ Pipeline da marca 3D

O modelo `brand-3d.glb` é gerado pelo `blender_brand.py` (script Python para Blender 5.x). Pipeline:

1. **Importa** `logo/conexInfinity/Conex Infinity - Simbolo.svg` no Blender
2. **Auto-escala** pra 3.5 unidades de largura, centraliza
3. **Identifica fita vs ponto** por bounding box
4. **Converte fita** curve → mesh + Solidify (espessura) + Bevel modifier (cantos)
5. **Substitui o círculo** importado por **UV Sphere** com material emissivo
6. **Aplica materiais** (Principled BSDF: preto metálico polido + azul emissivo)
7. **Rotaciona BrandRoot 90° X** pra ficar em pé (face-on à câmera)
8. **Anima** flutuação Z + wobble Y leve (loop 240 frames)
9. **Adiciona** 3 area lights (cyan key + azul rim + fill) + câmera
10. **Exporta GLB** com `export_animations=True` + Draco compression

### Como regenerar o GLB

1. Abre `conex.blend` no Blender 5.x (ou `File → New → General`)
2. Aba **Scripting**, no Text Editor: **Open** → seleciona `blender_brand.py`
3. Clica **▶ Run Script** (ou `Alt+P`)
4. ~10-20s depois: `brand-3d.glb` atualizado na pasta raiz

---

## 🚀 Como rodar localmente

### Servidor HTTP simples (necessário pro model-viewer carregar o `.glb`)

```bash
cd Site
python -m http.server 8000
```

Acesse [http://localhost:8000](http://localhost:8000)

> ⚠️ **Por que não abrir o HTML direto via `file://`?**
> O `<model-viewer>` usa `fetch()` pra carregar o GLB, e navegadores bloqueiam fetches em `file://` por segurança CORS. O servidor local resolve.

### Alternativas

```bash
npx serve .        # via Node
php -S localhost:8000   # via PHP
```

Ou use a extensão **Live Server** no VS Code.

---

## 🌍 Deploy

### Vercel (recomendado — grátis)

1. Cria conta em [vercel.com](https://vercel.com)
2. **Add New Project → Deploy without Git** → drag-and-drop da pasta `Site/`
3. ~30 segundos pra ter URL pública
4. **Settings → Domains** → adiciona `conexinfinity.com`
5. Atualiza DNS no registrador apontando pro Vercel

### Netlify

Equivalente ao Vercel. Drag & drop ou conexão GitHub.

### GitHub Pages

```bash
# Após push para o repositório
# Settings → Pages → Source: main branch → Save
```

URL: `https://[user].github.io/[repo]/`

---

## 📝 Dados reais a preencher

- [ ] Números das métricas (atualmente placeholders: 48 sistemas, 32 operações ativas, 94% retenção)
- [ ] Logos / depoimentos de clientes reais (seção de prova social ainda não existe)
- [ ] Foto real dos cofundadores (avatares com iniciais "LS" e "RR")
- [ ] Conteúdo real dos posts do blog (títulos são reais, descrições são placeholder)
- [ ] Links reais de WhatsApp / Instagram / LinkedIn
- [ ] Backend real do formulário de contato (atualmente só simula envio)
- [ ] Página 404 customizada
- [ ] OG image / Twitter card por página

---

## 🎬 Histórico das decisões importantes

| Decisão | Por quê |
|---|---|
| HTML/CSS/JS vanilla (sem React) | Marketing site não precisa de framework. Build step adiciona complexidade sem ganho |
| Dark theme como default | Vibe "Intelligence OS" é a expressão central da marca |
| Light theme como alternativa | Permite contexto B2B mais formal sem abrir mão da identidade |
| GLB do Blender ao invés de Spline | Sem watermark, sem assinatura mensal, controle total dos materiais |
| `model-viewer` ao invés de Three.js custom | API declarativa, ~250KB vs ~600KB do Three, suporta animações embedded |
| Lenis + GSAP ao invés de só CSS | Necessário pra smooth scroll e reveal sequences cinematográficos |
| Tipografia mista (Display + Mono) | Mono em labels reforça a tese "OS" / sistema operacional |
| Localização Aracaju · SE | Reflete origem real da empresa (fundada 2024) |
| Co-CEOs nominados (Larissa + Ramon) | Transparência institucional + diferencial comercial |

---

## 🎨 Inspirações de design

- **[Chronothreads](https://chronothreads.webflow.io/)** — mood cinematográfico, HUD, terminal
- **[Three Dimensions (Webflow)](https://threedimensions.webflow.io/)** — estrutura modular, marca 3D bleed-out
- **[Spline Community](https://spline.design/community)** — referências de marca 3D emissiva
- **[Webflow Interactive Sites](https://webflow.com/blog/interactive-website)** — princípios de scrollytelling

---

*Documentação atualizada em 2026-05-11.*
*Conexinfinity — Inteligência Digital · Aracaju · SE.*
