# Web Explorers

Atividade de exploração informática em formato de fases.

## Estrutura

```text
web-explorers/
├── index.html
├── index2.html
├── index3.html                 # compatibilidade: redireciona para a fase 3
├── index_final.html            # compatibilidade: redireciona para o Final Boss
├── stages/
│   ├── 03-water.html
│   ├── 04-ghost-house.html
│   ├── 04-final-boss.html      # compatibilidade: redireciona para a fase 5
│   └── 05-final-boss.html
└── assets/
    ├── audio/
    ├── css/
    ├── images/
    │   ├── characters/
    │   ├── ui/
    │   └── worlds/
    └── js/
```

## Progressão atual

- Mundo 1: links e download.
- Mundo 2 — Submundo: seleção, edição de texto, copiar, recortar, colar, desfazer/refazer e Enter.
- Mundo 3 — Fase da Água: Shift, acentuação e pontuação.
- Mundo 4 — Casa Fantasma: Downloads, pastas, copiar/mover arquivos e alternar entre janelas.
- Mundo 5 — Final Boss: reservado para extração de ZIP e renomeação de arquivos.

## Convenções

- `index.html` continua sendo a entrada pública da atividade.
- As fases adicionais ficam em `stages/`.
- Imagens, áudio, CSS e JavaScript ficam em `assets/`.
- Nomes de arquivos usam minúsculas e hífens.
- URLs antigas permanecem como redirecionamentos quando uma fase muda de endereço.
