import createApi from './api.js';
import createDesenho from './desenho.js';

export default function createJogo(ctx, nomeMundo) {
  const jogo = {};

  const api = createApi();
  const desenho = createDesenho(ctx);

  let idFaseAtual = null;

  let mundo = null;
  let periodoAguardarParaAtualizar = 2000;
  let momentoUltimaAtualizacao = 0;

  jogo.tipo = 'chao';
  jogo.modelo = 'comum';

  async function retornarFaseAtual() {
    return jogo
      .atualizarMundo()
      .then(() => {
        if (!idFaseAtual) {
          idFaseAtual = mundo.idFaseInicial;
        }

        return mundo.fases.find((fase) => fase.id == idFaseAtual);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  jogo.inicializar = async () => {
    await jogo.atualizarMundo;
  };

  jogo.atualizarMundo = async () => {
    return new Promise((resolve, reject) => {
      const momentoAtual = Date.now();
      if (
        momentoUltimaAtualizacao + periodoAguardarParaAtualizar <
        momentoAtual
      ) {
        api
          .retornarMundo(nomeMundo)
          .then((mundoAtualizado) => {
            mundo = mundoAtualizado;
            momentoUltimaAtualizacao = momentoAtual;
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        resolve();
      }
    });
  };

  jogo.desenharFaseAtual = async () => {
    const faseAtual = await retornarFaseAtual();

    if (!faseAtual) {
      return console.error(`Fase '${idFaseAtual}' não encontrada.`);
    }

    desenho.limparCanvas();
    desenho.desenharGrid();

    faseAtual.partes.forEach((parte) => {
      switch (parte.tipo) {
        case 'chao':
          desenho.desenharChao(parte);
          break;

        case 'espinho':
          desenho.desenharEspinho(parte);
          break;

        default:
          return console.error(`Parte do tipo '${parte.tipo}' não encontrada.`);
      }
    });
  };

  function otimizarMundo(objMundo) {
    objMundo.fases.forEach((fase) => {
      let partesAdjacentes, partesSobrepostas;

      //do {
      fase = unificarPartesAdjacentes(fase);
      fase = unificarPartesDuplicadas(fase);
      //} while (partesAdjacentes?.repetir);

      //do {
      //partesSobrepostas = unificarPartesSobrepostas(fase);
      //fase = partesSobrepostas.fase;
      //} while (partesSobrepostas?.repetir);
    });

    return objMundo;
  }

  function estaEntre(valor, minimo, maximo) {
    if (isNaN(valor)) {
      return console.error(`Valor ${valor} inválido.`);
    }

    if (isNaN(minimo)) {
      return console.error(`Valor ${minimo} inválido.`);
    }

    if (isNaN(maximo)) {
      return console.error(`Valor ${maximo} inválido.`);
    }

    return valor >= minimo && valor <= maximo;
  }

  function unificarPartesAdjacentes(fase) {
    fase.partes = fase.partes.reduce((listaPartes, pA) => {
      let parteAdicionarLista = pA;

      fase.partes.forEach((pB) => {
        const listaTiposOtimizaveis = ['chao'];
        const tipoEhOtimizavel = listaTiposOtimizaveis.includes(pA.tipo);

        const ehMesmaParte = pA.id === pB.id;

        const mesmoTipoEModelo = pA.tipo === pB.tipo && pA.modelo === pB.modelo;

        const alinhadasHorizontalmente =
          pA.topo === pB.topo && pA.altura === pB.altura;

        const adjacentesHorizontalmente =
          pA.esquerda + pA.largura === pB.esquerda ||
          pB.esquerda + pB.largura === pA.esquerda;

        const alinhadasVerticalmente =
          pA.esquerda === pB.esquerda && pA.largura === pB.largura;

        const adjacentesVerticalmente =
          pA.topo + pA.altura === pB.topo || pB.topo + pB.altura === pA.topo;

        const parteAEstaContidaNaParteB =
          estaEntre(pA.esquerda, pB.esquerda, pB.esquerda + pB.largura) &&
          estaEntre(
            pA.esquerda + pA.largura,
            pB.esquerda,
            pB.esquerda + pB.largura
          ) &&
          estaEntre(pA.topo, pB.topo, pB.topo + pB.altura) &&
          estaEntre(pA.topo + pA.altura, pB.topo, pB.topo + pB.altura);

        if (
          tipoEhOtimizavel &&
          !ehMesmaParte &&
          mesmoTipoEModelo &&
          ((alinhadasHorizontalmente && adjacentesHorizontalmente) ||
            (alinhadasVerticalmente && adjacentesVerticalmente) ||
            parteAEstaContidaNaParteB)
        ) {
          const esquerda = Math.min(pA.esquerda, pB.esquerda);
          const topo = Math.min(pA.topo, pB.topo);
          const direita = Math.max(
            pA.esquerda + pA.largura,
            pB.esquerda + pB.largura
          );
          const base = Math.max(pA.topo + pA.altura, pB.topo + pB.altura);

          parteAdicionarLista.esquerda = esquerda;
          parteAdicionarLista.topo = topo;
          parteAdicionarLista.largura = direita - esquerda;
          parteAdicionarLista.altura = base - topo;
        }
      });

      listaPartes.push(parteAdicionarLista);

      return listaPartes;
    }, []);

    return fase;
  }

  function unificarPartesDuplicadas(fase) {
    fase.partes = fase.partes.reduce((listaPartes, parteA) => {
      const parteJaFoiAdicionada = listaPartes.some(
        (parteB) => {
          const {id: _, ...pA} = parteA;
          const {id: __, ...pB} = parteB;
          return JSON.stringify(pA) === JSON.stringify(pB); 
        }
      );
      if (!parteJaFoiAdicionada) {
        listaPartes.push(parteA);
      }

      return listaPartes;
    }, []);

    return fase;
  }

  jogo.desenharBlocoMouseHover = (mouse) => {
    desenho.desenharBlocoMouseHover(mouse, jogo.tipo, jogo.modelo);
  };

  jogo.mouseAdicionarBloco = (mouse) => {
    const largura = 100;
    const altura = 100;
    let esquerda = mouse.X - largura / 2;
    let topo = mouse.Y - altura / 2;

    // Arredondar posição para bloco do grid mais próximo
    esquerda = Math.round(esquerda / 100) * 100;
    topo = Math.round(topo / 100) * 100;

    mundo.fases.forEach((fase) => {
      if (fase.id === idFaseAtual) {
        fase.partes.push({
          id: api.gerarId(),
          tipo: jogo.tipo,
          modelo: jogo.modelo,
          esquerda,
          topo,
          largura,
          altura,
        });
      }
    });

    api.salvarMundo(nomeMundo, otimizarMundo(mundo));
  };

  jogo.mouseRemoverBloco = (mouse) => {
    const largura = 100;
    const altura = 100;
    let esquerda = mouse.X - largura / 2;
    let topo = mouse.Y - altura / 2;

    // Arredondar posição para bloco do grid mais próximo
    esquerda = Math.round(esquerda / 100) * 100;
    topo = Math.round(topo / 100) * 100;

    const areaClicada = {
      largura,
      altura,
      esquerda,
      topo
    };

    mundo.fases.forEach(fase => {
      if(fase.id === idFaseAtual){
        fase.partes.forEach(parte => {
          const parteContemAreaClicada = 
            estaEntre(areaClicada.esquerda, parte.esquerda, parte.esquerda + parte.largura) &&
            estaEntre(
              areaClicada.esquerda + areaClicada.largura,
              parte.esquerda,
              parte.esquerda + parte.largura
            ) &&
            estaEntre(areaClicada.topo, parte.topo, parte.topo + parte.altura) &&
            estaEntre(areaClicada.topo + areaClicada.altura, parte.topo, parte.topo + parte.altura) 
    
          if(parteContemAreaClicada){
            const manterAreaEsquerda = 
              parte.esquerda < areaClicada.esquerda;
    
            const manterAreaDireita = 
              parte.esquerda + parte.largura > areaClicada.esquerda + areaClicada.largura;
    
            const manterAreaSuperior = 
              parte.topo < areaClicada.topo;
    
            const manterAreaInferior = 
              parte.topo + parte.altura > areaClicada.topo + areaClicada.altura;
            
            // Remover parte
            fase.partes = fase.partes.filter(p => 
              p.id !== parte.id);
            
            if(manterAreaEsquerda){
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: parte.topo,
                altura: parte.altura,
                esquerda: parte.esquerda,
                largura: areaClicada.esquerda - parte.esquerda
              });
            }
            
            if(manterAreaDireita){
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: parte.topo,
                altura: parte.altura,
                esquerda: areaClicada.esquerda + areaClicada.largura,
                largura: parte.esquerda + parte.largura - (areaClicada.esquerda + areaClicada.largura)
              });
            }
            
            if(manterAreaSuperior){
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: parte.topo,
                altura: areaClicada.topo - parte.topo,
                esquerda: areaClicada.esquerda,
                largura: areaClicada.largura
              });
            }
            
            if(manterAreaInferior){
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: areaClicada.topo + areaClicada.altura,
                altura: parte.topo + parte.altura - (areaClicada.topo + areaClicada.altura),
                esquerda: areaClicada.esquerda,
                largura: areaClicada.largura
              });
            }
          }
          
        });
      }
    });

    api.salvarMundo(nomeMundo, otimizarMundo(mundo));
  };

  jogo.mouseCopiarBloco = (mouse) => {};

  jogo.desenharCanvasBotao = (botao, tipo) => {
    const ctxBotao = botao.querySelector('canvas')?.getContext('2d');

    if (!ctxBotao) {
      return;
    }

    const desenhoBotao = createDesenho(ctxBotao);

    switch (tipo) {
      case 'chao':
        desenhoBotao.desenharChao({
          modelo: 'comum',
          esquerda: 15,
          topo: 15,
          largura: 70,
          altura: 70,
        });
        break;

      case 'espinho':
        desenhoBotao.desenharEspinho({
          modelo: 'cima',
          esquerda: 15,
          topo: 15,
          largura: 70,
          altura: 70,
        });
        break;

      case 'limpar-fase':
        break;

      default:
        console.error(`Tipo de bloco '${tipo}' não encontrado.`);
        break;
    }
  };

  jogo.adicionarEventoBotao = (botao, tipo, modelo) => {
    botao.addEventListener('click', () => {
      if (tipo === 'limpar-fase') {
        jogo.limparFase();
        return;
      }

      jogo.tipo = tipo;
      jogo.modelo = modelo;
    });
  };

  jogo.girarBlocoMouse = () => {
    switch (jogo.tipo) {
      case 'chao':
        break;

      case 'espinho':
        switch (jogo.modelo) {
          case 'cima':
            jogo.modelo = 'direita';
            break;

          case 'direita':
            jogo.modelo = 'baixo';
            break;

          case 'baixo':
            jogo.modelo = 'esquerda';
            break;

          case 'esquerda':
            jogo.modelo = 'cima';
            break;
        }
        break;

      default:
        console.error(`Tipo de bloco '${tipo}' não encontrado.`);
        break;
    }
  };

  jogo.limparFase = () => {
    console.log(mundo);
    mundo.fases.forEach((fase) => {
      if (fase.id === idFaseAtual) {
        fase.partes = [];
      }
    });

    api.salvarMundo(nomeMundo, otimizarMundo(mundo));
  };

  return jogo;
}
