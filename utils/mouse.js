export default function createMouse() {
  const mouse = {};

  mouse.BOTAO_SOLTO = 0;
  mouse.BOTAO_ESQUERDO = 1;
  mouse.BOTAO_DIREITO = 2;
  mouse.BOTAO_MEIO = 4;

  mouse.statusBotao = mouse.BOTAO_SOLTO;

  mouse.posicao = { X: null, Y: null, valida: false };

  function estaPressionado(buttons, botao) {
    const fatores = [];
    for (let fator = 1; fator <= 16; fator *= 2) {
      const resto = buttons % 2;
      if (resto == 1) {
        fatores.push(fator);
      }
      buttons = (buttons - resto) / 2;
    }

    return fatores.includes(botao);
  }

  function retornarStatusBotaoPressionado(buttons) {
    const listaBotoesVerificar = [
      mouse.BOTAO_ESQUERDO,
      mouse.BOTAO_DIREITO,
      mouse.BOTAO_MEIO,
    ];

    let retorno = mouse.BOTAO_SOLTO;

    listaBotoesVerificar.forEach((botao) => {
      if (retorno === mouse.BOTAO_SOLTO && estaPressionado(buttons, botao)) {
        retorno = botao;
      }
    });

    return retorno;
  }

  mouse.objEventos = {
    mousemove: ({ clientX, clientY, buttons }) => {
      const { left, top, width, height } = canvas.getBoundingClientRect();

      mouse.posicao.X = ((clientX - left) / width) * 1600;
      mouse.posicao.Y = ((clientY - top) / height) * 900;
      mouse.posicao.valida = true;

      mouse.statusBotao = retornarStatusBotaoPressionado(buttons);
    },
    mouseleave: () => {
      setTimeout(() => {
        mouse.posicao = { X: null, Y: null, valida: false };
        mouse.statusBotao = mouse.BOTAO_SOLTO;
      }, 50);
    },
    mousedown: ({ buttons }) => {
      mouse.statusBotao = retornarStatusBotaoPressionado(buttons);
    },
    mouseup: () => {
      mouse.statusBotao = mouse.BOTAO_SOLTO;
    },
  };

  return mouse;
}
