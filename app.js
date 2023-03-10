import createJogo from './utils/jogo.js';
import createMouse from './utils/mouse.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
console.log(ctx);

const nomeMundo = 'mundo-01';
const jogo = createJogo(ctx, nomeMundo);
const mouse = createMouse();

setup().then(() => {
  setInterval(loop, 50);
});

async function setup(){
  jogo.inicializar();

  const botoesFerramentas = document.querySelectorAll('.btn-ferramenta');

  botoesFerramentas.forEach(botaoFerramenta => {
    const tipo = botaoFerramenta.getAttribute('data-tipo');
    const modelo = botaoFerramenta.getAttribute('data-modelo');
    
    jogo.desenharCanvasBotao(botaoFerramenta, tipo);
    jogo.adicionarEventoBotao(botaoFerramenta, tipo, modelo);
  });
}

async function loop() {
  await jogo.desenharFaseAtual();

  if (mouse.posicao.valida) {
    switch (mouse.statusBotao) {
      case mouse.BOTAO_SOLTO:
        jogo.desenharBlocoMouseHover(mouse.posicao);
        break;
      case mouse.BOTAO_ESQUERDO:
        jogo.mouseAdicionar(mouse.posicao);
        break;
      case mouse.BOTAO_DIREITO:
        jogo.mouseRemover(mouse.posicao);
        break;
      case mouse.BOTAO_MEIO:
        jogo.mouseCopiar(mouse.posicao);
        break;
    }
  }
}

Object.entries(mouse.objEventos).forEach(([nomeEvento, funcao]) => {
  canvas.addEventListener(nomeEvento, funcao);
});

document.addEventListener('keydown', (event) => {
  if(event.key.toUpperCase() === 'R'){
    jogo.girarBlocoMouse();
  }
})