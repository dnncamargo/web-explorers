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
├── activities/
│   └── yoshi-typing/
│       ├── index.html
│       ├── 01-flower-garden.html
│       ├── 02-forest-path.html
│       ├── 03-crystal-caves.html
│       ├── 04-bonus-challenge.html
│       ├── assets/
│       │   ├── css/yoshi.css
│       │   ├── images/
│       │   └── js/
│       └── tests/
│           ├── validate-activity.mjs
│           └── validate-browser.mjs
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

## Nova atividade: Floresta do Yoshi


A atividade independente de digitação começa em [`activities/yoshi-typing/index.html`](activities/yoshi-typing/index.html). Ela possui três mundos obrigatórios, com cinco checkpoints em cada, e um quarto mundo de bônus que só aparece como opção depois da conclusão principal:

1. **Flower Garden** — posição-base da mão esquerda em A, S, D e F, mais espaço.
2. **Forest Path** — posição-base da mão direita em J, K, L e Ç, mais espaço.
3. **Crystal Caves** — combinação das mãos, fileiras superior e inferior e palavras/frases curtas.
4. **Bonus Challenge** — sequências opcionais para praticar as teclas já apresentadas.

O conteúdo pedagógico e os alvos ficam em `activities/yoshi-typing/assets/js/world-data.js`; a lógica de progresso e correspondência fica em `typing-core.js` e `activity.js`, com estilos compartilhados em `assets/css/yoshi.css`. As páginas HTML individuais selecionam cada mundo e podem ser ampliadas sem mover ou substituir os mundos existentes.

Os desafios usam teclado físico ABNT2. Maiúsculas/minúsculas são equivalentes; Ç e espaço são reconhecidos. Colar ou soltar texto não avança um exercício. O painel dá orientações sobre dedos, mas não tenta inferir qual dedo foi usado. Não há cronômetro nem contagem de tentativas.

O progresso usa `localStorage`, com fallback para `sessionStorage` quando necessário, sem conta ou dados pessoais. A tela inicial oferece continuar ou iniciar nova partida; apagar o progresso requer confirmação. Se ambos estiverem indisponíveis, a interface informa que a continuidade só vale na página atual.

A trilha é carregada pelo YouTube IFrame API somente após uma interação do aluno. Se o serviço estiver bloqueado, o áudio pode ser ignorado e os desafios continuam funcionando. O Mundo 3 apresenta uma cena curta de Kamek com botão próprio para a mensagem musical; ao sair da cena, essa trilha para antes que a trilha das cavernas possa começar.

Esta etapa não implementa acentuação. Uma expansão futura poderá ensinar acento agudo, circunflexo, til, Shift, maiúsculas acentuadas e pontuação depois de preparar exercícios específicos.

## Organização de futuras atividades

- Para atividades independentes, use uma área própria em `activities/<nome-da-atividade>/`, mantendo recursos e testes específicos isolados.
- Coloque cada nova página principal de mundo em `stages/`, usando um número de sequência e um nome descritivo em minúsculas com hífens, como `06-nome-do-mundo.html`.
- Mantenha imagens, áudio, CSS e JavaScript compartilhados em `assets/`, organizados por tipo. Ao referenciar esses arquivos de uma página em `stages/`, use caminhos relativos a partir de `stages/` (por exemplo, `../assets/images/...`).
- Se um endereço antigo precisar continuar funcionando, mantenha-o como uma página HTML pequena com redirecionamento automático e link manual para o caminho canônico.
- Preserve materiais de atividade e assets publicados em releases nos caminhos que já são usados por essas atividades e releases.
- Defina o conteúdo pedagógico de cada atividade quando ela for criada; esta estrutura não determina exercícios ou regras.
