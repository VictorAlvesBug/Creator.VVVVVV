export default function createDesenho(ctx) {
  const desenho = {};

  desenho.limparCanvas = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  desenho.desenharGrid = () => {
    for (let x = 0; x < ctx.canvas.width / 100; x++) {
      const posX = x * 100;
      ctx.drawLine(posX, 0, posX, ctx.canvas.height, { color: '#aaa' });
    }

    for (let y = 0; y < ctx.canvas.height / 100; y++) {
      const posY = y * 100;
      ctx.drawLine(0, posY, ctx.canvas.width, posY, { color: '#aaa' });
    }
  };

  function retornarCoresBloco(tipo, modelo) {
    switch (tipo) {
      case 'chao':
        switch (modelo) {
          case 'comum':
            return { borda: '#0000ff', preenchimento: '#aaaaff', hachurado: '#7777aa'};

          default:
            return console.error(
              `Modelo '${modelo}' para bloco '${tipo}' não encontrado.`
            );
        }

        case 'espinho':
          return { borda: '#000000', preenchimento: '#aaaaaa'};

      default:
        return console.error(`Tipo de bloco '${tipo}' não encontrado.`);
    }
  }

  desenho.desenharChao = (chao) => {
    const coresBloco = retornarCoresBloco('chao', chao.modelo);

    ctx.drawRect(chao.esquerda, chao.topo, chao.largura, chao.altura, {
      fillColor: coresBloco.preenchimento,
      borderColor: coresBloco.borda,
      lineWidth: 4
    });

    if(coresBloco.hachurado){
      for(let i=chao.esquerda+chao.topo; i<chao.esquerda+chao.topo+chao.largura+chao.altura; i+= 15){

        const limites = {
          xMin: chao.esquerda,
          yMin: chao.topo,
          xMax: chao.esquerda+chao.largura,
          yMax: chao.topo+chao.altura
        };

        const linhaHachurar = {
          a: -1,
          b: i
        };
        
        let p1 = null;
        let p2 = null;
        
        for(let x=limites.xMin; x<=limites.xMax; x++){
          const y = linhaHachurar.a * x + linhaHachurar.b;
          if(y >= limites.yMin && y <= limites.yMax){
            p1 = p1 || {x, y};
            p2 = {x, y};
          }
        }
        
        if(p1 && p2){
          ctx.drawLine(p1.x, p1.y, p2.x, p2.y, {
            color: coresBloco.hachurado,
            lineWidth: 4
          })
        }
      }

    ctx.drawRect(chao.esquerda, chao.topo, chao.largura, chao.altura, {
      borderColor: coresBloco.borda,
      lineWidth: 4
    });
    }
  };

  desenho.desenharEspinho = (espinho) => {
    const coresBloco = retornarCoresBloco('espinho', espinho.modelo);

    const direita = espinho.esquerda+espinho.largura;
    const base = espinho.topo+espinho.altura;

    let p1, p2, p3;

    switch(espinho.modelo){
      case 'cima':
        p1 = { x: espinho.esquerda, y: base };
        p2 = { x: direita, y: base };
        p3 = { x: (espinho.esquerda + direita) / 2, y: espinho.topo };
        break;

        case 'baixo':
          p1 = { x: espinho.esquerda, y: espinho.topo };
          p2 = { x: direita, y: espinho.topo };
          p3 = { x: (espinho.esquerda + direita) / 2, y: base };
          break;

          case 'esquerda':
            p1 = { x: direita, y: espinho.topo };
            p2 = { x: direita, y: base };
            p3 = { x: espinho.esquerda, y: (espinho.topo + base) / 2 };
            break;

            case 'direita':
              p1 = { x: espinho.esquerda, y: espinho.topo };
              p2 = { x: espinho.esquerda, y: base };
              p3 = { x: direita, y: (espinho.topo + base) / 2 };
              break;

              default:
                console.error(`Modelo '${espinho.modelo}' para o tipo de bloco 'espinho' não encontrado.`);
                break;
                    
    }

    ctx.drawTriangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, {
      fillColor: coresBloco.preenchimento,
      borderColor: coresBloco.borda,
      lineWidth: 4
    });
  };

  desenho.desenharBlocoMouseHover = (mouse, tipo, modelo) => {
    const largura = 100;
    const altura = 100;
    let esquerda = mouse.X - largura / 2;
    let topo = mouse.Y - altura / 2;

    // Arredondar posição para bloco do grid mais próximo
    esquerda = Math.round(esquerda / 100) * 100;
    topo = Math.round(topo / 100) * 100;

    switch(tipo){
      case 'chao':
        desenho.desenharChao({
          modelo,
          esquerda,
          topo,
          largura,
          altura
        });
        break;
        case 'espinho':
          desenho.desenharEspinho({
            modelo,
            esquerda,
            topo,
            largura,
            altura
          });
          break;
          default:
            console.error(`Tipo de bloco '${tipo}' não encontrado.`)
            break;
    }
    
  };

  return desenho;
}
