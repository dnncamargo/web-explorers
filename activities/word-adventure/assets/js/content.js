(function (global) {
  const worlds = [
    {
      id: "sound-island", number: 1, title: "Ilha dos Sons", subtitle: "Escutar, brincar e descobrir os pedaços das palavras",
      theme: "island", goal: "Perceber que palavras faladas têm partes e sons que podemos comparar.",
      skills: ["Escuta e atenção à palavra", "Segmentação oral em sílabas", "Comparação de sons iniciais"],
      bncc: ["EF01LP06", "EF01LP09"],
      stages: [
        { title: "O chamado da ilha", objective: "Associar palavra falada ao que ela nomeia", kind: "listen-picture", prompt: "Ouça a palavra. Qual figura combina com o que você ouviu?", items: [
          {word:"BOLA",syllables:["BO","LA"],emoji:"⚽",sound:"BOLA"},{word:"MALA",syllables:["MA","LA"],emoji:"🧳",sound:"MALA"},{word:"PATO",syllables:["PA","TO"],emoji:"🦆",sound:"PATO"}]},
        { title: "Palmas para as palavras", objective: "Segmentar oralmente palavras em sílabas", kind: "syllable-count", prompt: "Fale a palavra devagar. Bata palmas para cada pedaço e escolha quantos pedaços ouviu.", items: [
          {word:"BOLO",emoji:"🍰",syllables:["BO","LO"]},{word:"SAPO",emoji:"🐸",syllables:["SA","PO"]},{word:"BANANA",emoji:"🍌",syllables:["BA","NA","NA"]},{word:"BONECA",emoji:"🪆",syllables:["BO","NE","CA"]}]},
        { title: "Quem começa parecido?", objective: "Comparar sons de sílabas iniciais", kind: "initial-sound", prompt: "Ouça a palavra principal. Qual outra começa com o mesmo pedaço?", items: [
          {word:"BOLA",emoji:"⚽",syllables:["BO","LA"],options:[{word:"BOLO",emoji:"🍰"},{word:"MALA",emoji:"🧳"},{word:"PATO",emoji:"🦆"}],answer:"BOLO"},
          {word:"MALA",emoji:"🧳",syllables:["MA","LA"],options:[{word:"MACA",emoji:"🍎"},{word:"BOLA",emoji:"⚽"},{word:"SAPO",emoji:"🐸"}],answer:"MACA"}]},
        { title: "O primeiro pedaço", objective: "Reconhecer a sílaba inicial em contexto oral", kind: "first-syllable", prompt: "Ouça e observe: escolha o primeiro pedaço falado.", items: [
          {word:"BONECA",emoji:"🪆",syllables:["BO","NE","CA"]},{word:"SAPATO",emoji:"👟",syllables:["SA","PA","TO"]},{word:"MACACO",emoji:"🐒",syllables:["MA","CA","CO"]}]}
      ]
    },
    {
      id: "letter-village", number: 2, title: "Vila das Letras", subtitle: "Descobrir que as letras representam sons da fala",
      theme: "village", goal: "Reconhecer letras e relacioná-las aos sons iniciais de palavras conhecidas.",
      skills: ["Reconhecimento de letras", "Correspondência som inicial–grafema", "Letras maiúsculas e minúsculas"],
      bncc: ["EF01LP04", "EF01LP05", "EF01LP07", "EF01LP10", "EF01LP11"],
      stages: [
        {title:"Letras na praça",objective:"Distinguir letras de outros sinais e reconhecer grafemas",kind:"find-letter",prompt:"Encontre a letra que aparece no começo da palavra.",items:[
          {word:"BOLA",emoji:"⚽",letter:"B",options:["B","A","M"]},{word:"MALA",emoji:"🧳",letter:"M",options:["P","M","O"]},{word:"SAPO",emoji:"🐸",letter:"S",options:["S","F","L"]}]},
        {title:"O som chama a letra",objective:"Associar fonema inicial ao grafema",kind:"sound-letter",prompt:"Ouça o começo da palavra. Escolha a letra que representa esse som.",items:[
          {word:"PATO",emoji:"🦆",letter:"P",options:["B","P","M"]},{word:"FADA",emoji:"🧚",letter:"F",options:["V","F","T"]},{word:"VACA",emoji:"🐮",letter:"V",options:["F","B","V"]}]},
        {title:"A mesma letra, outra roupa",objective:"Reconhecer grafias maiúsculas e minúsculas",kind:"case-match",prompt:"As letras podem ter formatos diferentes. Encontre a parceira da letra destacada.",items:[
          {letter:"B",answer:"b",options:["d","b","p"]},{letter:"M",answer:"m",options:["n","m","w"]},{letter:"P",answer:"p",options:["q","b","p"]}]},
        {title:"Letra no começo",objective:"Identificar grafema inicial em palavra familiar",kind:"word-initial",prompt:"Veja a palavra e encontre sua primeira letra.",items:[
          {word:"BOLA",emoji:"⚽",letter:"B",options:["L","B","A"]},{word:"MALA",emoji:"🧳",letter:"M",options:["M","A","L"]},{word:"PIPA",emoji:"🪁",letter:"P",options:["T","P","I"]}]}
      ]
    },
    {
      id: "syllable-workshop", number: 3, title: "Oficina das Sílabas", subtitle: "Juntar sons e letras para formar sílabas e palavras",
      theme: "workshop", goal: "Combinar sílabas simples do tipo consoante + vogal e perceber que elas formam palavras.",
      skills: ["Famílias silábicas CV", "Combinação de sílabas", "Decodificação de palavras regulares trabalhadas"],
      bncc: ["EF01LP05", "EF01LP08", "EF02LP03", "EF02LP04"],
      stages: [
        {title:"A família do M",objective:"Ler sílabas simples MA, ME, MI, MO, MU",kind:"syllable-family",prompt:"Ouça a sílaba e encontre o bloco que mostra esses sons juntos.",items:[
          {consonant:"M",vowel:"A",answer:"MA",options:["MA","ME","PA"]},{consonant:"M",vowel:"I",answer:"MI",options:["MO","MI","MA"]},{consonant:"M",vowel:"U",answer:"MU",options:["NU","MU","ME"]}]},
        {title:"A família do P",objective:"Ler sílabas simples PA, PE, PI, PO, PU",kind:"syllable-family",prompt:"Junte o som da letra P ao som da vogal.",items:[
          {consonant:"P",vowel:"A",answer:"PA",options:["BA","PA","MA"]},{consonant:"P",vowel:"O",answer:"PO",options:["PO","PU","PE"]},{consonant:"P",vowel:"I",answer:"PI",options:["BI","PI","MI"]}]},
        {title:"Junte os blocos",objective:"Combinar sílabas ensinadas para formar palavras",kind:"build-word",prompt:"Escolha as sílabas na ordem para montar a palavra que você ouve.",items:[
          {word:"PIPA",emoji:"🪁",syllables:["PI","PA"],pool:["PA","PI","MA"]},{word:"PIPA",emoji:"🪁",syllables:["PI","PA"],pool:["PI","MA","PA"]},{word:"MAPA",emoji:"🗺️",syllables:["MA","PA"],pool:["PA","MA","PI"]}]},
        {title:"A palavra aparece",objective:"Decodificar palavras regulares com sílabas já ensinadas",kind:"decode-word",prompt:"Leia os blocos. Depois escolha a palavra completa.",items:[
          {word:"PIPA",emoji:"🪁",parts:["PI","PA"],options:["PIPA","PAPA","MIPA"]},{word:"MAPA",emoji:"🗺️",parts:["MA","PA"],options:["MAMA","MAPA","PAMA"]},{word:"MIMO",emoji:"🎁",parts:["MI","MO"],options:["MIMO","POMO","MIMU"]}]}
      ]
    },
    {
      id: "word-market", number: 4, title: "Mercado das Palavras", subtitle: "Ler palavras úteis para fazer escolhas no cotidiano",
      theme: "market", goal: "Decodificar palavras familiares e usar a leitura para resolver uma situação.",
      skills: ["Leitura de palavras familiares", "Palavra e significado", "Uso funcional da leitura"],
      bncc: ["EF12LP01", "EF12LP04", "EF01LP08"],
      stages: [
        {title:"As etiquetas",objective:"Ler palavras curtas e relacioná-las ao referente",kind:"read-label",prompt:"Leia a etiqueta e escolha o item correspondente.",items:[
          {word:"PIPA",emoji:"🪁",options:[{word:"PIPA",emoji:"🪁"},{word:"MAPA",emoji:"🗺️"},{word:"MALA",emoji:"🧳"}]},{word:"MAPA",emoji:"🗺️",options:[{word:"PIPA",emoji:"🪁"},{word:"MAPA",emoji:"🗺️"},{word:"PATO",emoji:"🦆"}]},{word:"MALA",emoji:"🧳",options:[{word:"MALA",emoji:"🧳"},{word:"MIMO",emoji:"🎁"},{word:"PIPA",emoji:"🪁"}]}]},
        {title:"O que está escrito?",objective:"Decodificar palavra com apoio reduzido da imagem",kind:"word-choice",prompt:"Observe a palavra. Escolha a imagem que combina com o que está escrito.",items:[
          {word:"PATO",emoji:"🦆",options:[{word:"PATO",emoji:"🦆"},{word:"PIPA",emoji:"🪁"},{word:"BOLA",emoji:"⚽"}]},{word:"BOLA",emoji:"⚽",options:[{word:"MALA",emoji:"🧳"},{word:"BOLA",emoji:"⚽"},{word:"MAPA",emoji:"🗺️"}]}]},
        {title:"A lista da aventura",objective:"Ler uma lista curta para selecionar itens",kind:"list-task",prompt:"A lista mostra o que levar. Selecione os dois itens escritos.",items:[
          {list:["PIPA","MALA"],options:[{word:"PIPA",emoji:"🪁"},{word:"BOLA",emoji:"⚽"},{word:"MALA",emoji:"🧳"}],answer:["PIPA","MALA"]}]},
        {title:"Uma mensagem importante",objective:"Compreender uma instrução funcional curta",kind:"message-task",prompt:"Ouça a mensagem e faça o que ela pede.",items:[
          {message:"PEGUE O MAPA.",spoken:"Pegue o mapa.",target:"MAPA",options:[{word:"MALA",emoji:"🧳"},{word:"MAPA",emoji:"🗺️"},{word:"PATO",emoji:"🦆"}]},{message:"LEVE A PIPA.",spoken:"Leve a pipa.",target:"PIPA",options:[{word:"BOLA",emoji:"⚽"},{word:"PIPA",emoji:"🪁"},{word:"MAPA",emoji:"🗺️"}]}]}
      ]
    }
  ];

  const bonus = {
    id:"story-city", number:5, title:"Cidade das Histórias", subtitle:"Ler para compreender e fazer acontecer",
    theme:"city", goal:"Usar leitura e escuta para compreender mensagens e pequenas situações.",
    skills:["Compreensão literal","Leitura de bilhetes, listas e placas","Relação entre texto e ação"],
    bncc:["EF12LP02","EF12LP04"],
    stages:[
      {title:"A placa da cidade",objective:"Ler placa e localizar destino",kind:"sign-task",prompt:"Leia a placa e escolha para onde ela aponta.",items:[
        {message:"VÁ AO MAPA",target:"MAPA",options:[{word:"MALA",emoji:"🧳"},{word:"MAPA",emoji:"🗺️"},{word:"PIPA",emoji:"🪁"}]}]},
      {title:"O bilhete",objective:"Compreender informação explícita em bilhete curto",kind:"note-task",prompt:"Leia o bilhete. O que a pessoa pediu?",items:[
        {message:"LEVE A BOLA.",target:"BOLA",options:[{word:"PATO",emoji:"🦆"},{word:"BOLA",emoji:"⚽"},{word:"MALA",emoji:"🧳"}]}]},
      {title:"A frase ganha sentido",objective:"Organizar palavras para formar uma frase significativa",kind:"sentence-order",prompt:"Coloque as palavras na ordem para formar a mensagem.",items:[
        {words:["A","PIPA","É","MIA"],answer:["A","PIPA","É","MINHA"],hint:"A frase precisa dizer que a pipa pertence a alguém."}]}
    ]
  };

  global.WordAdventureContent = {worlds, bonus};
})(window);
