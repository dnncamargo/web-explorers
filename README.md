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
│       └── tests/validate-activity.mjs
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

## Convenções

- `index.html` continua sendo a entrada pública da atividade.
- As fases adicionais ficam em `stages/`.
- Imagens, áudio, CSS e JavaScript ficam em `assets/`.
- Nomes de arquivos usam minúsculas e hífens.
- URLs antigas permanecem como redirecionamentos quando uma fase muda de endereço.
