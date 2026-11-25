# Capi e os Desafios da Lógica

## Propósito

Criar uma atividade independente de jogos visuais de raciocínio lógico para crianças não leitoras. A navegação e a resolução devem depender principalmente de imagens, cores, formas, quantidades, posições, padrões e ações simples. Texto escrito serve como apoio ao professor; instruções curtas podem ser ouvidas, mas não são requisito para avançar.

A Capi permanece como mascote-guia. A Capi Pintora é uma ferramenta complementar de colorir, hospedada separadamente e aberta em outra aba quando seu endereço estiver configurado.

## Organização da experiência

A página inicial apresenta sete áreas e 36 desafios. O Ateliê das Cores tem seis desafios; a Oficina das Formas e a Trilha dos Números têm nove cada; as demais áreas têm três cada:

1. Ateliê das Cores — seis desafios em dificuldade crescente: padrão de duas cores, pintura por legenda de três cores, sequência de três cores, ciclo com quatro alternativas, matriz cromática 3×3 e pintura de nove alvos com quatro cores.
2. Oficina das Formas — oito desafios progressivos: (1) combinar cor e forma; (2) ligar pontos por arraste contínuo para formar um pentágono e contar cinco pontas, com ponto seguinte ampliado e feedback facial; (3) sequência de forma e cor; (4) sequência de formas; (5) comparar quatro camadas de formas encaixadas; (6) localizar o pentágono de uma cor específica entre 14 figuras coloridas; (7) sequência com três características; (8) classificar 12 formas embaralhadas em três grupos por arraste e soltura. A complexidade progride de reconhecimento e sequências para composição, discriminação de dois atributos e classificação.
3. Trilha dos Números — nove desafios progressivos: observar e contar seis pulos animados de um sapo; resolver nove somas curtas (+1, +2 e +3, três de cada); somar grupos ilustrados; contar até oito; comparar quantidades; completar sequência de +1; somar grupos maiores; completar sequência de +2; e descobrir uma parcela que falta. O desafio de adição avança uma questão por vez e só conclui após as nove respostas.
4. Jardim das Regras — padrões repetidos, elemento diferente e sequência de direções.
5. Mapa dos Caminhos — seguir setas em uma grade, localizar posições e completar uma matriz.
6. Estação das Combinações — pares de características, proporções e padrões compostos.
7. Cabana dos Sinais e Sons — letras como formas visuais e reconhecimento de sequências sonoras.

Cada área pode ser visitada independentemente. Não há cronômetro, vidas, pontuação por velocidade ou penalização por tentativas incorretas.

## Interações

- Seleção por toque/clique em alvos grandes.
- Paleta de cores lateral, com número e amostra selecionável; a criança escolhe a cor e toca no elemento a pintar. Em telas estreitas, a paleta passa para uma faixa horizontal.
- Sequências com um espaço vazio e opções visuais.
- Contagem e comparação de conjuntos de objetos.
- Operações simples com grupos visíveis de elementos.
- Grades espaciais com pegada inicial e setas de direção.
- Quadros/matrizes com uma peça faltante.
- Pilhas para comparar proporções.
- Reprodução opcional de instruções com a síntese de voz pt-BR.
- Sequências sonoras produzidas no próprio navegador com Web Audio; não dependem de vídeos, serviços externos ou arquivos de música.

O aluno não precisa arrastar elementos como único meio de resposta. Nesta primeira versão, os exercícios usam seleção e paleta por toque/clique; interações arrastáveis podem ser introduzidas depois, sempre com alternativa equivalente por seleção.

## Capi Pintora

O painel apresenta a ilustração da Capi Pintora e um botão externo. O link ficará desativado enquanto não houver endereço HTTPS configurado.

Quando o aplicativo estiver hospedado no GitHub Pages, preencher painterUrl em activities/capi-logica/assets/js/config.js. O link será aberto em uma nova aba; a atividade principal permanecerá aberta e o progresso continuará separado.

O exercício de pintura interno já funciona com paleta e legenda numérica, não dependendo da disponibilidade do aplicativo externo.

## Progresso e dados

- Chave local independente: exploradores.capi-logica.progress.v1.
- O progresso registra apenas os identificadores dos desafios concluídos.
- O armazenamento usa localStorage, com fallback para sessionStorage e memória.
- Reiniciar o progresso afeta somente esta atividade.
- Não são registrados nomes, diagnósticos nem dados pessoais.

## Diretrizes de interface e acessibilidade

- Mascote Capi como presença recorrente e acolhedora.
- Uma tarefa principal por tela.
- Controles grandes e espaçados, adequados a Chromebook, mouse, touchpad e tela sensível ao toque.
- Instrução visual como canal principal; áudio é complementar.
- Rótulos acessíveis para botões e símbolos.
- Contraste suficiente; a cor não é o único canal quando há número, forma ou posição.
- Respeito a prefers-reduced-motion.
- Sem música de fundo ou reprodução automática.

## Referências visuais recebidas

As referências fornecidas inspiram os seguintes formatos: sequência de cores e números, pintura de círculos por legenda, setas e posição em torno de objetos, desenho por paleta, padrões de direção, comparação de formas e pilhas, contagem e operações ilustradas, mosaicos/matrizes e pareamento por posição. As imagens de referência não são copiadas como folhas de atividade dentro do aplicativo; os desafios foram reconstruídos como componentes interativos responsivos.

## Estrutura técnica

- activities/capi-logica/index.html — ponto de entrada.
- assets/css/capi-logica.css — interface responsiva e estilos dos jogos.
- assets/js/config.js — endereço futuro da Capi Pintora.
- assets/js/games.js — catálogo de áreas, desafios, regras e respostas.
- assets/js/progress.js — persistência isolada.
- assets/js/activity.js — mapa, renderização, respostas, paleta lateral, voz e sons.
- assets/images/capi-pintora.svg — ilustração vetorial da Capi Pintora.
- tests/validate-activity.mjs — dados, regras e progresso.
- tests/validate-repository.mjs — estrutura, configuração e rota do catálogo.

Sem frameworks ou dependências externas. Para executar localmente, iniciar um servidor HTTP a partir da raiz do repositório e abrir activities/capi-logica/index.html.
