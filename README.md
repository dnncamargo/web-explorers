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


A atividade independente de digitação começa em [`activities/yoshi-typing/index.html`](activities/yoshi-typing/index.html). Ela possui três mundos obrigatórios, com dez checkpoints cada, e um quarto mundo de bônus opcional com sete checkpoints. Os exercícios praticam sequências mais longas e frases progressivamente mais complexas.

1. **Flower Garden** — apresenta as duas mãos na fileira-base, usando `ASDF`, `JKLÇ` e espaço: `ASDF JKLÇ ASDF JKLÇ`, `ASDF FDSA JKLÇ ÇLKJ ASDF`, `FADA FALA DA SALA FADA FALA`, `ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ`, `A FADA FALA DA SALA FADA FALA`, `ASDF FDSA JKLÇ ÇLKJ ASDF FDSA JKLÇ`, `A FADA FALA DA SALA ASDF JKLÇ FADA ASDF`, `ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ FDSA ÇLKJ ASDF`, `A FADA FALA DA SALA ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ`, `ASDF FDSA JKLÇ ÇLKJ ASDF JKLÇ A FADA FALA DA SALA ASDF`.
2. **Forest Path** — usa `ASDFGHJKLÇ`, `QWERTYUIOP` e espaço. A trilha é [UKP3kPtweio no YouTube](https://www.youtube.com/watch?v=UKP3kPtweio): `ASDFGH JKLÇ ASDFGH`, `QWERTY UIOP QWERTY`, `ASDFGH JKLÇ QWERTY UIOP`, `POIUYTREWQ ASDFGH JKLÇ`, `O GATO PULA PARA O ALTO`, `A TARTARUGA PULA PARA O LAGO`, `O GATO QUER OLHAR PARA O PAPAGAIO`, `A TARTARUGA QUER OLHAR PARA O GATO`, `O PAPAGAIO OLHA A TARTARUGA E O GATO`, `O GATO QUER OLHAR PARA O PAPAGAIO E A TARTARUGA`.
3. **Crystal Caves** — mantém a mesma faixa de teclas de Forest Path, sem exigir a fileira inferior antes do bônus: `QWERTY UIOP ASDFGH JKLÇ`, `O GATO PULA PARA O ALTO`, `A TARTARUGA PULA PARA O LAGO`, `O PAPAGAIO PULA PARA O TOPO`, `O GATO OLHA O PAPAGAIO`, `A TARTARUGA OLHA O PAPAGAIO`, `O PAPAGAIO OLHA A TARTARUGA E O GATO`, `A TARTARUGA QUER OLHAR PARA O PAPAGAIO`, `O GATO QUER OLHAR PARA A TARTARUGA`, `O PAPAGAIO QUER OLHAR PARA A TARTARUGA E O GATO`.
4. **Bonus Challenge** — opcional; as sete frases misturam as três fileiras e, em conjunto, praticam todas as letras de A a Z, além de Ç: `O YOSHI QUER KIWI E XALE`, `O JACARE VAI PARA A FLORESTA`, `O CAÇADOR OBSERVA A ZEBRA NO BOSQUE`, `A ZEBRA E O CAVALO BRINCAM NO BOSQUE`, `A TARTARUGA E O GATO PULAM PARA O TOPO`, `O PAPAGAIO ESCREVE NO QUADRO E OBSERVA A ZEBRA`, `A ZEBRA E O YOSHI BRINCAM COM O CAVALO NO BOSQUE`.

O conteúdo pedagógico e os alvos ficam em `activities/yoshi-typing/assets/js/world-data.js`; a lógica de progresso e correspondência fica em `typing-core.js` e `activity.js`, com estilos compartilhados em `assets/css/yoshi.css`. As páginas HTML individuais selecionam cada mundo e podem ser ampliadas sem mover ou substituir os mundos existentes.

Os desafios usam teclado físico ABNT2. Maiúsculas/minúsculas são equivalentes; Ç e espaço são reconhecidos. Colar ou soltar texto não avança um exercício. O painel dá orientações sobre dedos, mas não tenta inferir qual dedo foi usado. Não há cronômetro nem contagem de tentativas.

O progresso usa `localStorage`, com fallback para `sessionStorage` quando necessário, sem conta ou dados pessoais. A tela inicial oferece continuar ou iniciar nova partida; apagar o progresso requer confirmação. Se ambos estiverem indisponíveis, a interface informa que a continuidade só vale na página atual. Como a sequência pedagógica e as fileiras ensinadas foram reorganizadas, esta versão usa uma nova chave de progresso; o progresso salvo na versão anterior não é reaproveitado, evitando pular exercícios.

A trilha é carregada pelo YouTube IFrame API somente após uma interação do aluno. Se o serviço estiver bloqueado, o áudio pode ser ignorado e os desafios continuam funcionando. O Mundo 3 apresenta uma cena curta de Kamek com botão próprio para a mensagem musical; ao sair da cena, essa trilha para antes que a trilha das cavernas possa começar.

A ilustração de Yoshi/Mario é exibida como PNG, pela [URL de imagem indicada para a atividade](https://art.ngfiles.com/images/291000/291714_jamalmason_yoshi.png?f1393937531), em vez do SVG anterior. A flor usa o PNG local `activities/yoshi-typing/assets/images/flower.png`, dimensionado em CSS e ancorado ao contêiner de Yoshi. A imagem de Yoshi depende da disponibilidade do servidor externo (Newgrounds); seu uso e eventual redistribuição devem respeitar os direitos do autor da arte.

Esta etapa não implementa acentuação. Uma expansão futura poderá ensinar acento agudo, circunflexo, til, Shift, maiúsculas acentuadas e pontuação depois de preparar exercícios específicos.

## Organização de futuras atividades

- Para atividades independentes, use uma área própria em `activities/<nome-da-atividade>/`, mantendo recursos e testes específicos isolados.
- Coloque cada nova página principal de mundo em `stages/`, usando um número de sequência e um nome descritivo em minúsculas com hífens, como `06-nome-do-mundo.html`.
- Mantenha imagens, áudio, CSS e JavaScript compartilhados em `assets/`, organizados por tipo. Ao referenciar esses arquivos de uma página em `stages/`, use caminhos relativos a partir de `stages/` (por exemplo, `../assets/images/...`).
- Se um endereço antigo precisar continuar funcionando, mantenha-o como uma página HTML pequena com redirecionamento automático e link manual para o caminho canônico.
- Preserve materiais de atividade e assets publicados em releases nos caminhos que já são usados por essas atividades e releases.
- Defina o conteúdo pedagógico de cada atividade quando ela for criada; esta estrutura não determina exercícios ou regras.
