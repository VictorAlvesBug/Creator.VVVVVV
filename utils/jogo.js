import createApi from './api.js';
import createDesenho from './desenho.js';
import createUtils from './utils.js';

export default function createJogo(ctx) {
  const jogo = {};

  const api = createApi();
  const desenho = createDesenho(ctx);
  const utils = createUtils();

  let idFaseAtual = null;

  let mundo = null;
  let periodoAguardarParaAtualizar = 2000;
  let momentoUltimaAtualizacao = 0;

  jogo.tipo = 'chao';
  jogo.modelo = 'comum';

  function retornarNomeMundoAtual(){
    return localStorage.getItem('nome-mundo') || 'mundo-nao-salvo';
  }

  function alterarNomeMundoAtual(novoNomeMundo){
    localStorage.setItem('nome-mundo', novoNomeMundo)
  }

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
          .retornarMundo(retornarNomeMundoAtual())
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
    
    desenho.desenharContornoChao(faseAtual.partes);
  };

  function otimizarMundo(objMundo) {
    objMundo.fases.forEach((fase) => {
      fase = dividirBlocosGrandes(fase);

      let qtdePartes;

      do{
        qtdePartes = fase.partes.length;
        fase = unificarPartesAdjacentes(fase);
        fase = unificarPartesDuplicadas(fase);
      } 
      while(qtdePartes !== fase.partes.length);
    });

    return objMundo;
  }

  function parteAEstaContidaNaParteB(pA, pB) {
    if (
      !pA.hasOwnProperty('esquerda') ||
      !pA.hasOwnProperty('largura') ||
      !pA.hasOwnProperty('topo') ||
      !pA.hasOwnProperty('altura') ||
      !pB.hasOwnProperty('esquerda') ||
      !pB.hasOwnProperty('largura') ||
      !pB.hasOwnProperty('topo') ||
      !pB.hasOwnProperty('altura')
    ) {
      return console.error(
        'As partes A e B devem conter todas as propriedades obrigatórias',
        pA,
        pB
      );
    }

    return (
      utils.estaEntre(pA.esquerda, pB.esquerda, pB.esquerda + pB.largura) &&
      utils.estaEntre(
        pA.esquerda + pA.largura,
        pB.esquerda,
        pB.esquerda + pB.largura
      ) &&
      utils.estaEntre(pA.topo, pB.topo, pB.topo + pB.altura) &&
      utils.estaEntre(pA.topo + pA.altura, pB.topo, pB.topo + pB.altura)
    );
  }

  function dividirBlocosGrandes(fase) {
    fase.partes = fase.partes.reduce((listaPartes, parte) => {

      for(let esquerda = parte.esquerda; esquerda < parte.esquerda+parte.largura; esquerda+=100){
        for(let topo = parte.topo; topo < parte.topo+parte.altura; topo+=100){
          const parteAdicionarLista = {
            id: api.gerarId(),
            tipo: parte.tipo,
            modelo: parte.modelo,
            esquerda,
            topo,
            largura: 100,
            altura: 100
          };
          listaPartes.push(parteAdicionarLista);
        }
      }


      return listaPartes;
    }, []);

    return fase;
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

        if (
          tipoEhOtimizavel &&
          !ehMesmaParte &&
          mesmoTipoEModelo &&
          ((alinhadasHorizontalmente && adjacentesHorizontalmente) ||
            (alinhadasVerticalmente && adjacentesVerticalmente) ||
            parteAEstaContidaNaParteB(pA, pB))
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
      const parteJaFoiAdicionada = listaPartes.some((parteB) => {
        const { id: _, ...pA } = parteA;
        const { id: __, ...pB } = parteB;
        return JSON.stringify(pA) === JSON.stringify(pB);
      });
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
    const areaClicada = desenho.retornarAreaMouse(mouse);

    jogo.mouseRemoverBloco(mouse);

    mundo.fases.forEach((fase) => {
      if (fase.id === idFaseAtual) {
        fase.partes.push({
          id: api.gerarId(),
          tipo: jogo.tipo,
          modelo: jogo.modelo,
          ...areaClicada
        });
      }
    });

    api.salvarMundo(retornarNomeMundoAtual(), otimizarMundo(mundo));
  };

  jogo.mouseRemoverBloco = (mouse) => {
    const areaClicada = desenho.retornarAreaMouse(mouse);

    mundo.fases.forEach((fase) => {
      if (fase.id === idFaseAtual) {
        fase.partes.forEach((parte) => {
          if (parteAEstaContidaNaParteB(areaClicada, parte)) {
            const manterAreaEsquerda = parte.esquerda < areaClicada.esquerda;

            const manterAreaDireita =
              parte.esquerda + parte.largura >
              areaClicada.esquerda + areaClicada.largura;

            const manterAreaSuperior = parte.topo < areaClicada.topo;

            const manterAreaInferior =
              parte.topo + parte.altura > areaClicada.topo + areaClicada.altura;

            // Remover parte
            fase.partes = fase.partes.filter((p) => p.id !== parte.id);

            if (manterAreaEsquerda) {
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: parte.topo,
                altura: parte.altura,
                esquerda: parte.esquerda,
                largura: areaClicada.esquerda - parte.esquerda,
              });
            }

            if (manterAreaDireita) {
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: parte.topo,
                altura: parte.altura,
                esquerda: areaClicada.esquerda + areaClicada.largura,
                largura:
                  parte.esquerda +
                  parte.largura -
                  (areaClicada.esquerda + areaClicada.largura),
              });
            }

            if (manterAreaSuperior) {
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: parte.topo,
                altura: areaClicada.topo - parte.topo,
                esquerda: areaClicada.esquerda,
                largura: areaClicada.largura,
              });
            }

            if (manterAreaInferior) {
              fase.partes.push({
                id: api.gerarId(),
                tipo: parte.tipo,
                modelo: parte.modelo,
                topo: areaClicada.topo + areaClicada.altura,
                altura:
                  parte.topo +
                  parte.altura -
                  (areaClicada.topo + areaClicada.altura),
                esquerda: areaClicada.esquerda,
                largura: areaClicada.largura,
              });
            }
          }
        });
      }
    });

    api.salvarMundo(retornarNomeMundoAtual(), otimizarMundo(mundo));
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
        const chao = 
        desenhoBotao.desenharChao({
          modelo: 'comum',
          esquerda: 45,
          topo: 45,
          largura: 100,
          altura: 100,
          comContorno: true
        });
        break;

      case 'espinho':
        desenhoBotao.desenharEspinho({
          modelo: 'cima',
          esquerda: 45,
          topo: 45,
          largura: 100,
          altura: 100,
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
      switch(tipo){
        case 'limpar-fase':
          if(confirm("Deseja apagar toda a fase?")){
            jogo.limparFase();
          }
          break;

        case 'salvar-mundo':
          let nomeMundoSalvar;
          
          do{
            nomeMundoSalvar = prompt('Digite um nome para este mundo', retornarNomeMundoAtual());
          }
          while(nomeMundoSalvar !== null && nomeMundoSalvar.trim().length === 0);

          if(!nomeMundoSalvar){
            return;
          }

          if(!nomeMundoSalvar || nomeMundoSalvar.trim().length === 0){
            return alert('Nome inválido. Mundo não salvo.');
          }
          
          alterarNomeMundoAtual(nomeMundoSalvar);
          api.salvarMundo(nomeMundoSalvar, otimizarMundo(mundo));
          break;

        case 'abrir-mundo':
          api.listarMundos()
            .then(listaMundos => {
              const strListaMundos = listaMundos.reduce((acc, nomeMundo, indice) => {
                return `${acc}\n${indice+1} - ${nomeMundo}`
              }, '');

              if(strListaMundos.length === 0){
                return alert('Nenhum mundo encontrado.');
              }

              let indiceMundoSelecionado = Number(prompt(`Qual mundo deseja abrir?${strListaMundos}`)) - 1;

              if(!utils.estaEntre(indiceMundoSelecionado, 0, listaMundos.length-1)){
                return alert('Mundo inválido.')
              }

              alterarNomeMundoAtual(listaMundos[indiceMundoSelecionado]);
            });
          break;

          case 'navegar-fase-cima':
            api.acessarFase(retornarNomeMundoAtual(), idFaseAtual, 'cima')
              .then(idFase => {
                idFaseAtual = idFase;
                momentoUltimaAtualizacao = 0;
              })
            break;

            case 'navegar-fase-baixo':
              api.acessarFase(retornarNomeMundoAtual(), idFaseAtual, 'baixo')
                .then(idFase => {
                  idFaseAtual = idFase;
                  momentoUltimaAtualizacao = 0;
                })
              break;

              case 'navegar-fase-esquerda':
                api.acessarFase(retornarNomeMundoAtual(), idFaseAtual, 'esquerda')
                  .then(idFase => {
                    idFaseAtual = idFase;
                    momentoUltimaAtualizacao = 0;
                  })
                break;

                case 'navegar-fase-direita':
                  api.acessarFase(retornarNomeMundoAtual(), idFaseAtual, 'direita')
                    .then(idFase => {
                      idFaseAtual = idFase;
                      momentoUltimaAtualizacao = 0;
                    })
                  break;

        default:
          jogo.tipo = tipo;
          jogo.modelo = modelo;
          break;
      }
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
    mundo.fases.forEach((fase) => {
      if (fase.id === idFaseAtual) {
        fase.partes = [];
      }
    });

    api.salvarMundo(retornarNomeMundoAtual(), otimizarMundo(mundo));
  };

  return jogo;
}
