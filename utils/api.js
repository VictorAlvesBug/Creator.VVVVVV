export default function createApi() {
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

  api.retornarMundo = async (nomeMundo) => {
    return new Promise((resolve, reject) => {
      fetch(`https://localhost:44320/mundos/${nomeMundo}`)
        .then((response) => response.json())
        .then((json) => resolve(json))
        .catch((err) => reject('Erro ao interpretar JSON do mundo-01'));
    });
  };

  api.salvarMundo = (nomeMundo, objMundo) => {
    return new Promise((resolve, reject) => {
        fetch(`https://localhost:44320/mundos/${nomeMundo}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({StrMundo: JSON.stringify(objMundo, null, 4)}, null, 4)
      }).then(response => resolve(response.json()))
      .catch(err => reject(err));
    });
  };

  api.criarFase = (nomeMundo, idFaseOrigem, direcao) => {
    const direcaoFase = direcoesFase[direcao];
    if (!direcaoFase) {
      return console.error(`A direção '${direcao}' é inválida.`);
    }

    const idFaseDestino = api.gerarId();

    const mundo = api.retornarMundo(nomeMundo);
    mundo.fases.map((fase) => {
      if (fase.id === idFaseOrigem) {
        fase[direcaoFase.origem] = idFaseDestino;
      }

      return fase;
    });

    const novaFase = {
      partes: [],
    };

    novaFase[direcaoFase.destino] = idFaseOrigem;

    mundo.fases.push(novaFase);

    api.salvarMundo(nomeMundo, mundo);
  };

  return api;
}
