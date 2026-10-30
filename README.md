# Web Explorers

Atividade de exploração informática em formato de fases.

## Menu principal e organização

```text
web-explorers/
├── index.html                    # catálogo principal das atividades
├── public/
│   ├── 02-entrar-no-submundo.html # material de download; segue para o Mundo 2
│   └── flower.png                # asset público existente, preservado
├── activities/
│   ├── digital-explorers/        # Exploradores do Mundo Digital
│   │   ├── index.html            # entrada da atividade; abre o Mundo 1
│   │   ├── index2.html           # compatibilidade; abre o Mundo 2
│   │   ├── index3.html           # compatibilidade; abre o Mundo 3
│   │   ├── index_final.html      # compatibilidade; abre o Final Boss
│   │   ├── assets/               # mídia, estilos, áudio e scripts da atividade
│   │   └── stages/               # páginas canônicas dos mundos
│   └── yoshi-typing/             # Floresta do Yoshi
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
└── tests/
    └── validate-repository.mjs   # links e estrutura entre atividades
```

O `index.html` da raiz apresenta somente as atividades existentes. **Exploradores do Mundo Digital** abre `activities/digital-explorers/index.html`; **Floresta do Yoshi** abre `activities/yoshi-typing/index.html`.

## Páginas canônicas e compatibilidade da primeira atividade

As páginas principais dos mundos ficam em `activities/digital-explorers/stages/`:

- Entrada: `activities/digital-explorers/index.html`, que redireciona ao Mundo 1.
- Mundo 1 — Overworld: `activities/digital-explorers/stages/01-overworld.html`.
- Mundo 2 — Submundo: `activities/digital-explorers/stages/02-submundo.html`.
- Mundo 3 — Fase da Água: `activities/digital-explorers/stages/03-water.html`.
- Mundo 4 — Casa Fantasma: `activities/digital-explorers/stages/04-ghost-house.html`.
- Final Boss: `activities/digital-explorers/stages/05-final-boss.html`.
- Conclusão: `activities/digital-explorers/stages/game-complete.html`.

Os aliases de compatibilidade permanecem dentro da primeira atividade. Seus redirecionamentos e links manuais levam às páginas canônicas:

| Alias de compatibilidade | Destino canônico |
| --- | --- |
| `activities/digital-explorers/index2.html` | `activities/digital-explorers/stages/02-submundo.html` |
| `activities/digital-explorers/index3.html` | `activities/digital-explorers/stages/03-water.html` |
| `activities/digital-explorers/index_final.html` | `activities/digital-explorers/stages/05-final-boss.html` |
| `activities/digital-explorers/stages/04-final-boss.html` | `activities/digital-explorers/stages/05-final-boss.html` |

O GitHub Pages usa o `index.html` da raiz como catálogo. O material de download do Submundo está em `public/02-entrar-no-submundo.html`; seu botão segue para o Mundo 2 canônico. A pasta `public/` também conserva `flower.png`, que já era publicado nesse caminho.

## Progressão atual

- Mundo 1: links e download.
- Mundo 2 — Submundo: seleção, edição de texto, copiar, recortar, colar, desfazer/refazer e Enter.
- Mundo 3 — Fase da Água: Shift, acentuação e pontuação.
- Mundo 4 — Casa Fantasma: Downloads, pastas, copiar/mover arquivos e alternar entre janelas.
- Mundo 5 — Final Boss: extração de ZIP e renomeação de arquivos.
- Conclusão: página de parabéns, tema de encerramento e recompensa final.

## Atividade independente: Floresta do Yoshi


A atividade independente de digitação começa em [`activities/yoshi-typing/index.html`](activities/yoshi-typing/index.html). Ela possui três mundos obrigatórios, com dez checkpoints cada, e um quarto mundo de bônus opcional com sete checkpoints. Os exercícios praticam sequências mais longas e frases progressivamente mais complexas.

1. **Flower Garden** — apresenta as duas mãos na fileira-base, usando `ASDF`, `JKLÇ` e espaço: `ASDF JKLÇ ASDF JKLÇ`, `ASDF FDSA JKLÇ ÇLKJ ASDF`, `FADA FALA DA SALA FADA FALA`, `ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ`, `A FADA FALA DA SALA FADA FALA`, `ASDF FDSA JKLÇ ÇLKJ ASDF FDSA JKLÇ`, `A FADA FALA DA SALA ASDF JKLÇ FADA ASDF`, `ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ FDSA ÇLKJ ASDF`, `A FADA FALA DA SALA ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ`, `ASDF FDSA JKLÇ ÇLKJ ASDF JKLÇ A FADA FALA DA SALA ASDF`.
2. **Forest Path** — usa `ASDFGHJKLÇ`, `QWERTYUIOP` e espaço. A trilha é [UKP3kPtweio no YouTube](https://www.youtube.com/watch?v=UKP3kPtweio): `ASDFGH JKLÇ ASDFGH`, `QWERTY UIOP QWERTY`, `ASDFGH JKLÇ QWERTY UIOP`, `POIUYTREWQ ASDFGH JKLÇ`, `O GATO PULA PARA O ALTO`, `A TARTARUGA PULA PARA O LAGO`, `O GATO QUER OLHAR PARA O PAPAGAIO`, `A TARTARUGA QUER OLHAR PARA O GATO`, `O PAPAGAIO OLHA A TARTARUGA E O GATO`, `O GATO QUER OLHAR PARA O PAPAGAIO E A TARTARUGA`.
3. **Crystal Caves** — mantém a mesma faixa de teclas de Forest Path, sem exigir a fileira inferior antes do bônus: `QWERTY UIOP ASDFGH JKLÇ`, `O GATO PULA PARA O ALTO`, `A TARTARUGA PULA PARA O LAGO`, `O PAPAGAIO PULA PARA O TOPO`, `O GATO OLHA O PAPAGAIO`, `A TARTARUGA OLHA O PAPAGAIO`, `O PAPAGAIO OLHA A TARTARUGA E O GATO`, `A TARTARUGA QUER OLHAR PARA O PAPAGAIO`, `O GATO QUER OLHAR PARA A TARTARUGA`, `O PAPAGAIO QUER OLHAR PARA A TARTARUGA E O GATO`.
4. **Bonus Challenge** — opcional; as sete frases misturam as três fileiras e, em conjunto, praticam todas as letras de A a Z, além de Ç: `O YOSHI QUER KIWI E XALE`, `O JACARE VAI PARA A FLORESTA`, `O CAÇADOR OBSERVA A ZEBRA NO BOSQUE`, `A ZEBRA E O CAVALO BRINCAM NO BOSQUE`, `A TARTARUGA E O GATO PULAM PARA O TOPO`, `O PAPAGAIO ESCREVE NO QUADRO E OBSERVA A ZEBRA`, `A ZEBRA E O YOSHI BRINCAM COM O CAVALO NO BOSQUE`.

O conteúdo pedagógico e os alvos ficam em `activities/yoshi-typing/assets/js/world-data.js`; a lógica de progresso e correspondência fica em `activities/yoshi-typing/assets/js/typing-core.js` e `activity.js`, com estilos em `activities/yoshi-typing/assets/css/yoshi.css`. As páginas HTML individuais selecionam cada mundo.

Os desafios usam teclado físico ABNT2. Maiúsculas/minúsculas são equivalentes; Ç e espaço são reconhecidos. Colar ou soltar texto não avança um exercício. O painel dá orientações sobre dedos, mas não tenta inferir qual dedo foi usado. Não há cronômetro nem contagem de tentativas.

O progresso usa `localStorage`, com fallback para `sessionStorage` quando necessário, sem conta ou dados pessoais. A tela inicial oferece continuar ou iniciar nova partida; apagar o progresso requer confirmação. Se ambos estiverem indisponíveis, a interface informa que a continuidade só vale na página atual. Como a sequência pedagógica e as fileiras ensinadas foram reorganizadas, esta versão usa uma nova chave de progresso; o progresso salvo na versão anterior não é reaproveitado, evitando pular exercícios.

A trilha é carregada pelo YouTube IFrame API somente após uma interação do aluno. Se o serviço estiver bloqueado, o áudio pode ser ignorado e os desafios continuam funcionando. O Mundo 3 apresenta uma cena curta de Kamek com botão próprio para a mensagem musical; ao sair da cena, essa trilha para antes que a trilha das cavernas possa começar.

A ilustração de Yoshi/Mario é exibida como PNG, pela [URL de imagem indicada para a atividade](https://art.ngfiles.com/images/291000/291714_jamalmason_yoshi.png?f1393937531), em vez do SVG anterior. A flor usa o PNG local `activities/yoshi-typing/assets/images/flower.png`, dimensionado em CSS e ancorado ao contêiner de Yoshi. A imagem de Yoshi depende da disponibilidade do servidor externo (Newgrounds); seu uso e eventual redistribuição devem respeitar os direitos do autor da arte.

Esta etapa não implementa acentuação. Uma expansão futura poderá ensinar acento agudo, circunflexo, til, Shift, maiúsculas acentuadas e pontuação depois de preparar exercícios específicos.

## Organização de futuras atividades

- Para atividades independentes, use uma pasta em `activities/<nome-da-atividade>/`, mantendo páginas, recursos e testes específicos juntos.
- Coloque páginas canônicas de mundos em `activities/<nome-da-atividade>/stages/` quando a atividade usar fases; mantenha aliases de compatibilidade junto ao ponto de entrada dessa atividade.
- Mantenha imagens, áudio, CSS e JavaScript dentro de `activities/<nome-da-atividade>/assets/`, organizados por tipo. Em páginas dentro de `stages/`, use caminhos relativos para os assets da mesma atividade (por exemplo, `../assets/images/...`).
- Use `public/` para materiais que precisam de um caminho público próprio, preservando os caminhos dos assets de release já existentes.
- Se um endereço antigo precisar continuar funcionando, mantenha-o como uma página HTML pequena com redirecionamento automático e link manual para o caminho canônico.
- Preserve materiais de atividade e assets publicados em releases nos caminhos que já são usados por essas atividades e releases.
- Defina o conteúdo pedagógico de cada atividade quando ela for criada; esta estrutura não determina exercícios ou regras.
