# Web Explorers

Atividade de exploração informática em formato de fases.

## Estrutura

```text
web-explorers/
├── index.html
├── index3.html                 # compatibilidade: redireciona para a fase 3
├── index_final.html            # compatibilidade: redireciona para a fase final
├── stages/
│   ├── 03-water.html
│   └── 04-final-boss.html
└── assets/
    ├── audio/
    ├── css/
    ├── images/
    │   ├── characters/
    │   ├── ui/
    │   └── worlds/
    └── js/
```

## Convenções

- `index.html` continua sendo a entrada pública da atividade.
- As fases adicionais ficam em `stages/`.
- Imagens, áudio, CSS e JavaScript ficam em `assets/`.
- Nomes de arquivos usam minúsculas e hífens.
- `index3.html` e `index_final.html` permanecem como redirecionamentos para não quebrar links antigos.

A fase 2 será adicionada posteriormente ao Submundo.
