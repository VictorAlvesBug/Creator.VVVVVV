export default function createApi() {
  const urlApi = 'https://localhost:44320';
  const api = {};

  const direcoesFase = {
    cima: {
      origem: 'idFaseCima',
      destino: 'idFaseBaixo',
    },
    baixo: {
      origem: 'idFaseBaixo',
      destino: 'idFaseCima',
    },
    esquerda: {
      origem: 'idFaseEsquerda',
      destino: 'idFaseDireita',
    },
    direita: {
      origem: 'idFaseDireita',
      destino: 'idFaseEsquerda',
    },
  };

  api.gerarId = () => {
    const S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
  };

  api.listarMundos = async () => {
    return new Promise((resolve, reject) => {
      fetch(`${urlApi}/mundos`)
        .then((response) => response.json())
        .then((json) => resolve(json))
        .catch((err) => reject(`Erro ao retornar lista de mundos. Erro: ${err}`));
    });
  };

  api.retornarMundo = async (nomeMundo) => {
    return new Promise((resolve, reject) => {
      fetch(`${urlApi}/mundos/${nomeMundo}`)
        .then((response) => response.json())
        .then((json) => resolve(json))
        .catch((err) => reject(`Erro ao retornar mundo '${nomeMundo}'. Erro: ${err}`));
    });
  };

  api.salvarMundo = (nomeMundo, objMundo) => {
    return new Promise((resolve, reject) => {
        fetch(`${urlApi}/mundos/${nomeMundo}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({StrMundo: JSON.stringify(objMundo, null, 4)}, null, 4)
      }).then(response => resolve(response.json()))
      .catch(err => reject(`Erro ao salvar mundo '${nomeMundo}'. Erro: ${err}`));
    });
  };

  api.acessarFase = (nomeMundo, idFaseOrigem, direcao) => {
    return new Promise((resolve, reject) => {
      const direcaoFase = direcoesFase[direcao];
      if (!direcaoFase) {
        return console.error(`A direção '${direcao}' é inválida.`);
      }
  
      let idFaseDestino;
      let gerarNovaFase = false;

    api.retornarMundo(nomeMundo)
      .then(mundo => {
        mundo.fases.forEach((fase) => {
          if (fase.id === idFaseOrigem) {
            if(!fase[direcaoFase.origem]){
              fase[direcaoFase.origem] = api.gerarId();
              gerarNovaFase = true;
            }

            idFaseDestino = fase[direcaoFase.origem];
          }
        });
    
        if(gerarNovaFase){
          const novaFase = {
            id: idFaseDestino,
            partes: []
          };
    
          novaFase[direcaoFase.destino] = idFaseOrigem;
          
          mundo.fases.push(novaFase);
          
          api.salvarMundo(nomeMundo, mundo);
        }

        resolve(idFaseDestino);
      })
      .catch(err => reject(err));
    })

    
  };

  return api;
}
