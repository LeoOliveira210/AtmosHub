/* =====================================================================
   AtmosHub — app.js
   Comentado linha a linha pra estudo.
   ===================================================================== */

const API_URL = "http://localhost:3000/api/leituras";
// "const" cria uma variável que NÃO pode ser reatribuída depois
// (diferente de "let", que pode mudar de valor).
// API_URL guarda o ENDEREÇO de onde vamos buscar os dados.
// Troquem esse valor pelo endereço real do backend do grupo.

const INTERVALO_MS = 30000;
// Quantidade de milissegundos entre cada busca automática de dados.
// 1000ms = 1 segundo, então 30000ms = 30 segundos.

const historico = {
  // Um "objeto" JavaScript: uma caixinha que guarda vários valores
  // relacionados, cada um com um nome (chave).

  horarios: [],
  // "[]" cria um "array" (uma lista) vazio. Vamos ir empilhando os
  // horários de cada leitura aqui dentro conforme elas chegam.

  temperaturas: [],
  umidades: [],
  // Mesma ideia: listas vazias que vão guardar os valores de
  // temperatura e umidade de cada leitura, na mesma ordem dos horários.
};

let grafico = null;
// "let" (diferente de "const") permite que essa variável mude de
// valor depois. Começa como "null" (vazio, "nada ainda") porque o
// gráfico ainda não foi criado — só vamos criá-lo na primeira vez
// que os dados chegarem.

async function buscarDados() {
  // "function" declara uma função: um bloco de código reutilizável
  // que a gente pode "chamar" (executar) quando quiser, digitando
  // buscarDados() em outro lugar do código.
  // A palavra "async" na frente significa: essa função vai fazer
  // alguma operação que DEMORA (tipo esperar a internet responder),
  // então ela pode usar a palavra "await" lá dentro.

  try {
    // "try" significa "tenta fazer isso". Se der erro em qualquer
    // linha aqui dentro, o código pula direto pro bloco "catch"
    // (mais abaixo) em vez de travar a página inteira.

    const resposta = await fetch(API_URL);
    // fetch() faz uma requisição HTTP pro endereço da API.
    // "await" pausa a execução dessa função (só dela, não da página
    // inteira) até a resposta chegar — sem isso, o código tentaria
    // usar a resposta antes dela existir de verdade.

    if (!resposta.ok) {
      // "resposta.ok" é "true" quando o servidor respondeu com
      // sucesso (código HTTP 200-299) e "false" quando deu erro
      // (tipo 404 "não encontrado" ou 500 "erro no servidor").
      // O "!" na frente INVERTE o valor: "!resposta.ok" lê-se
      // "se a resposta NÃO estiver ok".

      throw new Error("API respondeu com erro: " + resposta.status);
      // "throw" força um erro de propósito. Isso interrompe o "try"
      // e manda a execução direto pro "catch" abaixo.
      // resposta.status é o código numérico do erro (404, 500, etc).
    }

    const dados = await resposta.json();
    // A resposta chega como texto "cru". .json() converte esse
    // texto pra um objeto JavaScript de verdade, que a gente
    // consegue acessar com dados.temperatura, dados.umidade, etc.
    // De novo usamos "await" porque essa conversão também é
    // uma operação assíncrona (leva um tempinho).

    mostrarNaTela(dados);
    // Chama a função (definida mais abaixo) que escreve os
    // valores na página, passando os dados que acabamos de receber.

    guardarNoHistorico(dados);
    // Chama a função que guarda esses dados na lista de histórico,
    // pra alimentar o gráfico.

  } catch (erro) {
    // Esse bloco só roda SE algo dentro do "try" der errado
    // (a internet cair, a API não responder, etc). "erro" é uma
    // variável que guarda os detalhes do que deu errado.

    console.error("Não consegui buscar os dados:", erro);
    // Escreve o erro no Console do navegador (F12), só pra fins
    // de depuração — o usuário comum nunca vê o Console.

    document.getElementById("hora-atualizacao").textContent = "sem conexão";
    // document é um objeto especial que representa a página HTML
    // inteira. getElementById busca o elemento com aquele id
    // específico (lembra do id="hora-atualizacao" no HTML?).
    // .textContent troca o TEXTO de dentro daquele elemento.
  }
}

function mostrarNaTela(dados) {
  // Essa função recebe o objeto "dados" (vindo da API) como
  // parâmetro e escreve cada valor no elemento HTML certo.

  document.getElementById("temperatura").textContent = dados.temperatura + "°C";
  // Busca o elemento com id="temperatura" e escreve o valor da
  // temperatura, concatenado (grudado) com o símbolo de grau.
  // O "+" aqui está juntando texto com número, então o JavaScript
  // converte o número pra texto automaticamente antes de juntar.

  document.getElementById("umidade").textContent = dados.umidade;
  document.getElementById("pressao").textContent = dados.pressao;
  document.getElementById("luminosidade").textContent = dados.luminosidade;
  document.getElementById("chuva").textContent = dados.chuva;
  // Mesma lógica repetida pros outros 4 sensores. Repare que aqui
  // não precisamos concatenar unidade (%, hPa, lux, mm) porque elas
  // já estão escritas fixas no HTML, fora do <span>.

  document.getElementById("status-qualidade-ar").textContent =
    "Qualidade do ar: " + dados.qualidadeAr;
  // Aqui sim juntamos um texto fixo ("Qualidade do ar: ") com o
  // valor que veio da API (dados.qualidadeAr).

  const dataHora = new Date(dados.dataHora);
  // dados.dataHora chega da API como TEXTO (uma string, tipo
  // "2026-09-07T14:32:00"). new Date(...) converte esse texto
  // num objeto Date de verdade, que sabe fazer cálculos e
  // formatações de data/hora.

  document.getElementById("data-atual").textContent = dataHora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  // .toLocaleDateString() formata a data no padrão de um idioma
  // específico. "pt-BR" = português do Brasil. O objeto depois
  // define COMO formatar: weekday "long" escreve o dia da semana
  // por extenso ("segunda-feira"), day "2-digit" sempre usa 2
  // dígitos ("07" em vez de "7"), month "long" escreve o mês
  // por extenso ("setembro").

  document.getElementById("hora-atualizacao").textContent = dataHora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  // Mesma ideia, mas formatando só a HORA (não a data), no
  // formato "14:32".
}

function guardarNoHistorico(dados) {
  // Essa função guarda a leitura atual nas listas do histórico,
  // pra depois desenhar o gráfico com essa evolução ao longo do tempo.

  const hora = new Date(dados.dataHora).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  // Formata a hora de novo (igual fizemos acima), porque vamos
  // usar ela como "rótulo" de cada ponto no gráfico.

  historico.horarios.push(hora);
  // .push() adiciona um item no FINAL de um array.
  // Aqui, adicionamos a hora dessa leitura na lista de horários.

  historico.temperaturas.push(dados.temperatura);
  historico.umidades.push(dados.umidade);
  // Mesma coisa pra temperatura e umidade — mantemos as 3 listas
  // sincronizadas: a posição 0 de cada lista é sempre da mesma
  // leitura, a posição 1 da próxima, e assim por diante.

  if (historico.horarios.length > 20) {
    // .length é a quantidade de itens dentro de um array.
    // Se já tivermos mais de 20 leituras guardadas...

    historico.horarios.shift();
    historico.temperaturas.shift();
    historico.umidades.shift();
    // ...removemos o item mais ANTIGO de cada lista (.shift()
    // remove o primeiro item do array). Isso evita que o gráfico
    // fique poluído com leituras muito antigas — sempre mostramos
    // só as últimas 20.
  }

  desenharGrafico();
  // Depois de atualizar o histórico, chamamos a função que
  // redesenha o gráfico com os dados mais recentes.
}

function desenharGrafico() {
  const ctx = document.getElementById("grafico");
  // Busca o elemento <canvas id="grafico"> que está no HTML —
  // é a "tela" onde o Chart.js vai desenhar.

  if (grafico) {
    // Se a variável "grafico" já tem algum valor (ou seja, o
    // gráfico já foi criado antes)...

    grafico.data.labels = historico.horarios;
    // ...atualizamos os rótulos do eixo X (horizontal) do gráfico
    // com a lista de horários mais recente...

    grafico.data.datasets[0].data = historico.temperaturas;
    grafico.data.datasets[1].data = historico.umidades;
    // ...e atualizamos os valores das duas linhas do gráfico
    // (datasets[0] é a linha de temperatura, datasets[1] é a de
    // umidade — a ordem é a mesma em que foram criadas mais abaixo).

    grafico.update();
    // Manda o Chart.js redesenhar a tela com os dados novos.

    return;
    // "return" sai da função aqui — não queremos continuar pro
    // código de criar um gráfico do ZERO, já que ele já existe.
  }

  grafico = new Chart(ctx, {
    // Se chegamos até aqui, é porque "grafico" ainda era null —
    // primeira vez rodando essa função. Criamos o gráfico do zero
    // com "new Chart(...)" e guardamos o resultado na variável
    // "grafico" (que agora deixa de ser null pras próximas vezes).

    type: "line",
    // Tipo de gráfico: linha. Outras opções seriam "bar" (barras),
    // "pie" (pizza), etc.

    data: {
      labels: historico.horarios,
      // Os rótulos do eixo X — nesse caso, os horários de cada leitura.

      datasets: [
        // "datasets" é uma lista de "conjuntos de dados" — cada um
        // vira uma linha diferente no gráfico.

        {
          label: "Temperatura (°C)",
          // Nome que aparece na legenda do gráfico.

          data: historico.temperaturas,
          // Os valores numéricos dessa linha.

          borderColor: "#f6a95e",
          // Cor da linha no gráfico (mesmo âmbar usado no resto do design).
        },
        {
          label: "Umidade (%)",
          data: historico.umidades,
          borderColor: "#9b87f5",
          // Cor roxa pra essa segunda linha, pra diferenciar
          // visualmente da temperatura.
        },
      ],
    },

    options: {
      // Configurações extras de aparência do gráfico.

      plugins: {
        legend: { labels: { color: "#8993ab" } },
        // Cor do texto da legenda (onde aparece "Temperatura (°C)"
        // e "Umidade (%)").
      },

      scales: {
        x: { ticks: { color: "#8993ab" } },
        y: { ticks: { color: "#8993ab" } },
        // Cor dos números/textos que aparecem nos eixos X e Y
        // do gráfico. Sem isso, ficariam pretos e sumiriam no
        // fundo escuro do nosso design.
      },
    },
  });
}

buscarDados();
// Chama a função pela PRIMEIRA vez, assim que a página termina de
// carregar esse arquivo — sem isso, o usuário veria a tela vazia
// (com os "--") até completar 30 segundos.

setInterval(buscarDados, INTERVALO_MS);
// setInterval() é uma função do navegador que repete uma ação em
// intervalos regulares. Aqui, repete buscarDados() a cada
// INTERVALO_MS (30000ms = 30 segundos), pra sempre, enquanto essa
// página estiver aberta.