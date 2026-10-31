# Donkey Kong Country — planejamento da atividade de consolidação

**Repositório:** `dnncamargo/web-explorers` · **Base auditada:** código de `main`, 30/10/2026 · **Branch:** `codex/donkey-kong-planning`
**Escopo:** auditoria, especificação e registro da implementação inicial. A atividade foi adicionada nesta branch; validação visual e de sala ainda estão pendentes.

## 1. Proposta pedagógica

Aventura curta para transferir técnica de digitação no ABNT2 e edição de texto pelo teclado. São 22 checkpoints em três mundos e uma missão final. Sem cronômetro, vidas ou velocidade. A validação automática mede conteúdo e operações observáveis; o professor observa o posicionamento real dos dedos. Um texto correto nunca será tratado como prova de qual dedo foi usado.

A progressão apresenta mãos/fileiras antes de frases; depois diferenciação de maiúsculas/minúsculas, Shift, símbolos e acentos; por fim, Enter, Delete, AltGr+W, seleção e operações Ctrl. Mundo 1 não cobra acento nem pontuação. Toda tecla nova é demonstrada antes de seu uso.

## 2. Auditoria — fontes locais

Não há `AGENTS.md` no checkout. `activities/digital-explorers/index.html` leva a `stages/01-overworld.html`; `assets/js/main.js` só declara `mostrarMensagem` e não é o motor das missões. A atividade atual é majoritariamente HTML autocontido com CSS/JS inline. Há variantes `index2/3/final` e dois arquivos de chefe (`04-final-boss`, `05-final-boss`); não presumir que sejam a rota vigente sem verificar o mapa publicado.

### Matriz de reutilização (REUSE / ADAPT / NEW)

| Recurso | Origem | Possibilidade | Adaptação |
|---|---|---|---|
| Mapa de mundos/cartões | Digital Explorers, `stages/01-overworld.html` | **ADAPT** | Tema, nomes, progresso e imagens DK. |
| Cartão de missão/checkpoint consecutivo | páginas de `stages/02-submundo.html`, `03-water.html`, `05-final-boss.html` | **ADAPT** | Um cartão ativo por vez e dados novos; HTML atual mistura marcação e lógica inline. |
| Progresso visual/feedback/reset | páginas Digital Explorers | **ADAPT** | Preservar sequência; sem cronômetro/vidas, com repetição livre. |
| Edição e seleção real | `02-submundo.html` (`contenteditable`, `selectionchange`, `selectionInside`) | **ADAPT** | Texto puro em textarea para o poema e atalhos nativos; seleção via range. |
| Layout e painéis | páginas Digital Explorers + `assets/css/main.css` | **ADAPT** | Folha isolada DK, sem mudar estilo legado. |
| YouTube IFrame API/status/segmento | scripts inline `02-submundo`, `03-water`, `05-final-boss` | **ADAPT** | Player interno DK; preservar controls, origin, volume 25%, status, erros, bloqueio autoplay, fallback e loop. Código legado é duplicado entre páginas. |
| Mapa ABNT2 colorido por dedo | Yoshi `assets/js/activity.js` (`renderKeyboard`) + `yoshi.css` | **ADAPT** | Acrescentar mãos, marcas F/J, modificadores e pontuação. Não importável como página pronta. |
| Mapa tecla→dedo | Yoshi `assets/js/world-data.js` (`fingers`) | **REUSE** | Letras, Ç e espaço; manter sua associação existente. |
| Indicação próxima tecla/dedo | Yoshi `activity.js` | **ADAPT** | Dica visual; não sugerir que o sistema identifica o dedo físico. |
| Eventos confiáveis/NFC/case | Yoshi `typing-core.js`, `activity.js` | **ADAPT** | Princípio `event.isTrusted` para digitação; edição valida valor/seleção/ação, não só próxima tecla. |
| Persistência progressiva | Yoshi `typing-core.js`, `activity.js` | **ADAPT** | Namespace DK, estado do rascunho final, fallback local→session→memória. Nunca gravar na chave Yoshi. |
| Player Yoshi | `assets/js/audio.js` | **ADAPT** | Bom modelo de status/fallback, mas hoje usa autoplay=0 e controls de iframe ocultos; rádio pedido deriva do padrão Exploradores. |
| Testes teclado/progresso | `yoshi-typing/tests/validate-*.mjs` | **ADAPT** | Reusar abordagem, dados e alvos DK novos. Testes Yoshi não verificam teclado físico. |
| Poema editável com oito alvos | Não existe | **NEW** | Especificação do textarea, seleção e estado abaixo. |
| 22 checkpoints DK | Não existe | **NEW** | Exercícios detalhados neste plano. |
| Assets DK | URLs externas fornecidas pelo professor | **ADAPT** | Carregar sprites e cenas remotamente com `alt`, `title`, créditos e fallback de erro; não copiar arquivos protegidos ao repo. |
| Testes e checklist Chromebook DK | Não existe | **NEW** | Plano automatizado e humano na seção 13. |

### Evidências por atividade

**Exploradores do Mundo Digital.** Entrada e mapa em `stages/01-overworld.html`; cada página combina missão, personagem, rádio, interação e links de navegação. A Mina tem 7 missões, Água 7 e `05-final-boss` 7. As próximas missões começam ocultas e avançam por lógica local. `02-submundo.html` usa `sessionStorage`, `Set` em memória e DOM Selection API para avaliar seleções em `contenteditable`. É a principal referência de layout e checkpoints. A rádio da Mina declara `VIDEO_ID`, início/fim, volume=25, controles=1, origin, monitor de reprodução, `onAutoplayBlocked` e erro; só pede início após botão de entrada. Implementações variam entre arquivos. `03-water` tem demonstrações de teclado, mas nenhuma figura ABNT2 colorida por dedo equivalente ao Yoshi.

**Floresta do Yoshi.** Capa e uma página por mundo. `world-data.js` separa alvos/instruções/dicas/trilhas e mapa de dedos; código auditado tem 10 checkpoints em cada um dos 3 mundos principais e 7 no bônus, diferente da proposta DK. `activity.js` renderiza teclado por fileiras, cores/legenda, próxima tecla/dedo, espaço/polegares, foco, dica e reinício. Não desenha mãos/FJ tácteis. `typing-core.js` normaliza NFC/case, exige evento confiável, avança em ordem e normaliza progresso. Persistência usa localStorage, sessionStorage e fallback memória, com indicador. `audio.js` cria player único, controles separados, mute/volume 35 e link fallback; atualmente `autoplay:0` e controles do iframe ocultos. Há `validate-activity.mjs` e `validate-browser.mjs` para testes automáticos/browser. Não foram executados nesta auditoria.

## 3. Identidade, navegação e rádio

Exploradores é a referência estrutural: mapa ilustrado, cenários de fase em tela cheia e cartões de missão escurecidos. Cada mundo tem paleta e captura próprias; sprites aparecem no mapa, no cabeçalho, na introdução e na conclusão. Yoshi fornece teclado, cores e dedos. Leitura e campo continuam mais proeminentes que a decoração.

| Página proposta | Papel |
|---|---|
| `index.html` | Capa, rádio da seleção, cartões dos quatro mundos, progresso e retomar. |
| `jungle.html` | Treino ABNT2 + 8 checkpoints consecutivos. |
| `mine.html` | 7 checkpoints automáticos de maiúsculas/minúsculas, Shift, símbolos e acentuação. |
| `camp.html` | 7 checkpoints automáticos de Enter, Delete, AltGr+W, seleção/Ctrl, clipboard, undo/redo e integração. |
| `king-k-rool.html` | Editor e referência do poema. |

Um cartão por vez; sequência é interna à página, não 22 rotas. Mapa permite abrir qualquer mundo, mesmo sem concluir o anterior; conserva sequência dentro do mundo e progresso por checkpoint. Sem exigência de conclusão total para considerar evidência de aprendizagem. Navegação por teclado e foco visível. Em tela estreita, painéis empilhados; consulta do poema expansível e com rolagem própria.

### Rádio e vídeos

Consulta ao oEmbed público de todos os IDs respondeu HTTP 200 com títulos abaixo. Isto confirma metadados públicos, não autoriza a música nem garante IFrame tocável/autoplay. Segmentos de tempo serão definidos após audição; não inventar duração.

| Página | ID — título/criador do oEmbed |
|---|---|
| Mapa | `DTLfV7Ru5VY` — Donkey Kong Country - Simian Segue [Restored], Jammin’ Sam Miller |
| Mundo 1 | `eAm9fk39c50` — Donkey Kong Country - DK Island Swing [Restored], Jammin’ Sam Miller |
| Mundo 2 | `cBK2YIrY62I` — Donkey Kong Country 2 - Mining Melancholy [Restored], Jammin’ Sam Miller |
| Mundo 3 | `wxAZfLenfa0` — Donkey Kong Country 2 - Forest Interlude [Restored], Jammin’ Sam Miller |
| Chefe | `i3qYmvTq6uI` — Gangplank Galleon - Donkey Kong Country (SNES) Music Extended, Aacro Xtensions² |

Um player IFrame API por página, controls visíveis (`controls:1`), `playsinline`, `origin`, permissão `allow="autoplay"` e volume inicial 25/100. Nas páginas de mundo e chefe, tenta autoplay audível ao abrir; se `onAutoplayBlocked` disparar, tenta novamente em modo mudo e troca o botão para “Ativar som”. Clique nesse botão chama `unMute()` no gesto do usuário. Se a segunda tentativa também for bloqueada, mantém “Ouvir trilha” e o link externo. O mapa espera o clique no barril para iniciar. Autoplay audível não pode ser garantido por código em navegadores que exigem gesto; testar rede, política gerenciada e reprodução real na escola. Não baixar/redistribuir áudio.

## 4. Assets e direitos

Os arquivos PNG acessíveis foram inspecionados quanto a dimensões e canal alpha. Três links Fandom responderam HTTP 403 no fetch direto; suas dimensões/alfa não puderam ser verificadas. “Fair use” e uso restrito das wikis se referem ao uso editorial delas, não concedem redistribuição para este projeto.

| Asset | Verificação | Autoria/licença encontrada | Uso indicado / decisão |
|---|---|---|---|
| [Donkey Kong](https://pt.wikipedia.org/wiki/Ficheiro:Donkey_Kong_character.png) | 200, PNG 317×314, alpha | Nintendo; página assinala uso restrito e direitos reservados | Herói da capa somente com autorização; senão arte licenciada/original. |
| [Diddy](https://www.ssbwiki.com/File:Diddy_Kong_SSB4.png) | 200, PNG 400×400, alpha | SmashWiki classifica como mídia de jogo sob fair use | Retrato nos últimos checkpoints, condicionado a direito. |
| [King K. Rool](https://www.mariowiki.com/Category:DK:_Jungle_Climber_artwork) | URL indicada 403; não verificado. Categoria lista DKJC K. Rool 1.736×1.944, mas não confirma ser o mesmo arquivo | Personagem Nintendo; permissão não identificada | Chefe, condicionado. Não substituir automaticamente pelo arquivo da categoria. |
| [Barril DK](https://www.ssbwiki.com/File:DK_Barrel_DKCR.png) | 200, PNG 1.535×1.805, alpha | SmashWiki marca como mídia de jogo/fair use | Ícone da Mina, condicionado. |
| [Cacho de bananas](https://donkeykong.fandom.com/wiki/File:Cacho_de_Bananas.png) | 403; formato/dimensão/alfa sem verificação | Wiki de fãs; licença do site não prova licença do artwork | Recompensa, condicionado. |
| [Funky Kong](https://www.mariowiki.com/File:Funkykong.png) | 200, PNG 627×428, alpha | Mario Wiki classifica artwork DKC2 como fair use | Cameo Mundo 2, condicionado. |
| [Cranky Kong](https://www.mariowiki.com/File:DKCRHD_Cranky_Kong.png) | 403; ficha informa PNG 1.132×1.120; alfa não verificado | Nintendo/fair-use artwork, sem redistribuição | Recado do Cranky, condicionado. |

Não embutir/baixar os sete até confirmar permissão. Registrar crédito/licença se obtidos. Alternativa é arte original licenciada e motivos próprios (banana, barril, selva, piratas), sem usar sprites/arte Nintendo; validar uso de marca/personagem antes de publicar.

## 5. Decisões técnicas e limites

### Teclado ABNT2

ChromiumOS lista Brazil (ABNT2), `xkb:br::por`, e diferencia ABNT1; o Google avisa que a tabela genérica de atalhos de Chromebook é US QWERTY e que teclas podem ser reconfiguradas. Usar o mapa do Yoshi: esquerda A/Q/Z mínimo, S/W/X anelar, D/E/C médio, F/R/T/G/V/B indicador; direita J/Y/U/H/N/M indicador, K/I médio, L/O anelar, Ç/P mínimo; espaço com polegares. Fileiras `QWERTYUIOP`, `ASDFGHJKLÇ`, `ZXCVBNM`. Ilustração com duas mãos, dez dedos, marcas F/J e espaço. Cor/dedo é orientação visual; só professor acompanha dedo real.

**AltGr:** `/` não é mais praticado na Mina. O ponto de interrogação `?` fica no checkpoint 3 do Acampamento e usa AltGr+W, conforme a decisão pedagógica do professor. O exercício verifica a camada AltGr e a tecla física W.

**Acentos:** o professor confirmou que a acentuação funciona no Chromebook usado. Na Mina, o agudo e o til são preparados sem Shift; o circunflexo usa Shift. Nas etapas de maiúsculas, a tecla morta é preparada primeiro e Shift é usado na vogal. O resultado é validado após composição no `input` e NFC.

**Backspace/Delete:** Backspace apaga antes do cursor. No Chromebook testado pelo professor, Lupa (Launcher) + Backspace apaga o caractere à direita. A atividade ensina essa combinação no Mundo 3 e exige o efeito no texto; confirmar em outros modelos/perfis antes de usar em toda a frota. Não interceptar ou simular em JS uma tecla que o aluno deve aprender como Delete.

### Edição, seleção e atalhos

Usar `<textarea>` multilinha: texto plano, cursor, LF, acentos e atalhos nativos de edição. `setSelectionRange(start,end)` cria seleção real; o destaque só aparece focado. O alvo em andamento é selecionado ao iniciar/avançar ou por “Selecionar trecho atual”, não em todo `input` (preservar caret/seleção do aluno). Recalcular offsets com o texto atual em UTF-16, localizar ocorrência pela linha/contexto. Índices de ocorrências repetidas não devem usar `indexOf` isolado.

Textarea não estiliza várias palavras independentemente; seleção nativa com `::selection` é o realce pretendido. `contenteditable` já existe na Mina, mas quebras DOM/`<br>` e índices são menos previsíveis; só usar se prova de ChromeOS apontar requisito irrealizável no textarea. `<input>` não serve para poemas.

Não capturar atalhos globalmente. Atalhos são testados somente quando editor está focado; navegador/sistema (Ctrl+T/W/L/R/F/zoom/acessibilidade) continuam disponíveis. Não impedir Ctrl/Alt/Shift nativos. Usar `input`, `beforeinput`, `copy/cut/paste` para observar efeitos quando disponível. Não ler/gravar clipboard programaticamente. Se gesto não puder ser observado, validar resultado e registrar esse limite.

### Progresso e arquitetura implementada

Namespace implementado: `exploradores.donkey-kong.progress.v2` (migra dados v1), com `{version, checkpoints:{jungle,mine,camp}, boss:{draft,passed}, updatedAt}`. O schema é normalizado; contadores são limitados ao total de cada mundo. A persistência tenta localStorage, sessionStorage e memória, e a interface informa o modo. O rascunho do poema é persistido junto ao progresso do chefe. O comando de reiniciar limpa apenas a chave DK e grava o estado inicial.

```text
activities/donkey-kong/
  index.html  jungle.html  mine.html  camp.html  king-k-rool.html
  assets/css/donkey-kong.css
  assets/js/checkpoints.js
  assets/js/progress.js
  assets/js/activity.js
  assets/js/radio.js
  tests/validate-activity.mjs
```

Cinco páginas estáticas implementadas, sem SPA ou biblioteca adicional. Conteúdo, progresso e fluxo ficam separados. O player é parametrizado por página, com controles visíveis, tentativa de autoplay, volume inicial 25/100, status e fallback. Nenhuma implementação das atividades antigas foi alterada; o catálogo raiz e os testes de integração foram atualizados para registrar Donkey Kong.

## 6. Comportamento comum dos checkpoints

Personagem/missão curta → demonstração reaberta a qualquer momento → área de exercício focada → feedback imediato → repetir sem punição → conclusão observável → próximo checkpoint. Mensagem de erro indica a habilidade e uma ação. Não aceitar clique em “avançar” sem texto/seleção/resultado correto. Sem cronômetro, vidas ou prêmio por velocidade. Missões não concluídas continuam registradas como evidência parcial. O professor observa postura; o sistema não afirma reconhecer dedos.

## 7. Mundo 1 — A Selva dos Kongs (8)

**Rádio:** `eAm9fk39c50`. A tela inicial abaixo integra treino obrigatório antes da primeira frase. Textos não pedem acento ou pontuação. Comparação de caixa sem distinção e NFC; espaços do alvo, letras e Ç precisam coincidir.

### Treinamento inicial: Conhecendo o teclado

Ilustração nítida de mãos, dez dedos, três fileiras, marcas físicas F/J e barra de espaço. Texto ao aluno: “Encontre as marcas em F e J. Ponha o indicador esquerdo em F e o direito em J. Coloque os outros dedos na posição-base. Deixe os polegares prontos para a barra de espaço. Ao alcançar outra fileira, volte a F e J.”

| Dedo | Esquerda | Direita |
|---|---|---|
| Mínimo | A / Q / Z | Ç / P |
| Anelar | S / W / X | L / O |
| Médio | D / E / C | K / I |
| Indicador | F,G / R,T / V,B | J,H / Y,U / N,M |
| Polegares | Espaço | Espaço |

Fileira-base: esquerda A,S,D,F; direita J,K,L,Ç. Professor observa a mão; app só valida texto.

| # Nome | Objetivo e demonstração | Aluno vê/faz → resultado | Validação, erro/feedback, dica/repetição e evidência |
|---|---|---|---|
| 1 Mão esquerda | Comece posicionando os indicadores nas marcas F/J e acomodando os demais dedos. Demo A/S/D/F por dedo. “Use a mão esquerda para digitar A, S, D, F e volte até A.” | `ASDF FDSA` | Alvo exato NFC/case-insensitive. Erro: “Confira a próxima tecla na fileira-base esquerda.” Dica e nova tentativa livre. O professor observa os dedos; a atividade valida a sequência. |
| 2 Mão direita | Fileira-base direita/Ç. Demo J/K/L/Ç. “Use J, K, L e Ç; depois volte.” | `JKLÇ ÇLKJ` | Alvo exato; se falha, lembrar “Ç fica à direita do L”. Reabrir teclado e tentar novamente. |
| 3 Duas mãos | Coordenação, retorno à base e espaço com polegares. Demo dois grupos por mão. “Alterne as mãos, use espaço entre grupos e volte a F/J quando ajudar.” | `ASDF JKLÇ FDSA ÇLKJ` | Respeitar todos os espaços; erro indica grupo divergente. Repetir do começo. Evidência: sequência, postura observada pelo professor. |
| 4 Subindo pelas árvores | Fileira superior e mesmo dedo correspondente. Demo QWERTY/UIOP. “Suba a fileira superior e volte à posição-base entre grupos.” | `QWERTY UIOP` | Alvo exato; erro destaca tecla esperada no teclado. Reabrir mapa e repetir. |
| 5 Descendo pela selva | Fileira inferior, alcance de indicador. Demo Z–M. “Desça pelas teclas inferiores e volte pela trilha.” | `ZXCVBNM MNBVCXZ` | Alvo exato. Dica: V/B indicador esq.; N/M indicador dir. Repetição livre. |
| 6 As bananas | Palavras curtas de todas as fileiras. Demo teclado completo e espaço. “Digite as quatro palavras separadas por espaço.” | `KONG BANANA DIDDY FLORESTA` | NFC/case-insensitive, espaços simples exatos. Mostrar primeira posição divergente sem apagar texto; dica segmenta por palavra. |
| 7 Diddy Kong | Frase curta, fileiras e polegares. “Digite sem correr; use os dois polegares nos espaços.” | `Diddy corre pela floresta` | Alvo NFC/case-insensitive, espaçamento exato, sem pontuação/acentuação. Erro informa palavra/posição; reinicia exercício. |
| 8 A turma dos Kongs | Frase integral de consolidação. “Digite a frase toda, uma palavra por vez.” Teclado e tecla próxima revisitáveis. | `Os Kongs exploram a ilha` | Mesmo critério; sem pontuação/acentos. Dica oferece grupos; reset da tentativa. Evidência é precisão, não velocidade/dedo. |

## 8. Mundo 2 — A Mina dos Barris (7)

**Rádio:** `cBK2YIrY62I`. Não há Ctrl neste mundo. O conteúdo atual tem sete checkpoints, todos com sequências curtas de digitação automática, na mesma página e sem botão de conferência. Os alvos completos e as instruções vigentes são definidos em `activities/donkey-kong/assets/js/checkpoints.js`; o desenho do teclado é gerado em `renderMineSequenceKeyboard()` a partir da união das teclas desses alvos.

| # | Conteúdo atualmente implementado |
|---|---|
| 1 | Minúsculas/maiúsculas: `banana`, `BANANA`, `Diddy Kong`, `Diddy corre pela ilha.` |
| 2 | Letras, números e sinais: `Diddy tem 2 bananas!`, `2 bananas, 1 fruta.`, `2 + 1 = 3 bananas.`, `Diddy & Dixie formam uma dupla!` |
| 3 | Agudo e til sem Shift em minúsculas: `café`, `jacaré`, `irmã`, `maçã`, `o jacaré come maçã`. |
| 4 | Circunflexo com Shift e vogal minúscula: `você`, `avô`, `câmera`, `pêssego`, `o avô vê a câmera`. |
| 5 | Agudo sem Shift e vogal maiúscula com Shift: `Árvore`, `Érica`, `Índia`, `Óscar`, `Úrsula`, `Árvore alta`. |
| 6 | Circunflexo com Shift e vogal maiúscula: `Ângela`, `Ênio`, `Ônibus`, `Ângela pega o ônibus.` |
| 7 | Revisão integrada: `Diddy tem 2 maçãs!`, `Café, maçã e pêssego.`, `2 + 1 = 3 bananas.`, `Diddy & Dixie formam uma dupla!`. |

A seleção de texto foi retirada da Mina e ficou no exercício de navegação/seleção com Ctrl, no Mundo 3. As frases são curtas e têm significado; os exemplos de letras maiúsculas acentuadas usam palavras e nomes, não grupos artificiais de letras.

## 9. Mundo 3 — O Acampamento dos Kongs (6)

**Rádio:** `wxAZfLenfa0`. Apresentar cada combinação antes do uso. Search/Backspace só vira conteúdo pedagógico depois da prova física.

| # Nome | Habilidade e demonstração; conteúdo/ação | Resultado e critério | Erro, feedback, repetir/evidência |
|---|---|---|---|
| 1 Uma nova linha | Enter e quebra. Texto `A equipe chegou`; cursor após equipe. “Enter cria outra linha aqui.” | Aluno insere Enter entre palavras; valor `A equipe\nchegou` com LF único. | Quebra em posição errada: mostrar cursor. Restaurar texto; verificar ação via valor. |
| 2 Apagando pela frente | Delete oposto ao Backspace. Mostrar `DK|!`; após validação nos Chromebooks, “Search/Launcher+Backspace apaga à frente”; uma combinação. | `DK!` vira `DK`; verificar input e exclusão frontal. Não simular com Backspace. | Se abre launcher/atalho diferente, suspender (sem penalizar), validar configuração. Dica compara antes/depois do cursor. |
| 3 A força do Ctrl | Ctrl+setas, Ctrl+Shift+setas e Ctrl+A. Demo em `Diddy corre pela ilha`, caret antes de corre; mover/selecionar palavra; Ctrl+A em textarea focalizado. | Validar ranges reais, texto selecionado e Ctrl+A apenas no campo; ajustar seleção de palavra segundo teste ChromeOS. | Seleção de limite errado: “Ctrl+seta salta uma palavra; Shift mantém a seleção.” Restaurar caret. Evidência: navegação/seleção maior sem alterar conteúdo. |
| 4 Barris transportadores | Ctrl+C/X/V por etapas. `BANANA` selecionada→copiar→colar em destino vazio; depois recortar `DK` do campo-fonte e colar ao fim do campo `KONG ` (com espaço final). | Destino da cópia `BANANA`; após recorte, fonte vazia e destino `KONG DK`. Observar copy/cut/paste/input quando browser permitir; sem clipboard programático. | Se perdeu seleção/foco, orientar a focar campo e repetir; conferir conteúdo final; registrar se clipboard bloqueado. |
| 5 Voltando no tempo | Ctrl+Z desfaz e Ctrl+Shift+Z refaz, demonstrações separadas. Texto `DK KONG`; digitar `!` no final. | Estados `DK KONG!`→`DK KONG`→`DK KONG!`; valor/evento compatível necessário, clique não substitui atalho. | Se redo for diferente naquela configuração, testar ChromeOS e adaptar antes. Repor valor. Evidência bidirecional. |
| 6 O recado do Cranky | Consolidar acentos maiúsculos. Demo acento morto seguido de Shift+vogal: `´`, Shift+A→`Á`; `´`, Shift+E→`É`; `^`, Shift+E→`Ê`; `~`, Shift+O→`Õ`; `´`, Shift+U→`Ú`. A tecla inicia composição e Shift modifica a vogal seguinte; não manter Shift sobre a tecla morta sem conferir equipamento. | Primeiro digitar `Á É Ê Õ Ú` em campo curto e validar NFC; depois corrigir recado inicial `os kongs\nchegaram a mina?\ntraga bananas!` para `Os Kongs\nchegaram à mina!\nTraga bananas!`. Demonstrar cada combinação isoladamente. | Se composição divergir, rever ABNT2/local; reset da sequência ou do recado atual. Evidência: cinco maiúsculas acentuadas e mensagem final integrada. |

## 10. Chefe Final — King K. Rool

**Rádio:** `i3qYmvTq6uI`. Reconstruir uma versão explicitamente modernizada de *Canção do Exílio* por Gonçalves Dias. Fonte: fac-símile/transcrição BND da edição *Primeiros Cantos* (1846), conferida com Wikisource, que indica pp. 9–10. Não chamar a modernização de transcrição diplomática.

### Referência integral e canônica da atividade

```text
Minha terra tem palmeiras,
Onde canta o sabiá;
As aves, que aqui gorjeiam,
Não gorjeiam como lá.

Nosso céu tem mais estrelas,
Nossas várzeas têm mais flores,
Nossos bosques têm mais vida,
Nossa vida mais amores.

Em cismar, sozinho, à noite,
Mais prazer encontro eu lá;
Minha terra tem palmeiras,
Onde canta o sabiá.
Minha terra tem primores,
Que tais não encontro eu cá;
Em cismar, sozinho, à noite,
Mais prazer encontro eu lá;
Minha terra tem palmeiras,
Onde canta o sabiá.

Não permita Deus que eu morra,
Sem que eu volte para lá;
Sem que desfrute os primores
Que não encontro por cá;
Sem qu'inda aviste as palmeiras,
Onde canta o sabiá.
```

Modernização adotada: acentuação atual; `têm` plural; travessões da edição antiga em “Em cismar - sozinho...” modernizados para vírgulas; “sabiá” uniformizado em minúscula; apóstrofo tipográfico de `qu’inda` fica ASCII. Isso é a única referência em tela, dados e testes. Poema em domínio público; creditar autor e edição. O domínio público do poema não licencia uma edição/transcrição editorial recente.

### Texto danificado inicial

Editor textarea começa com este valor, LF por verso e linha vazia entre estrofes. Oito alvos em ordem e progresso `correção x/8`:

```text
minha terra tem palmeiras,
As aves que aqui gorjeiam,
Onde canta o sabiá,
Não gorjeiam como lá?

Nosso ceo tem mais estrelas,
Nossas várzeas tem mais flores,
Nossos bosques têm mais vida,
Nossa vida mais amores.

Em cismar, sozinho, a noite,
Mais prazer encontro eu lá;
Minha terra tem palmeiras,
Onde canta o sabiá.
Minha terra tem primores,
Que tais não encontro eu cá;
Em cismar, sozinho, à noite,
Mais prazer encontro eu lá;
Minha terra tem palmeiras,
Onde canta o sabiá.

Não permita Deus que eu morra,
Sem que eu volte para la;
Sem que desfrute os primores
Que não encontro por cá;
Sem qu'inda aviste as palmeiras,
Onde canta o sabiá.
```

| # | Trecho-alvo único + correção | Ação no texto real |
|---|---|---|
| 1 | Linha 1 `minha`→`Minha` | Shift+seta seleciona inicial e Shift+M substitui. |
| 2 | Linhas 2–3 reordenadas e pontuadas: `Onde canta o sabiá;` seguida de `As aves, que aqui gorjeiam,` | Selecionar e mover linhas com Ctrl+X/Ctrl+V e quebras. Seleção automática abrange exatamente duas linhas; nenhuma interface de alternativa. |
| 3 | Linha 4 `?`→`.` | Selecionar sinal e digitar ponto. |
| 4 | `ceo`→`céu` | Selecionar palavra ou inserir tecla morta no local. |
| 5 | `tem` da linha das várzeas→`têm` | Selecionar palavra e corrigir circunflexo. |
| 6 | `a noite` na primeira ocorrência de “Em cismar”→`à noite` | Inserir grave e preservar o restante da expressão. |
| 7 | `la` em `Sem que eu volte para la;`→`lá` | Acento agudo, preservar `;`. |
| 8 | Linha `As aves que aqui gorjeiam,`→`As aves, que aqui gorjeiam,` | Inserir vírgula; a validação final compara texto inteiro canônico. |

A reordenação 2 deixará linha das aves sem vírgula, de forma que o alvo 8 faz a pontuação em exercício separado. Após as oito correções, comparar todo o textarea com a referência integral, inclusive LF e linhas vazias. Nenhum erro altera o sentido do poema.

### Interface, seleção e validação

- **Edição principal:** campo com poema inteiro, progresso, personagem/missão, instrução/demonstração e “Selecionar trecho atual”. Trecho atual recebe `setSelectionRange`, foco, seleção nativa/`::selection`. Usuário edita ali com os atalhos aprendidos.
- **Referência:** `<pre>` ou equivalente `white-space: pre-wrap`, somente leitura, aberta/fechada por “Consultar poema”, rolagem separada. Fechar/abrir não limpa valor do textarea; ao voltar, botão reestabelece seleção do alvo. Em tela estreita, acordeão abaixo do campo, fechado por padrão.
- **Índices:** encontrar linha/ocorrência com contexto (repetições “Minha terra”/“lá” não são localizadas por busca simples). Recalcular offsets sobre o valor atual; seleção programática aparece apenas focada. Não reaplicar a cada `input` para preservar caret. Depois de correção válida, selecionar próximo alvo e anunciar x/8.
- **Validação:** conferir trecho/linha contextual e conteúdo após edição; botão “Conferir” não avança sem mudança correta. Para reordenação, conferir ordem das duas linhas, pontuação e uma quebra; observar edição, não impor gesto específico se usuário conseguiu reconstruir pelo teclado. Após alvo 8, comparar o texto integral e LF; concluir somente igualdade total.
- **Desfazer/refazer e progresso:** não bloquear atalhos. Salvar rascunho e alvo concluído juntos com debounce/blur/reload; nunca reiniciar um rascunho válido automaticamente. Se edição posterior estragar correção feita, recalcular progresso/retomar o erro. Não usar clipboard programático.

## 11. Matriz de habilidades

| Mundo | Habilidade central dos checkpoints | Revisões |
|---|---|---|
| Selva | 1 F/J; 2 mão esq.; 3 direita/Ç; 4 coordenação; 5 fileira superior; 6 inferior; 7 palavras; 8 frase curta; 9 completa | Técnica acompanhada em todos, espaço e teclado completo antes de frases. |
| Mina | 1 maiúsculas/minúsculas; 2 Shift, números e símbolos; 3–6 acentos em minúsculas/maiúsculas; 7 mistura | Seleção foi transferida para o Acampamento; AltGr não é ensinado na Mina. |
| Acampamento | 1 Enter; 2 Delete; 3 AltGr+W; 4 Ctrl/seleção; 5 copiar/recortar/colar; 6 undo/redo; 7 integração | Revisa Shift, acentos, símbolos, pontuação, teclado e quebras. |
| Chefe | Corrigir 8 alvos em poema integral | Caixa, ordenação, acentos, pontuação, seleção, apagar/substituir, linhas, desfazer/refazer/consulta. |

## 12. Validação pedagógica e critério de avanço

Digitação valida evento de teclado confiável e texto-alvo, NFC e espaçamento definido. Teclas mortas são julgadas pelo resultado de texto, não pelo `keydown` intermediário. Seleção valida range real e texto selecionado. Edição/clipboard/undo observa `input` e eventos disponíveis e estado final. Ações que o browser não expõe com confiabilidade devem ser relatadas como não observadas; não fingir medição. “Continuar” só habilita pelo critério, mas repetir/demonstração sempre permanecem possíveis. Concluir mundo salva evidência, não um juízo sobre dedo/velocidade.

## 13. Plano de testes e evidências disponíveis

A implementação inclui testes de dados/progresso e amplia os testes de repositório e navegador. Nesta sessão, a sintaxe dos quatro scripts de runtime e dos três scripts de teste foi verificada; os dados em runtime foram carregados para conferir a contagem dos checkpoints, a progressão e a reconstrução exata do poema. Os testes Node completos e o navegador automatizado ainda não foram executados. Separar verificações automatizadas de observação humana/teclado físico.

| Área | Automatizado depois da implementação | Humano / teclado físico |
|---|---|---|
| Mundo 1 | Alvos e ordem; só teclas ensinadas; NFC/case; tecla incorreta não avança; evento sintético não conclui; frases; dica/reset; foco; armazenamento por checkpoint. | Identificar F/J tácteis, posicionar dez dedos, polegares, retornar à base; professor observa. |
| Mundo 2 | Sequências automáticas de caixa, Shift, Shift+1/7/=, ponto/vírgula sem Shift, teclas mortas `´ ~ ^`, NFC e prefixo correto; próxima etapa aparece sem botão. | Shift esq./dir., fileira numérica ABNT2, teclas de agudo/til/circunflexo e maiúsculas acentuadas no Chromebook real. |
| Mundo 3 | Enter/LF; Delete pela frente; AltGr+W→?; Ctrl+setas/Shift/Ctrl+A com seleção real; eventos copy/cut/paste; undo/redo; recado integrado. | Search vs Launcher + Backspace, AltGr+W, Ctrl+Shift+Z e configurações/perfil ChromeOS reais. |
| Chefe | Seleções reais e offsets contextuais; cada alvo; resposta errada não avança; reordenação; painel expandir/fechar sem perda; rascunho/sincronização; LF; conclusão só com texto exato. | Clareza da seleção, consulta/rolagem e digitação do poema no notebook. |
| Geral | Navegação nas cinco páginas, retomar, storage local/session/memória/dados inválidos, layout responsivo, arquivos locais, console, ausência de regressões/arquivos legados modificados. | Chromebook/tela/zoom/rede, touchpad só para navegação, contraste, instruções e teste de sala. |
| Rádio | Mock da IFrame API para ID/segmento/volume/estados/erro/autoplay-blocked/botão/fallback e continuidade da atividade sem áudio. | Tocar os cinco players no domínio publicado; segmento, disponibilidade, bloqueio, filtros e login da rede escolar. |

## 14. Riscos e pendências

| Risco | Tratamento proposto |
|---|---|
| Assets de personagens protegidos; crédito não concede permissão. Três links Fandom inacessíveis. | Obter licença escrita ou usar arte original/licenciada. Não incluir arquivos até decisão. |
| Direitos das gravações são distintos da composição. | Apenas embed YouTube, sem download; conferir disponibilidade e regras da escola, audição e segmentos. |
| Autoplay/bloqueio do YouTube. | Tentativa ao abrir, status, controles visíveis e fallback; atividade sem áudio continua. |
| Layout ABNT2 e teclas administradas variam. | Antes da liberação verificar modelos, layout ativo, `key`/texto, Shift, AltGr, acentos. |
| Search+Backspace/Delete e redo variam. | Validar nos Chromebooks; não ensinar/simular combinação desconhecida. |
| Clipboard e dead keys podem variar por browser. | Provar fluxo no ChromeOS; observar `input`/ranges; jamais substituir teclado por texto inserido. |
| Progresso local pode estar indisponível/apagado. | Fallback session/memória com aviso, salvamento do draft e reinício explícito. |
| Variantes de edição do poema divergem. | Declarar modernização e manter texto canônico único no editor, referência, dados e teste. |
| Offsets do poema mudam com edição Unicode. | Recalcular no valor corrente com linha/contexto, atualizar estado do draft junto ao próximo alvo. |
| Software não mede dedo nem postura. | Professor acompanha técnica; mostrar no app só resultado de digitação. |

Pendências antes da liberação para a turma: (1) confirmar a combinação Lupa/Launcher + Backspace em cada modelo/perfil de Chromebook; (2) validar AltGr+W no perfil escolar; (3) observar as letras Á É Ê Õ Ú, Ctrl+Shift+Z e a área de transferência no campo real da atividade; (4) ouvir os cinco vídeos e testar a reprodução na rede escolar; (5) revisar os direitos/termos de uso dos cenários e sprites remotos; (6) realizar teste visual e pedagógico com professor e alunos. O poema, os cenários e a progressão automática dos mundos já estão implementados.

## 15. Fontes de evidência

### Repositório

- Exploradores: `activities/digital-explorers/index.html`, `stages/01-overworld.html`, `02-submundo.html`, `03-water.html`, `05-final-boss.html`, `assets/css/main.css`, `assets/js/main.js`, recursos em `assets/`.
- Yoshi: `activities/yoshi-typing/index.html`, páginas `01`–`04`, `assets/js/world-data.js`, `typing-core.js`, `activity.js`, `audio.js`, `assets/css/yoshi.css`, testes `tests/validate-activity.mjs` e `tests/validate-browser.mjs`.
- README raiz e status Git inicial limpo em `main` antes de criar a branch.

### Internet consultada em 30/10/2026

- Google, [atalhos Chromebook](https://support.google.com/chromebook/answer/183101?hl=en): lista seleção/Ctrl+A/teclas Search-Launcher e reconfiguração; ressalva artigo US QWERTY.
- ChromiumOS, [regiões ABNT2](https://chromium.googlesource.com/chromiumos/platform/factory/+/refs/heads/main/doc_md/regions.md): `xkb:br::por`, distinção de ABNT1.
- [Microsoft ABNT2 keyboard reference](https://github.com/MicrosoftDocs/globalization/blob/main/globalization/keyboards/kbdbr_2.md) documenta os estados Shift/AltGr; [código XKB `br`](https://github.com/claes/xkeyboard-config/blob/master/symbols/br) mapeia a terceira camada Q `/`, W `?` e declara `level3(ralt_switch)`. Confirmar no Chromebook.
- MDN, [textarea setSelectionRange](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement/setSelectionRange): intervalo nativo, destaque visível quando focado.
- BND, [Primeiros Cantos (PDF), 1846](https://objdigital.bn.br/objdigital2/Acervo_Digital/livros_eletronicos/bndigital0110/bndigital0110.pdf), seção Canção do Exílio; Wikisource, [edição 1846 pp. 9–10](https://pt.wikisource.org/wiki/Can%C3%A7%C3%A3o_do_Ex%C3%ADlio_%28Gon%C3%A7alves_Dias%29); registro [Domínio Público/MEC](https://dominiopublico.mec.gov.br/pesquisa/DetalheObraForm.do?co_obra=2112&select_action=) (página de detalhe bloqueada no fetch; resultado indexado retornou título, autor e parceiro BND).
- Direitos: fichas de [Donkey Kong](https://pt.wikipedia.org/wiki/Ficheiro:Donkey_Kong_character.png), [Diddy](https://www.ssbwiki.com/File:Diddy_Kong_SSB4.png), [barril](https://www.ssbwiki.com/File:DK_Barrel_DKCR.png), [Funky](https://www.mariowiki.com/File:Funkykong.png), [Cranky](https://www.mariowiki.com/File:DKCRHD_Cranky_Kong.png). As páginas descrevem uso restrito/fair use editorial; não é licença ao repositório.
- YouTube oEmbed e requisições diretas para `youtube.com/embed/ID` nos cinco IDs responderam HTTP 200; o corpo inicial não indicou “Video unavailable”. Isso verifica que o endpoint de embed responde agora, mas não testa playback real, autoplay ou rede escolar.

## 16. Revisão e conclusão da especificação

A implementação agora contém 22 checkpoints. Mundo 1 ensina mãos/fileiras antes das frases; Mundo 2 pratica diferenciação de maiúsculas/minúsculas, Shift e símbolos, depois acentos sem/com Shift em minúsculas e maiúsculas; Mundo 3 introduz Enter, Delete, AltGr+W e operações Ctrl, incluindo seleção real. Os exercícios de Mundo 2 e 3 avançam automaticamente entre etapas na mesma página. O chefe mantém a missão integral da Canção do Exílio. Direitos das imagens, áudio e políticas de reprodução dos Chromebooks permanecem riscos declarados.

**Entrega:** planejamento e implementação incremental nesta branch. A atividade possui mapa, três mundos, 22 checkpoints, identidade visual distinta em cada mundo, personagens e cenários carregados externamente, chefe final com oito correções, progresso local isolado e rádio em todas as páginas. A validação de sintaxe e de dados foi executada nesta sessão; os testes Node completos, o Chromium automatizado e a conferência das imagens na rede escolar permanecem pendentes. Não houve merge.

## 17. Registro da implementação inicial — 30/10/2026

- Criadas as cinco páginas estáticas, estilos e módulos de dados, progresso, fluxo e rádio em `activities/donkey-kong/`.
- O catálogo raiz apresenta agora três atividades. O progresso DK usa chave própria e não lê nem altera o progresso de Yoshi.
- Mundo 1 implementa oito exercícios de digitação com orientação de F/J, mãos, fileiras e frases; Mundo 2 implementa sete checkpoints automáticos de Shift, maiúsculas/minúsculas, símbolos, acentos e revisão; Mundo 3 implementa sete checkpoints de Enter, Delete, AltGr+W, navegação/seleção Ctrl, clipboard, undo/redo e texto integrado.
- Chefe final implementa textarea editável, referência separada e oito correções da versão modernizada de *Canção do Exílio*. A missão só conclui com igualdade integral do texto e das quebras de linha.
- Os cinco rádios YouTube usam IFrame API; controles ficam visíveis, o player tenta autoplay, inicia em 25/100 e mantém link de fallback. A reprodução depende da disponibilidade do YouTube e da política do navegador/rede escolar.
- Evidência relatada pelo professor: acentuação funciona; Lupa (Launcher) + Backspace apaga à direita; Ctrl+Z, Ctrl+X, Ctrl+C e Ctrl+V funcionaram na atividade Exploradores; Ctrl+Shift+Z funcionou na atividade de navegador, mas não no aplicativo Text. O exercício usa os atalhos nativos dentro dos campos e não generaliza o comportamento de Text.
- A combinação AltGr+W para `?` foi definida para o Mundo 3. Os sprites e cenários são carregados por URLs externas, com créditos, sem copiar os arquivos para o repositório.
- Validação executada nesta sessão: análise sintática dos scripts JS/MJS (após remover imports e a expressão import.meta.url para a checagem de parsing), carregamento dos dados/progresso em runtime, contagem 8+7+7, oito passos do poema, reconstrução exata da referência e progressão sequencial de checkpoints. Não foram executados os arquivos de teste Node no repositório nem o Chromium automatizado; testes físicos e visuais continuam necessários.
- Branch `codex/donkey-kong-planning`, PR #21 permanece draft e sem merge: https://github.com/dnncamargo/web-explorers/pull/21.
### Como executar a prévia local

Na raiz do repositório, inicie um servidor HTTP estático:

```powershell
py -m http.server 8000
```

Depois abra `http://localhost:8000/activities/donkey-kong/index.html`. Em macOS/Linux/ChromeOS Linux, use `python3 -m http.server 8000`. Não abra a página via `file://`, porque o player do YouTube e as políticas de origem precisam de uma origem HTTP.

### Ajustes de validação após os testes do teclado

- A próxima tecla fica destacada no teclado ABNT2 durante cada exercício de digitação; as cores do alvo indicam o dedo sugerido.
- O checkpoint integrado de Cranky separa maiúsculas acentuadas, primeira letra da primeira frase, acento grave, maiúscula da segunda frase e pontuação em cinco etapas verificáveis.
- O checkpoint de Shift exige o modificador Shift, não apenas uma letra maiúscula produzida por Caps Lock.
- O checkpoint Delete só aceita o evento de apagar à frente (`Delete`/`deleteContentForward`), não um Backspace comum.
- A validação de “à noite” está ancorada à primeira ocorrência incorreta, não à segunda ocorrência que já estava correta.


## 18. Ajustes solicitados — 30/10/2026

- O mapa da Ilha dos Kongs recebeu uma tela de entrada em overlay, modelada na entrada do Submundo: painel em tela cheia, botão de barril de madeira com marca DK e transição ao entrar. O player do mapa é preparado sem autoplay; o botão do barril só libera quando a IFrame API está pronta e chama `playVideo()` diretamente no gesto do clique. Se a API falhar ou expirar, o aluno pode entrar sem música e usar o controle/link do YouTube.
- O botão de entrada usa o asset DK Barrel DKCR da SmashWiki (via DK Wiki), carregado externamente e com crédito visível; o arquivo não foi copiado para o repositório. A página de origem identifica a imagem como mídia protegida usada sob alegação de fair use.
- A posição do polegar esquerdo foi invertida para inclinar em direção ao centro da mão; o polegar direito mantém a inclinação oposta.
- As teclas do mapa de digitação agora seguem as referências visuais do Yoshi: tipografia pixel, borda escura e inferior mais espessa, cores por dedo, destaque externo da próxima tecla e marcação das teclas já usadas.
- O foco vai para o botão “Continuar” imediatamente após uma sequência digitada com sucesso.
- O antigo checkpoint isolado FJ foi removido. O primeiro exercício agora é o antigo “Mão esquerda”, com alvo `ASDF FDSA`; inicialmente o mapa passou a ter 8+7+6 checkpoints. A revisão posterior de Mundo 3 adicionou AltGr+W, levando o total atual a 22 (8+7+7).
- O progresso versão 1 é migrado: uma conclusão antiga do FJ isolado não é contada como conclusão do novo exercício; os demais checkpoints e o rascunho do poema são preservados. O progresso de outros mundos permanece inalterado.


## 19. Ajuste de autoplay da rádio — 30/10/2026

- Nas páginas internas (Selva, Mina, Acampamento e Chefe Final), o player continua solicitando autoplay audível e chama `playVideo()` no evento `onReady`.
- Quando o YouTube informa `onAutoplayBlocked`, o player tenta uma segunda vez com `mute()` + `playVideo()`. Se iniciar, o controle passa para “Ativar som”; o clique chama `unMute()` e restaura volume 25/100.
- O código declara a permissão autoplay no iframe e trata o evento de bloqueio antes ou depois de `onReady`.
- O mapa continua diferente por decisão de interação: não reproduz antes do clique no barril.
- Foi adicionada a suíte `activities/donkey-kong/tests/validate-radio.mjs`, com player simulado para autoplay de páginas internas, fallback mudo, ativação de som, pausa, bloqueio antes de `onReady` e entrada do mapa.
- A simulação executada nesta sessão passou nesses sete cenários. Reprodução com som depende da política do navegador/perfil; a validação audível real ainda precisa ser feita no Chromebook escolar.

## 20. Asset de entrada e controles de reset — 30/10/2026

- O overlay de entrada usa a imagem original DK Barrel DKCR da página SmashWiki, via DK Wiki: https://www.ssbwiki.com/File:DK_Barrel_DKCR.png. A imagem é carregada pela URL do thumbnail em vez de um desenho CSS; um link de crédito abre a página de origem. O arquivo não foi adicionado ao repositório, pois a página informa uso sob alegação de fair use e não apresenta licença de redistribuição.
- Cada tela de checkpoint tem o botão **Resetar atividade**. Se o exercício ainda não foi concluído, ele reinicia apenas a tentativa atual. Se já foi concluído, pede confirmação e desfaz somente a conclusão desse checkpoint, preservando os anteriores.
- A tela inicial de cada mundo tem **Resetar mundo**. Pede confirmação, zera só o contador desse mundo e mantém os outros mundos e a missão final. O botão aparece desabilitado quando não há progresso naquele mundo.
- A tela da missão final também tem **Resetar atividade**, apagando o rascunho e restaurando o poema inicial com erros, sem alterar o progresso dos três mundos. O botão permanece disponível na tela de conclusão para permitir uma nova tentativa.
- As funções de progresso `resetWorld()` e `resetBoss()` isolam as mutações. Testes de unidade verificam a preservação de progresso não relacionado; o smoke test de navegador verifica a presença dos controles e o reset de uma tentativa de digitação.

## 21. Redesign visual e pedagógico dos mundos 2 e 3 — 30/10/2026

Esta revisão substitui as propostas anteriores de conteúdo dos mundos 2 e 3 descritas nas seções iniciais e nas tabelas de planejamento.

### Cenários e personagens

- Cada mundo ganhou um fundo de fase próprio, no padrão de ambientação visual usado por Exploradores do Mundo Digital: Selva (verde/mata), Mina (púrpura e âmbar, ambiente subterrâneo) e Acampamento (azul/ciano, floresta/bramble). Painéis de leitura e exercício ficam escurecidos/contrastados por cima do cenário.
- O mapa mostra personagens/elementos em cada cartão; a página de cada mundo repete a caracterização no cabeçalho, na introdução e na conclusão.
- Selva: screenshot de fase DK Country e sprites DK/Diddy, Squawks e Necky. Mina: imagem de fase Banana Mine e sprites Dixie/Rambi/Klobber, moeda DK e Zinger. Acampamento: fase bramble/Screech e sprites Squawks, Krusha, Necky, Diddy/Donkey e moeda DK.
- Todas as imagens de personagens e screenshots são carregadas remotamente das URLs indicadas. Títulos das imagens identificam suas fontes; quando uma imagem não carrega, somente aquela imagem é ocultada e o cartão/mundo permanece. Nenhum sprite ou screenshot foi copiado para o repositório. As páginas de wiki/hosts não concedem, por isso, licença de redistribuição; revisar direitos antes de publicação ampla.

### Mundo 2 — A Mina dos Barris (7 checkpoints)

1. **Maiúsculas e minúsculas:** `banana`, `BANANA`, `Diddy Kong` e uma frase completa com capitalização correta.
2. **Shift, números e símbolos:** frases com números e os sinais `!` (Shift+1), `&` (Shift+7), `+` (Shift+=), vírgula e ponto.
3. **Acentos sem Shift · minúsculas:** agudo e til em palavras e numa frase curta.
4. **Acentos com Shift · minúsculas:** circunflexo preparado com Shift; a vogal minúscula vem depois, sem Shift.
5. **Acentos sem Shift · maiúsculas:** agudo preparado sem Shift e Shift na vogal maiúscula; palavras e nomes reais.
6. **Acentos com Shift · maiúsculas:** circunflexo e vogal maiúscula, com palavras e uma frase.
7. **Misturando acentos e símbolos:** frases completas que combinam maiúsculas/minúsculas, acentos, `&`, `!`, números, vírgula e ponto.

Cada checkpoint usa várias sequências curtas no mesmo cartão. O campo valida o prefixo e o resultado completo; ao terminar uma sequência, a próxima aparece e recebe foco automaticamente. Não existe botão “Conferir etapa” nos mundos 2 e 3.

### Mundo 3 — O Acampamento dos Kongs (7 checkpoints)

1. Enter para criar uma nova linha.
2. Delete para apagar à direita (Lupa/Launcher + Backspace no Chromebook testado).
3. AltGr+W para produzir `?`.
4. Ctrl+seta, Ctrl+Shift+seta e Ctrl+A para navegação e seleção real de texto.
5. Ctrl+C, Ctrl+X e Ctrl+V com a área de transferência nativa.
6. Ctrl+Z e Ctrl+Shift+Z para desfazer/refazer.
7. Exercício integrado de acentuação, Shift, edição e pontuação no recado de Cranky.

Os exercícios de Enter, Delete, AltGr, Ctrl, clipboard e undo/redo avançam automaticamente quando o evento e o resultado correspondem à operação esperada. A seleção foi movida de Mundo 2 para a sequência de Ctrl em Mundo 3.

### Teclado ABNT2 específico da Mina

- O teclado reutiliza as fileiras, as cores por dedo, os realces e a barra de espaço do Mundo 1, mas calcula a lista de teclas físicas a partir de todos os alvos dos sete checkpoints da Mina. Teclas que não aparecem em nenhum alvo ficam como lacunas invisíveis para preservar as posições físicas.
- O desenho tem fileira de números, letras, dois Shift com seta para cima, barra de espaço e as teclas de pontuação/acentuação que a Mina realmente usa.
- A posição segue o ABNT2: agudo `´` à direita do P; til/circunflexo `~`/`^` à direita do Ç; vírgula e ponto à direita do M.
- Shift+1 → `!`; Shift+7 → `&`; Shift+= → `+`. Os símbolos superiores são mostrados apenas nas teclas cujos sinais são praticados nesta Mina.
- A seta de Shift correspondente brilha ao mesmo tempo que a tecla física que precisa dela. Para acentos, o realce passa da tecla morta para a vogal depois do primeiro toque.
- Agudo `´` e til `~` são preparados sem Shift; circunflexo `^` é preparado com Shift. A vogal é pressionada depois da tecla morta.
- AltGr+W → `?` permanece exclusivo do Mundo 3.

### Validação desta revisão

- Dados em runtime conferidos: 8 checkpoints de Selva, 7 de Mina e 7 de Acampamento (22 no total); sete nomes/ordem de checkpoints do Mundo 2 e sete do Mundo 3.
- Sintaxe de `activity.js`, `checkpoints.js`, `progress.js`, `radio.js`, testes de atividade, rádio, repositório e navegador analisada; CSS com chaves balanceadas.
- Os testes Node completos e o navegador automatizado ainda não foram executados em checkout local nesta sessão. As URLs externas de personagens/fundos também precisam ser visualmente conferidas na rede da escola.

### Notas de crédito e disponibilidade dos assets

As imagens de fase e os sprites desta revisão permanecem remotos e não são redistribuídos dentro do repositório. Os atributos `alt` e `title` identificam personagem e origem (Nintendo Fandom, Donkey Kong Wiki ou Tenor). As imagens Fandom/remote podem responder 403, variar de URL ou não carregar na rede escolar; o código oculta somente o arquivo que falhar, sem remover o cartão ou bloquear o exercício. A publicação para além do uso pessoal/escolar exige revisão de direitos e licenças das imagens.
### URLs das imagens de fase usadas

- Selva / Jungle Climb (MobyGames): https://www.mobygames.com/images/shots/l/27540-donkey-kong-country-snes-screenshot-now-we-ve-really-climbed.jpg
- Mina / Mine Cart Madness (GameTyrant): https://images.squarespace-cdn.com/content/v1/55ef0e29e4b099e22cdc9eea/1446879156032-U8BD4PO9C0DRYDHWD8RA/image-asset.jpeg
- Acampamento / Bramble Scramble (The Mezunian): https://www.mezunian.com/wp-content/uploads/2020/05/donkey-kong-country-2-diddys-kong-quest-bramble-scramble-bramble-wall-near-start.png?m=1701871908

Os sprites dos personagens usam as URLs fornecidas pelo professor; os créditos de origem aparecem sobre a faixa de arte de cada mundo e no atributo `title` das imagens. São carregamentos remotos, não cópias locais.
