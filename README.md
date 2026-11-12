# Web Explorers

Atividades independentes de exploração informática, alfabetização e letramento, organizadas em experiências por fases.

## Menu principal e organização

```text
web-explorers/
├── index.html                    # catálogo principal das atividades
├── public/                       # materiais públicos e assets existentes
├── activities/
│   ├── digital-explorers/        # Exploradores do Mundo Digital
│   ├── yoshi-typing/             # Floresta do Yoshi
│   ├── donkey-kong/              # Donkey Kong Country
│   └── word-adventure/           # Expedição Natureza
│       ├── index.html            # entrada pela Capi, mapa, música e agradecimento
│       ├── worlds/               # aliases de compatibilidade dos mundos
│       ├── assets/css/
│       ├── assets/js/            # conteúdo, progresso e interação
│       └── tests/
├── docs/activities/
│   └── word-adventure-plan.md    # plano pedagógico e critérios de aceite
└── tests/
    └── validate-repository.mjs
```

O catálogo da raiz apresenta quatro atividades independentes. Cada experiência conserva seus próprios recursos e progresso.

## Como executar localmente

Execute o servidor a partir da pasta raiz do repositório, onde está o arquivo `index.html`.

**Windows (PowerShell):**

```powershell
py -m http.server 8000
```

**Linux ou Linux (Penguin) no Chromebook:**

```bash
python3 -m http.server 8000
```

Em seguida, abra no navegador:

- Catálogo: [http://localhost:8000/](http://localhost:8000/)
- Expedição Natureza: [http://localhost:8000/activities/word-adventure/](http://localhost:8000/activities/word-adventure/)

Para encerrar o servidor, volte ao terminal e pressione `Ctrl+C`. Mantenha o terminal aberto enquanto estiver usando a versão local.

## Exploradores do Mundo Digital

A primeira atividade é uma aventura de exploração informática inspirada em Super Mario Bros. e Super Mario World. As páginas canônicas dos mundos ficam em `activities/digital-explorers/stages/`; aliases de compatibilidade e o material público de download são mantidos em seus caminhos publicados.

Progressão: links/download; edição de textos; Shift, acentuação e pontuação; organização de arquivos; extração e renomeação.

## Floresta do Yoshi

A atividade independente de digitação começa em `activities/yoshi-typing/index.html`. São três mundos obrigatórios, com dez checkpoints cada, e um quarto mundo de bônus opcional. Os exercícios praticam o teclado físico ABNT2. O progresso usa armazenamento local, sem conta ou dados pessoais. Não há cronômetro nem contagem de tentativas.

## Donkey Kong Country

A atividade de consolidação começa em `activities/donkey-kong/index.html`. O mapa organiza três mundos de treino e um desafio final, com práticas de digitação, seleção, edição, acentuação, pontuação e atalhos. O conteúdo está em `assets/js/checkpoints.js`; lógica e progresso ficam em módulos separados. Os testes específicos estão em `activities/donkey-kong/tests/`.

## Expedição Natureza — O Mapa das Descobertas

A atividade de alfabetização, letramento e familiarização com o computador começa em `activities/word-adventure/index.html`. Capi, uma capivara-guia, acompanha a expedição por ambientes naturais brasileiros.

O percurso principal tem **cinco mundos e 25 checkpoints**, com três a cinco microatividades por checkpoint e duração de referência de aproximadamente 40 minutos:

1. **Acampamento Base** — primeiro clique, trilhas numéricas, formas desenhadas em SVG, cores e organização da mochila para o acampamento com lanterna, binóculos e mapa.
2. **Lagoa dos Sons** — associação entre palavra e imagem, segmentação oral de sílabas, rimas e comparação de sílabas iniciais.
3. **Trilha das Letras** — vogais, reconhecimento de grafemas, maiúsculas/minúsculas, traçado pontilhado e sons iniciais.
4. **Oficina das Palavras** — famílias silábicas CV, completar e ordenar sílabas e decodificação gradual de palavras ensinadas.
5. **Posto de Pesquisa** — etiquetas, listas, placas, bilhetes e diário de campo para usar a leitura em situações com propósito.

O **Diário de Bordo** é um bônus opcional de sequência narrativa, compreensão e registro de observações.

A atividade combina cliques, seleção, conexão de pontos, arrastar e soltar, montagem de palavras e compreensão de textos curtos. Toda ação de arrastar possui alternativa por seleção do item e do destino. A criança não precisa digitar no teclado físico nem ler sozinha as instruções. Não há cronômetro, vidas ou penalização por erros; pausas e repetição fazem parte da proposta.

### Música e áudio

A primeira tela apresenta a Capi no centro: ao clicar nela, o mapa de atividades é aberto e a música começa no mesmo gesto. No mapa, a imagem de introdução funciona como controle para pausar ou retomar a faixa. O player do YouTube permanece fora da área visível, sem exibir vídeo nem controles, e repete a música inteira com `loop=1` e `playlist` apontando para o mesmo ID. Ao entrar em um mundo, o player é removido. Se a música estava tocando, o botão “Mapa” retoma a faixa ao retornar; se estava pausada, continua pausada. Os mundos não têm música de fundo nem trilha sonora contínua: usam apenas fala e áudio curto necessário ao exercício.

Ao concluir os cinco mundos obrigatórios, a tela final apresenta uma mensagem de gratidão da Capi com a imagem da capivara segurando uma rosa. O Diário de Bordo continua opcional.

### Progresso

O progresso da nova expedição usa a chave `exploradores.expedicao-natureza.progress.v2`, separada da chave v1 da antiga Aventura das Palavras. O progresso anterior não é apagado nem convertido em checkpoints novos. A versão atual registra checkpoints e a microatividade em andamento para permitir retomada local. Durante um checkpoint, há também uma ação para reiniciá-lo desde a primeira microatividade sem apagar checkpoints anteriores.

O plano pedagógico, a sequência curricular, as interações, a política de áudio e os critérios de aceite estão em [docs/activities/word-adventure-plan.md](docs/activities/word-adventure-plan.md). A proposta se relaciona às habilidades de consciência fonológica, sistema alfabético, decodificação e compreensão de textos cotidianos da BNCC, com mediação docente.

## Testes

Execute a partir da raiz do repositório:

```bash
node activities/word-adventure/tests/validate-activity.mjs
node activities/word-adventure/tests/validate-repository.mjs
node tests/validate-repository.mjs
```

## Organização de futuras atividades

- Para atividades independentes, use uma pasta em `activities/<nome-da-atividade>/`, mantendo páginas, recursos e testes específicos juntos.
- Coloque páginas canônicas de mundos em `stages/` ou `worlds/` quando a atividade usar fases; preserve aliases de compatibilidade quando necessário.
- Mantenha imagens, áudio, CSS e JavaScript dentro de `assets/`, organizados por tipo.
- Preserve os caminhos de assets já publicados e usados por atividades existentes.
- Defina o conteúdo pedagógico, a avaliação e os critérios de aceite quando a atividade for criada; a estrutura técnica não determina a pedagogia.
