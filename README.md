# Web Explorers

Atividade de exploração informática em formato de fases.

## Estrutura

```text
web-explorers/
├── index.html                    # entrada pública; redireciona para o Mundo 1
├── index2.html                   # compatibilidade; redireciona para o Mundo 2
├── index3.html                   # compatibilidade; redireciona para o Mundo 3
├── index_final.html              # compatibilidade; redireciona para o Final Boss
├── 02-entrar-no-submundo.html     # material de atividade e asset da release submundo
├── stages/
│   ├── 01-overworld.html          # página canônica do Mundo 1
│   ├── 02-submundo.html           # página canônica do Mundo 2
│   ├── 03-water.html
│   ├── 04-ghost-house.html
│   ├── 04-final-boss.html         # compatibilidade; redireciona para a página seguinte
│   ├── 05-final-boss.html
│   └── game-complete.html
└── assets/
    ├── audio/
    ├── css/
    ├── images/
    │   ├── characters/
    │   ├── ui/
    │   └── worlds/
    └── js/
```

## Páginas canônicas e compatibilidade

As páginas principais dos mundos ficam em `stages/`:

- Mundo 1 — Overworld: `stages/01-overworld.html`.
- Mundo 2 — Submundo: `stages/02-submundo.html`.
- Mundo 3 — Fase da Água: `stages/03-water.html`.
- Mundo 4 — Casa Fantasma: `stages/04-ghost-house.html`.
- Final Boss: `stages/05-final-boss.html`.
- Conclusão: `stages/game-complete.html`.

Os caminhos antigos continuam disponíveis como páginas de redirecionamento HTML, com atualização automática e um link acessível para navegação manual:

| Caminho antigo | Destino canônico |
| --- | --- |
| `index.html` | `stages/01-overworld.html` |
| `index2.html` | `stages/02-submundo.html` |
| `index3.html` | `stages/03-water.html` |
| `index_final.html` | `stages/05-final-boss.html` |
| `stages/04-final-boss.html` | `stages/05-final-boss.html` |

O GitHub Pages continua usando `index.html` como entrada pública. `02-entrar-no-submundo.html` permanece na raiz porque é material usado na atividade de download e também é publicado como asset da release `submundo`.

## Progressão atual

- Mundo 1: links e download.
- Mundo 2 — Submundo: seleção, edição de texto, copiar, recortar, colar, desfazer/refazer e Enter.
- Mundo 3 — Fase da Água: Shift, acentuação e pontuação.
- Mundo 4 — Casa Fantasma: Downloads, pastas, copiar/mover arquivos e alternar entre janelas.
- Mundo 5 — Final Boss: extração de ZIP e renomeação de arquivos.
- Conclusão: página de parabéns, tema de encerramento e recompensa final.

## Organização de futuras atividades

- Coloque cada nova página principal de mundo em `stages/`, usando um número de sequência e um nome descritivo em minúsculas com hífens, como `06-nome-do-mundo.html`.
- Mantenha imagens, áudio, CSS e JavaScript compartilhados em `assets/`, organizados por tipo. Ao referenciar esses arquivos de uma página em `stages/`, use caminhos relativos a partir de `stages/` (por exemplo, `../assets/images/...`).
- Se um endereço antigo precisar continuar funcionando, mantenha-o como uma página HTML pequena com redirecionamento automático e link manual para o caminho canônico.
- Preserve materiais de atividade e assets publicados em releases nos caminhos que já são usados por essas atividades e releases.
- Defina o conteúdo pedagógico de cada atividade quando ela for criada; esta estrutura não determina exercícios ou regras.
