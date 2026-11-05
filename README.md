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
│   ├── yoshi-typing/             # Floresta do Yoshi
│   ├── donkey-kong/              # Donkey Kong Country
│   └── word-adventure/           # Aventura das Palavras (alfabetização e letramento)
│       ├── index.html
│       ├── worlds/               # aliases das cinco áreas temáticas
│       ├── assets/css/
│       ├── assets/js/            # conteúdo pedagógico, progresso e interação
│       └── tests/
├── docs/activities/
│   ├── donkey-kong-plan.md
│   └── word-adventure-plan.md    # fundamentação, sequência e critérios
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
- Aventura das Palavras: [http://localhost:8000/activities/word-adventure/](http://localhost:8000/activities/word-adventure/)

Para encerrar o servidor, volte ao terminal e pressione `Ctrl+C`. Mantenha o terminal aberto enquanto estiver usando a versão local.

## Exploradores do Mundo Digital

A primeira atividade é uma aventura de exploração informática inspirada em Super Mario Bros. e Super Mario World. As páginas canônicas dos mundos ficam em `activities/digital-explorers/stages/`; aliases de compatibilidade e o material público de download são mantidos em seus caminhos publicados.

Progressão: links/download; edição de textos; Shift, acentuação e pontuação; organização de arquivos; extração e renomeação.

## Floresta do Yoshi

A atividade independente de digitação começa em `activities/yoshi-typing/index.html`. São três mundos obrigatórios, com dez checkpoints cada, e um quarto mundo de bônus opcional. Os exercícios praticam o teclado físico ABNT2. O progresso usa armazenamento local, sem conta ou dados pessoais. Não há cronômetro nem contagem de tentativas.

## Donkey Kong Country

A atividade de consolidação começa em `activities/donkey-kong/index.html`. O mapa organiza três mundos de treino e um desafio final, com práticas de digitação, seleção, edição, acentuação, pontuação e atalhos. O conteúdo está em `assets/js/checkpoints.js`; lógica e progresso ficam em módulos separados. Os testes específicos estão em `activities/donkey-kong/tests/`.

## Aventura das Palavras

A atividade independente de alfabetização e letramento começa em `activities/word-adventure/index.html`.

Quatro mundos obrigatórios:
1. **Ilha dos Sons** — escuta, segmentação oral de palavras em sílabas e comparação de sons iniciais.
2. **Vila das Letras** — reconhecimento de grafemas, associação entre som inicial e letra e relação entre maiúsculas/minúsculas.
3. **Oficina das Sílabas** — famílias silábicas CV, combinação de blocos e decodificação de palavras regulares previamente ensinadas.
4. **Mercado das Palavras** — leitura de palavras familiares, etiquetas, listas e mensagens de uso cotidiano.

O quinto mundo, **Cidade das Histórias**, é um bônus de compreensão de placas, bilhetes e pequenas mensagens.

O percurso parte da oralidade e da palavra com significado, explicita a ligação entre som e representação escrita e retoma as mesmas relações em tarefas variadas. As imagens ajudam a construir sentido, mas não substituem a leitura. A digitação no teclado físico não é requisito; as respostas iniciais são feitas por seleção/toque. O professor pode falar as palavras, bater palmas junto com a criança e apoiar a interpretação.

A atividade não diagnostica nem rotula o aluno. Seu progresso é local e registra somente checkpoints concluídos. A mediação docente e as experiências reais de leitura e escrita seguem indispensáveis.

O plano pedagógico, a referência curricular, a progressão e os critérios de aceite estão em [docs/activities/word-adventure-plan.md](docs/activities/word-adventure-plan.md). A sequência se relaciona especialmente às habilidades BNCC EF01LP04–EF01LP11 e EF12LP01/EF12LP04. O marco nacional vigente usado como referência é o Compromisso Nacional Criança Alfabetizada (Decreto nº 11.556/2023). O Decreto nº 9.765/2019, da antiga Política Nacional de Alfabetização, foi revogado e não é tratado como política vigente.

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
